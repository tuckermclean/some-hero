import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, TL } from '../src/constants.js';
import { enterTomb, exitTomb, descend, ascend } from '../src/world/zones.js';
import { handleStairs } from '../src/systems/stairs.js';
import { seededGame, blankGame, spyFx } from './helpers.js';

test('enterTomb stashes the overworld and lands on floor 1', () => {
  const game = seededGame(4), fx = spyFx();
  const owWorld = game.world, owEnemies = game.enemies, npcCount = game.npcs.length;
  assert.ok(npcCount > 0);

  enterTomb(game, fx);
  assert.equal(game.zone, 'tomb');
  assert.equal(game.floorNum, 1);
  assert.equal(game.deepest, 1);
  // the only resident down here is the vending machine
  assert.equal(game.npcs.length, 1);
  assert.equal(game.npcs[0].name, 'GLURP-O-MATIC');
  assert.equal(game.npcs[0].kind, 'machine');
  assert.notEqual(game.world, owWorld);
  assert.equal(game.owSave.world, owWorld);
  assert.equal(game.owSave.enemies, owEnemies);
  // player stands on the up-stairs
  const ptx = Math.floor(game.player.x / T), pty = Math.floor(game.player.y / T);
  assert.equal(game.world.map[pty * game.world.w + ptx], TL.SU);
});

test('exitTomb restores the overworld exactly', () => {
  const game = seededGame(4), fx = spyFx();
  const ow = { world: game.world, enemies: game.enemies, npcs: game.npcs, boss: game.boss,
               x: game.player.x, y: game.player.y };
  enterTomb(game, fx);
  exitTomb(game, fx);
  assert.equal(game.zone, 'ow');
  assert.equal(game.world, ow.world);
  assert.equal(game.enemies, ow.enemies);
  assert.equal(game.npcs, ow.npcs);
  assert.equal(game.boss, ow.boss);
  assert.equal(game.player.x, ow.x);
  assert.equal(game.player.y, ow.y);
  assert.equal(game.floorNum, 0);
  assert.equal(game.puzzle, null);
  assert.match(fx.last('toast')[1], /Depth record: 1/);
});

test('descend tracks the depth record and announces warden floors', () => {
  const game = seededGame(4), fx = spyFx();
  enterTomb(game, fx);
  descend(game, fx); descend(game, fx); descend(game, fx);  // -> floor 4
  assert.equal(game.floorNum, 4);
  assert.equal(game.deepest, 4);
  assert.match(fx.last('toast')[1], /performance review/);
  assert.ok(fx.calls.some(c => c[0] === 'sfx' && c[1] === 'boss'));
});

test('handleStairs fires only on entering a new tile', () => {
  const game = blankGame(), fx = spyFx();
  // mark the player's current tile as SD; tk already matches => no trigger
  const ptx = Math.floor(game.player.x / T), pty = Math.floor(game.player.y / T);
  game.world.map[pty * game.world.w + ptx] = TL.SD;
  assert.equal(handleStairs(game, fx), false);
});

test('sealed down-stairs toast instead of descending', () => {
  const game = seededGame(4), fx = spyFx();
  enterTomb(game, fx);
  // force an unsolved key puzzle and stand the player on the down-stairs
  game.puzzle = { type: 'key', have: false };
  for (let i = 0; i < game.world.map.length; i++) {
    if (game.world.map[i] === TL.SD) {
      game.player.x = (i % game.world.w) * T + T / 2;
      game.player.y = ((i / game.world.w) | 0) * T + T / 2;
      break;
    }
  }
  game.player.tk = 'stale';
  const before = game.floorNum;
  assert.equal(handleStairs(game, fx), false);
  assert.equal(game.floorNum, before);
  assert.match(fx.last('toast')[1], /bronze key/);

  // now grant the key and step on again
  game.puzzle.have = true;
  game.player.tk = 'stale';
  assert.equal(handleStairs(game, fx), true);
  assert.equal(game.floorNum, before + 1);
});

test('up-stairs from floor 1 exits; from deeper floors goes one floor up', () => {
  const game = seededGame(4), fx = spyFx();
  enterTomb(game, fx);
  descend(game, fx);                    // floor 2
  game.player.tk = 'stale';             // player descends onto the SU
  assert.equal(handleStairs(game, fx), true);
  assert.equal(game.floorNum, 1);
  assert.equal(game.zone, 'tomb');

  // ascending lands on the SD (the hole you came up through) — walk to
  // floor 1's SU to climb out
  for (let i = 0; i < game.world.map.length; i++) {
    if (game.world.map[i] === TL.SU) {
      game.player.x = (i % game.world.w) * T + T / 2;
      game.player.y = ((i / game.world.w) | 0) * T + T / 2;
      break;
    }
  }
  game.player.tk = 'stale';
  assert.equal(handleStairs(game, fx), true);
  assert.equal(game.zone, 'ow');        // floor 1 SU exits
});

// ---------- floors hold for the whole day; Skritch redecorates between ----------

test('floors persist within a run: your mess is where you left it', () => {
  const game = seededGame(41), fx = spyFx();
  enterTomb(game, fx);
  const f1world = game.world;
  // make a mess of floor 1
  game.enemies = game.enemies.filter((e, i) => i !== 0);   // one casualty, culled
  const enemyCount = game.enemies.length;
  game.pickups = [];                                        // loot all of it
  game.puzzle = { type: 'key', have: true };                // seal opened
  descend(game, fx);                                        // floor 2
  assert.notEqual(game.world, f1world);

  ascend(game, fx);                                         // back up
  assert.equal(game.floorNum, 1);
  assert.equal(game.world, f1world, 'floor 1 was NOT regenerated');
  assert.equal(game.enemies.length, enemyCount, 'the casualty stayed dead');
  assert.equal(game.pickups.length, 0, 'taken loot stayed taken');
  assert.equal(game.puzzle.have, true, 'the seal stayed open');
  assert.deepEqual(game.parts, [], 'particles reset');
});

test('ascending emerges from the down-stairs hole, not the up-stairs', () => {
  const game = seededGame(42), fx = spyFx();
  enterTomb(game, fx);
  descend(game, fx);                                        // floor 2
  ascend(game, fx);                                         // back to floor 1
  const ptx = Math.floor(game.player.x / T), pty = Math.floor(game.player.y / T);
  assert.equal(game.world.map[pty * game.world.w + ptx], TL.SD, 'standing on the SD');
  assert.equal(game.player.tk, ptx + ',' + pty, 'edge-trigger armed: no instant re-descend');
});

test('a new run is a new day: Skritch has redecorated', () => {
  const game = seededGame(43), fx = spyFx();
  enterTomb(game, fx);
  const day1floor1 = game.world;
  exitTomb(game, fx);
  enterTomb(game, fx);
  assert.notEqual(game.world, day1floor1, 'fresh layout on the new day');
  assert.match(fx.calls.filter(c => c[0] === 'toast').map(c => c[1]).join(' '), /Skritch has redecorated/);
});

test('a slain warden stays slain for the rest of the day', () => {
  const game = seededGame(44), fx = spyFx();
  enterTomb(game, fx);
  descend(game, fx); descend(game, fx); descend(game, fx);  // floor 4
  assert.equal(game.puzzle.type, 'warden');
  game.boss.dead = true;                                    // per his last attack
  ascend(game, fx);                                         // floor 3
  descend(game, fx);                                        // back to 4
  assert.equal(game.boss.dead, true, 'the performance review stays concluded');
});
