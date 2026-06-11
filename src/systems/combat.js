// Combat resolution: damage formulas, hitting enemies, hurting the player.

import { ST } from '../constants.js';
import { burst } from '../entities/particles.js';
import { gainXp } from './progression.js';
import { dropLoot } from './loot.js';
import { recordScarabKill } from './quest.js';
import { union206Line } from './ledger.js';

/** Player melee damage from sword tier + level. */
export function swordDmg(player) {
  return [0, 2, 4, 6][player.swordLv] + ((player.lv - 1) >> 1);
}

/**
 * Damage the player. Respects invulnerability frames; grants 1.1s i-frames
 * on a hit. Switches state to DEAD at 0 hp. Returns true if damage landed.
 */
export function hurtPlayer(game, dmg, fx, cause = null) {
  const p = game.player;
  if (p.inv > 0) return false;
  if (cause) game.lastHitBy = cause;
  p.hp -= dmg;
  p.inv = 1.1;
  fx.sfx('hurt');
  burst(game.parts, p.x, p.y, 10, '#e0644b', game.rng);
  fx.hudChanged();
  if (p.hp <= 0) {
    game.state = ST.DEAD;
    fx.onPlayerDeath();
  }
  return true;
}

/**
 * Damage an enemy: flash, knockback, death -> xp, loot, quest progress.
 */
export function hitEnemy(game, e, dmg, kx, ky, fx) {
  e.hp -= dmg;
  e.flash = .15;
  e.kb = .18; e.kbx = kx; e.kby = ky;
  fx.sfx('hit');
  burst(game.parts, e.x, e.y, 6, e.col || '#fff', game.rng);
  if (e.hp <= 0 && !e.dead) {
    e.dead = true;
    game.runStats.kills++;
    game.runStats.killsByKind[e.kind] = (game.runStats.killsByKind[e.kind] || 0) + 1;
    // the first Front Office casualty of each run was a union member
    if (game.zone === 'tomb' && game.floorNum <= 4 && game.runStats.kills === 1) {
      fx.toast(union206Line());
    }
    gainXp(game, e.xpv, fx);
    dropLoot(game.pickups, e.x, e.y, game.rng);
    if (e.kind === 'scarab' && recordScarabKill(game.quest)) fx.questChanged();
  }
}
