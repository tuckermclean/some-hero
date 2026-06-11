// Playtest mutations for the cheat menu. Headless and DOM-free: everything
// goes through the same zone/quest/meta functions the real game uses, so
// jumping around keeps every invariant (owSave stashed, runStats started,
// meta.runs ticked once per run, grading sane). The Ledger is watching;
// grades will be weird. They will also be true.

import { T, TL, VIL } from '../constants.js';
import { enterTomb, exitTomb, descend, restoreSurface } from '../world/zones.js';
import { hurtPlayer } from './combat.js';

/** An fx clone that holds its tongue (for intermediate floors of a jump). */
function muted(fx) {
  return { ...fx, toast() {}, sfx() {} };
}

/** Teleport to the Guild Hall. No grading, no customs — a pure escape. */
export function gotoVillage(game, fx) {
  if (game.zone === 'tomb' && game.owSave) {
    restoreSurface(game);
    game.owSave = null;
  }
  const p = game.player;
  p.x = (VIL.x + 1.5) * T;
  p.y = (VIL.y + 1.5) * T;
  p.tk = Math.floor(p.x / T) + ',' + Math.floor(p.y / T);
  fx.hudChanged();
  fx.questChanged();
}

/**
 * Teleport next to the dungeon trapdoor, carving one if the amulet hasn't
 * opened it yet — stepping on it exercises the real golem-entry path.
 */
export function gotoTrapdoor(game, fx) {
  if (game.zone === 'tomb') gotoVillage(game, fx);
  let sd = -1;
  for (let i = 0; i < game.world.map.length; i++) {
    if (game.world.map[i] === TL.SD) { sd = i; break; }
  }
  if (sd < 0) {
    sd = (VIL.y + 1) * game.world.w + (VIL.x + 5);
    game.world.map[sd] = TL.SD;
    fx.toast('A trapdoor has been installed. The renovation imps were not consulted.');
  }
  const tx = sd % game.world.w, ty = (sd / game.world.w) | 0;
  const p = game.player;
  p.x = (tx - 1) * T + T / 2;  // adjacent, so the step onto it is yours
  p.y = ty * T + T / 2;
  p.tk = Math.floor(p.x / T) + ',' + Math.floor(p.y / T);
  fx.hudChanged();
}

/**
 * Jump to dungeon floor n through the real zone functions. From topside this
 * starts a genuine run (owSave, runStats, meta.runs/day). Intermediate floors
 * are generated mutely; the destination announces itself.
 */
export function gotoFloor(game, n, fx) {
  const quiet = muted(fx);
  if (game.zone !== 'tomb') {
    enterTomb(game, n === 1 ? fx : quiet);   // lands on floor 1
  }
  if (game.floorNum > n) {
    game.floorNum = n - 1;                   // the stairs.js "go up" idiom
    descend(game, fx);
    return;
  }
  while (game.floorNum < n - 1) descend(game, quiet);
  if (game.floorNum < n) descend(game, fx);
}

/** Leave through the door: real grading, real customs (if you carry gold). */
export function surfaceViaDoor(game, fx) {
  if (game.zone !== 'tomb') return;
  exitTomb(game, fx);
}

/** Set the overworld quest stage, keeping the kill counter consistent. */
export function setQuestStage(game, n, fx) {
  game.quest.stage = n;
  if (n <= 1) game.quest.kills = 0;
  else game.quest.kills = game.quest.need;
  fx.questChanged();
}

/** Die, properly: through the real death path, despite i-frames. */
export function dieNow(game, fx) {
  game.player.inv = 0;
  hurtPlayer(game, game.player.hp + 999, fx, game.lastHitBy);
}

/** Stage a customs inspection. In the tomb: the real thing, at the door. */
export function triggerCustoms(game, fx) {
  if (game.zone === 'tomb') {
    game.runStats.goldGained = Math.max(12, game.runStats.goldGained);
    exitTomb(game, fx);
  } else {
    fx.toast('(dry run — the golem will inspect 12 imaginary gold)');
    fx.onGolemCustoms(12, () => {});
  }
}

/** Drop the Commemorative Medallion at the player's feet; the magnet does the rest. */
export function triggerWin(game, fx) {
  game.pickups.push({ kind: 'amulet', x: game.player.x, y: game.player.y, v: 1 });
  fx.toast('A prop has been misplaced in your direction.');
}
