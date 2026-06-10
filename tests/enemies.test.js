import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, TL } from '../src/constants.js';
import { updateEnemies } from '../src/systems/enemies.js';
import { mkEnemy, ENEMY_TYPES, pickTombKind } from '../src/entities/enemy.js';
import { mulberry32 } from '../src/core/rng.js';
import { blankGame, spyFx, VIEW } from './helpers.js';

test('mkEnemy copies the archetype', () => {
  const e = mkEnemy('mummy', 10, 20);
  assert.equal(e.hp, ENEMY_TYPES.mummy.hp);
  assert.equal(e.w, ENEMY_TYPES.mummy.r * 2);
  assert.equal(e.ghost, false);
  assert.equal(mkEnemy('spirit', 0, 0).ghost, true);
});

test('pickTombKind: mummies only from floor 3+', () => {
  for (let s = 0; s < 200; s++) {
    assert.notEqual(pickTombKind(1, mulberry32(s)), 'mummy');
  }
  let sawMummy = false;
  for (let s = 0; s < 200; s++) if (pickTombKind(5, mulberry32(s)) === 'mummy') sawMummy = true;
  assert.ok(sawMummy);
});

test('aggro: an enemy in range moves toward the player', () => {
  const game = blankGame(), fx = spyFx();
  const e = mkEnemy('jackal', game.player.x + 100, game.player.y);
  game.enemies = [e];
  const x0 = e.x;
  updateEnemies(game, 1 / 60, VIEW, fx);
  assert.ok(e.x < x0);
});

test('out of aggro range the enemy wanders instead', () => {
  const game = blankGame({ w: 60, h: 60 }), fx = spyFx();
  const e = mkEnemy('scarab', game.player.x + 1000, game.player.y);  // aggro 150
  game.enemies = [e];
  updateEnemies(game, 1 / 60, VIEW, fx);
  assert.ok(e.wt > 0, 'picked a wander heading');
});

test('ghosts phase through walls; solid enemies do not', () => {
  const game = blankGame({ w: 20, h: 20 }), fx = spyFx();
  // wall column between enemy and player
  const wallX = Math.floor(game.player.x / T) + 2;
  for (let y = 0; y < 20; y++) game.world.map[y * 20 + wallX] = TL.ROCK;
  const ghost = mkEnemy('spirit', (wallX + 2) * T, game.player.y);
  const solid = mkEnemy('mummy', (wallX + 2) * T, game.player.y + 4);
  game.enemies = [ghost, solid];
  const gx0 = ghost.x, sx0 = solid.x;
  for (let i = 0; i < 120; i++) updateEnemies(game, 1 / 30, VIEW, fx);
  assert.ok(ghost.x < gx0 - T, 'ghost crossed toward the player');
  // the solid enemy is stopped at the wall, strictly right of it
  assert.ok(solid.x > wallX * T, 'mummy held back by the wall');
  assert.ok(solid.x <= sx0, 'mummy did not pass');
});

test('knockback overrides chasing', () => {
  const game = blankGame(), fx = spyFx();
  const e = mkEnemy('jackal', game.player.x + 60, game.player.y);
  e.kb = .18; e.kbx = 140; e.kby = 0;
  game.enemies = [e];
  const x0 = e.x;
  updateEnemies(game, 1 / 60, VIEW, fx);
  assert.ok(e.x > x0, 'pushed away despite aggro');
});

test('contact deals damage; dead enemies are culled', () => {
  const game = blankGame(), fx = spyFx();
  const toucher = mkEnemy('scarab', game.player.x + 5, game.player.y);
  const corpse = mkEnemy('scarab', 50, 50);
  corpse.dead = true;
  game.enemies = [toucher, corpse];
  updateEnemies(game, 1 / 60, VIEW, fx);
  assert.equal(game.player.hp, 10 - toucher.dmg);
  assert.equal(game.enemies.length, 1);
  assert.equal(game.enemies[0], toucher);
});

test('far off-screen enemies are skipped entirely', () => {
  const game = blankGame({ w: 100, h: 100 }), fx = spyFx();
  const e = mkEnemy('jackal', game.player.x + VIEW.w * 2, game.player.y);
  game.enemies = [e];
  const x0 = e.x;
  updateEnemies(game, 1 / 60, VIEW, fx);
  assert.equal(e.x, x0);
});
