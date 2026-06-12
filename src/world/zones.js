// Zone transitions: overworld <-> tomb, descending and ascending floors.

import { T } from '../constants.js';
import { generateFloor } from './floorgen.js';
import { startRun, recordDepth } from '../core/meta.js';
import { newRunStats, gradeRun, gradeRemark } from '../systems/ledger.js';
import { accrueInterest } from '../systems/credit.js';
import { floorLine } from '../content/floors.js';

/** Restore the stashed overworld exactly (no grading, no customs — just the
 *  world swap). The single source of truth for climbing out. */
export function restoreSurface(game) {
  const s = game.owSave;
  game.world = s.world;
  game.enemies = s.enemies; game.pickups = s.pickups; game.npcs = s.npcs; game.boss = s.boss;
  game.blocks = []; game.plates = []; game.torches = []; game.traps = []; game.puzzle = null;
  game.parts = [];
  game.zone = 'ow';
  game.floorNum = 0;
}

/** Apply a generated floor to the game and place the player on the up-stairs. */
export function applyFloor(game, f) {
  // load-bearing rooms the renovation imps can't move
  const pins = [{ w: 5, h: 4, tag: 'breakroom' }];   // the imp break area
  if (f === 3) pins.push({ w: 4, h: 3, tag: 'gap' }); // MIND THE GAP (guestbook inside)
  const g = generateFloor(f, game.world.h2, game.rng, pins,
    { forceSeal: game.debug && game.debug.forceSeal });
  game.world = g.world;
  game.enemies = g.enemies; game.pickups = g.pickups; game.parts = [];
  game.blocks = g.blocks; game.plates = g.plates; game.torches = g.torches;
  game.traps = g.traps; game.puzzle = g.puzzle; game.boss = g.boss;
  // the break room's vending machine is an NPC: TALK to it. it's fine.
  const breakroom = g.pinnedRooms.find(r => r.tag === 'breakroom');
  game.npcs = breakroom
    ? [{ name: 'GLURP-O-MATIC', kind: 'machine', x: breakroom.cx * T + T / 2, y: breakroom.cy * T + T / 2 - 8 }]
    : [];
  game.player.x = g.spawn.cx * T + T / 2;
  game.player.y = g.spawn.cy * T + T / 2;
  game.player.tk = g.spawn.cx + ',' + g.spawn.cy;
}

/** Go one floor deeper (also used to re-enter a floor from above). */
export function descend(game, fx) {
  game.floorNum++;
  game.deepest = Math.max(game.deepest, game.floorNum);
  game.runStats.depth = Math.max(game.runStats.depth, game.floorNum);
  applyFloor(game, game.floorNum);
  fx.toast(floorLine(game.floorNum));
  if (game.floorNum % 4 === 0) fx.sfx('boss');
}

/** Step onto the trapdoor in the overworld: stash the overworld, descend to floor 1. */
export function enterTomb(game, fx) {
  game.owSave = {
    world: game.world,
    enemies: game.enemies, pickups: game.pickups, npcs: game.npcs, boss: game.boss,
    x: game.player.x, y: game.player.y
  };
  game.npcs = [];
  game.zone = 'tomb';
  game.floorNum = 0;
  game.runStats = newRunStats();
  startRun(game.meta);
  // one excursion = one month (see the Truth in Lending form, clause 3)
  const interest = accrueInterest(game.meta);
  fx.toast('Day ' + game.meta.day + '. Run #' + game.meta.runs + '. NOW LEAVING: SAFETY.');
  if (interest > 0) fx.toast('Your account has accrued ' + interest + ' g interest. (See Schedule B.)');
  descend(game, fx);
}

/** Climb out of floor 1 back into the saved overworld. */
export function exitTomb(game, fx) {
  const surface = () => {
    const s = game.owSave;
    game.player.x = s.x; game.player.y = s.y;
    game.player.tk = Math.floor(s.x / T) + ',' + Math.floor(s.y / T);
    restoreSurface(game);
    // the Ledger grades the run BEFORE recording the depth, so a personal best
    // counts in your favor exactly once
    const grade = gradeRun(game.meta, { ...game.runStats, died: false });
    game.meta.grades.push(grade);
    recordDepth(game.meta, game.deepest);
    fx.toast('Daylight. Depth record: ' + game.deepest + '. Run grade: ' + grade + '. ' + gradeRemark(grade));
    fx.questChanged();
  };
  // customs: the Door Golem would like a word about that gold — AT the door,
  // before you see daylight, so the inspection happens where inspections happen
  if (game.runStats.goldGained > 0) fx.onGolemCustoms(game.runStats.goldGained, surface);
  else surface();
}
