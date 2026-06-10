import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, TL } from '../src/constants.js';
import { enterTomb, exitTomb, descend } from '../src/world/zones.js';
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
  assert.equal(game.npcs.length, 0);
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
  game.player.tk = 'stale';             // player spawns on SU each floor
  assert.equal(handleStairs(game, fx), true);
  assert.equal(game.floorNum, 1);       // 2 - 2 + 1
  assert.equal(game.zone, 'tomb');

  game.player.tk = 'stale';
  assert.equal(handleStairs(game, fx), true);
  assert.equal(game.zone, 'ow');        // floor 1 SU exits
});
