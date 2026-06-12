// The OST is diegetic: every track comes from somewhere, louder up close.
// musicSource/sourceGain are pure; playback stays browser-side.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ST } from '../src/constants.js';
import { musicSource, sourceGain } from '../src/audio/music.js';
import { mkBoss } from '../src/entities/boss.js';
import { blankGame } from './helpers.js';

test('the title screen plays Ledger Lightning Bolt, non-spatially', () => {
  const game = blankGame();
  game.state = ST.MENU;
  const s = musicSource(game);
  assert.equal(s.name, 'lightning');
  assert.equal(s.x, undefined, 'the title screen is its own source');
});

test('topside, the Guild Hall radio plays Audit Microwave from Hespeth\'s desk', () => {
  const game = blankGame();
  game.zone = 'ow';
  game.npcs = [{ name: 'Clerk Hespeth', x: 500, y: 600 }];
  const s = musicSource(game);
  assert.equal(s.name, 'microwave');
  assert.equal(s.x, 500);
  assert.equal(s.y, 600);
});

test('dungeon floors: Factory Synesthesia from the break room radio', () => {
  const game = blankGame();
  game.zone = 'tomb'; game.floorNum = 2;
  game.npcs = [{ name: 'GLURP-O-MATIC', kind: 'machine', x: 300, y: 300 }];
  const s = musicSource(game);
  assert.equal(s.name, 'factory');
  assert.equal(s.x, 300);
});

test('Performance Review radiates from the Warden; the final floor gets the apocalypse', () => {
  const game = blankGame();
  game.zone = 'tomb'; game.floorNum = 4;
  game.npcs = [{ name: 'GLURP-O-MATIC', kind: 'machine', x: 300, y: 300 }];
  game.boss = mkBoss(700, 700);
  let s = musicSource(game);
  assert.equal(s.name, 'review');
  assert.equal(s.x, 700, 'the review follows the reviewer');

  game.floorNum = 12;
  assert.equal(musicSource(game).name, 'apocalypse');

  // a concluded review reverts to the working-stiff station
  game.floorNum = 4;
  game.boss.dead = true;
  assert.equal(musicSource(game).name, 'factory');
});

test('Gumdrop Verdict: the activated Reenactor brings his own accompaniment', () => {
  const game = blankGame();
  game.zone = 'ow';
  game.npcs = [{ name: 'Clerk Hespeth', x: 500, y: 600 }];
  game.boss = mkBoss(900, 200);

  assert.equal(musicSource(game).name, 'microwave', 'asleep: just the radio');
  game.boss.state = 'idle';
  let s = musicSource(game);
  assert.equal(s.name, 'gumdrop');
  assert.equal(s.x, 900, 'the overture follows the performer');
  game.boss.state = 'dash';
  assert.equal(musicSource(game).name, 'gumdrop', 'any waking state performs');
  game.boss.dead = true;
  assert.equal(musicSource(game).name, 'microwave', 'the verdict is in; back to the radio');
});

test('sourceGain: full at the source, zero at range, linear between', () => {
  const src = { name: 'factory', x: 0, y: 0, range: 400, max: 0.4 };
  assert.equal(sourceGain(src, 0, 0), 0.4);
  assert.equal(sourceGain(src, 400, 0), 0);
  assert.equal(sourceGain(src, 1000, 0), 0);
  assert.ok(Math.abs(sourceGain(src, 200, 0) - 0.2) < 1e-9);
  assert.equal(sourceGain({ name: 'lightning', max: 0.4 }, 999, 999), 0.4, 'non-spatial ignores distance');
});
