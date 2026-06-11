import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ST } from '../src/constants.js';
import { swordDmg, hurtPlayer, hitEnemy } from '../src/systems/combat.js';
import { mkEnemy } from '../src/entities/enemy.js';
import { blankGame, spyFx } from './helpers.js';

test('swordDmg follows the tier + level formula', () => {
  assert.equal(swordDmg({ swordLv: 1, lv: 1 }), 2);
  assert.equal(swordDmg({ swordLv: 2, lv: 1 }), 4);
  assert.equal(swordDmg({ swordLv: 3, lv: 1 }), 6);
  assert.equal(swordDmg({ swordLv: 1, lv: 3 }), 3);  // +1 per 2 levels past 1
  assert.equal(swordDmg({ swordLv: 3, lv: 7 }), 9);
});

test('hurtPlayer applies damage, grants i-frames, and is blocked during them', () => {
  const game = blankGame(), fx = spyFx();
  assert.equal(hurtPlayer(game, 3, fx), true);
  assert.equal(game.player.hp, 7);
  assert.equal(game.player.inv, 1.1);
  assert.equal(hurtPlayer(game, 3, fx), false);  // i-frames
  assert.equal(game.player.hp, 7);
  assert.equal(fx.count('sfx'), 1);
  assert.equal(fx.count('hudChanged'), 1);
});

test('hurtPlayer kills at 0 hp: DEAD state + onPlayerDeath', () => {
  const game = blankGame(), fx = spyFx();
  game.player.hp = 2;
  hurtPlayer(game, 5, fx);
  assert.equal(game.state, ST.DEAD);
  assert.equal(fx.count('onPlayerDeath'), 1);
});

test('hitEnemy damages, knocks back, flashes', () => {
  const game = blankGame(), fx = spyFx();
  const e = mkEnemy('jackal', 100, 100);
  hitEnemy(game, e, 2, 140, 0, fx);
  assert.equal(e.hp, 4);
  assert.equal(e.dead, false);
  assert.equal(e.kbx, 140);
  assert.ok(e.flash > 0 && e.kb > 0);
  assert.ok(game.parts.length > 0);
});

test('killing an enemy grants xp and drops loot', () => {
  const game = blankGame(), fx = spyFx();
  const e = mkEnemy('scarab', 100, 100);
  hitEnemy(game, e, 99, 0, 0, fx);
  assert.equal(e.dead, true);
  assert.equal(game.player.xp, e.xpv);          // 6 xp, below first level-up
  assert.ok(game.pickups.length >= 1);          // at least the gold scatter
  assert.ok(game.pickups.every(p => ['gold', 'heart', 'potion'].includes(p.kind)));
});

test('scarab kills advance the hunt quest and flip it to claim stage', () => {
  const game = blankGame(), fx = spyFx();
  game.quest.stage = 1; game.quest.kills = 0; game.quest.need = 5;
  for (let i = 0; i < 5; i++) {
    hitEnemy(game, mkEnemy('scarab', 0, 0), 99, 0, 0, fx);
  }
  assert.equal(game.quest.kills, 5);
  assert.equal(game.quest.stage, 2);
  assert.equal(fx.count('questChanged'), 5);
});

test('non-scarab kills do not touch the quest', () => {
  const game = blankGame(), fx = spyFx();
  game.quest.stage = 1;
  hitEnemy(game, mkEnemy('jackal', 0, 0), 99, 0, 0, fx);
  assert.equal(game.quest.kills, 0);
});

test('the first Front Office kill of a run is a Local 206 member; only the first', () => {
  const game = blankGame(), fx = spyFx();
  game.zone = 'tomb'; game.floorNum = 2;
  hitEnemy(game, mkEnemy('jackal', 0, 0), 99, 0, 0, fx);
  assert.ok(fx.calls.some(c => c[0] === 'toast' && /Local 206/.test(c[1])));
  hitEnemy(game, mkEnemy('jackal', 0, 0), 99, 0, 0, fx);
  assert.equal(fx.calls.filter(c => c[0] === 'toast' && /Local 206/.test(c[1])).length, 1);

  // below the Front Office, the dead are non-union
  const game2 = blankGame(), fx2 = spyFx();
  game2.zone = 'tomb'; game2.floorNum = 5;
  hitEnemy(game2, mkEnemy('jackal', 0, 0), 99, 0, 0, fx2);
  assert.ok(!fx2.calls.some(c => c[0] === 'toast' && /Local 206/.test(c[1])));

  // and the overworld is a certified Safe Workplace
  const game3 = blankGame(), fx3 = spyFx();
  hitEnemy(game3, mkEnemy('scarab', 0, 0), 99, 0, 0, fx3);
  assert.ok(!fx3.calls.some(c => c[0] === 'toast' && /Local 206/.test(c[1])));
});
