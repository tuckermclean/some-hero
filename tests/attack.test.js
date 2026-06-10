import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, TL } from '../src/constants.js';
import { playerAttack, killBoss } from '../src/systems/attack.js';
import { bufferAttack } from '../src/systems/movement.js';
import { mkEnemy } from '../src/entities/enemy.js';
import { mkBoss } from '../src/entities/boss.js';
import { blankGame, spyFx } from './helpers.js';

test('attack needs a buffered press and respects the cooldown', () => {
  const game = blankGame(), fx = spyFx();
  assert.equal(playerAttack(game, fx), false);   // nothing buffered
  bufferAttack(game);
  assert.equal(playerAttack(game, fx), true);
  assert.equal(game.player.atkT, .34);
  bufferAttack(game);
  assert.equal(playerAttack(game, fx), false);   // still cooling down
});

test('swing hits enemies in front, not behind', () => {
  const game = blankGame(), fx = spyFx();
  game.player.fx = 1; game.player.fy = 0;
  const front = mkEnemy('scarab', game.player.x + 40, game.player.y);
  const behind = mkEnemy('scarab', game.player.x - 40, game.player.y);
  game.enemies = [front, behind];
  bufferAttack(game);
  playerAttack(game, fx);
  assert.ok(front.hp < front.maxhp, 'front enemy hit');
  assert.equal(behind.hp, behind.maxhp, 'behind enemy untouched');
});

test('swing lights a brazier in the tomb', () => {
  const game = blankGame({ fill: TL.TF }), fx = spyFx();
  game.zone = 'tomb';
  game.puzzle = { type: 'torch', n: 1, time: 8, solved: false };
  const tx = Math.floor((game.player.x + 30) / T), ty = Math.floor(game.player.y / T);
  game.torches = [{ tx, ty, lit: false, tm: 0 }];
  game.player.fx = 1; game.player.fy = 0;
  bufferAttack(game);
  playerAttack(game, fx);
  assert.equal(game.torches[0].lit, true);
  assert.equal(game.puzzle.solved, true);
});

test('hitting the sleeping boss wakes it', () => {
  const game = blankGame(), fx = spyFx();
  game.boss = mkBoss(game.player.x + 40, game.player.y);
  bufferAttack(game);
  playerAttack(game, fx);
  assert.ok(game.boss.hp < game.boss.maxhp);
  assert.equal(game.boss.state, 'idle');
});

test('overworld guardian death drops the amulet + gold and grants 100 xp', () => {
  const game = blankGame(), fx = spyFx();
  game.zone = 'ow';
  game.boss = mkBoss(200, 200, { hp: 1 });
  killBoss(game, fx);
  assert.ok(game.boss.dead);
  assert.equal(game.pickups.filter(p => p.kind === 'amulet').length, 1);
  assert.equal(game.pickups.filter(p => p.kind === 'gold').length, 6);
  assert.ok(game.player.lv > 1, '100 xp levels up from lv1');
});

test('tomb warden death drops a maxheart (and maybe a sword on deep floors)', () => {
  const game = blankGame(), fx = spyFx();
  game.zone = 'tomb'; game.floorNum = 8;
  game.player.swordLv = 1;
  game.boss = mkBoss(200, 200, { hp: 1 });
  killBoss(game, fx);
  assert.equal(game.pickups.filter(p => p.kind === 'maxheart').length, 1);
  assert.equal(game.pickups.filter(p => p.kind === 'amulet').length, 0);
  assert.match(fx.last('toast')[1], /Warden falls/);
});

test('full swing kill: attack -> dead enemy -> xp + loot', () => {
  const game = blankGame(), fx = spyFx();
  const e = mkEnemy('scarab', game.player.x + 40, game.player.y);
  e.hp = 1;
  game.enemies = [e];
  bufferAttack(game);
  playerAttack(game, fx);
  assert.ok(e.dead);
  assert.ok(game.player.xp > 0);
  assert.ok(game.pickups.length > 0);
});
