// The player's sword swing: cooldown, strike point, brazier lighting,
// enemy hits, boss hits and boss death rewards.

import { burst } from '../entities/particles.js';
import { swordDmg, hitEnemy } from './combat.js';
import { gainXp } from './progression.js';
import { igniteBraziers } from './puzzles.js';

export const STRIKE_REACH = 24;  // hand offset from player center
export const STRIKE_R = 30;      // strike radius around the hand

/**
 * Resolve one buffered attack if the cooldown allows. Returns true if a
 * swing happened. (NPC interaction is decided by the caller before this.)
 */
export function playerAttack(game, fx) {
  const p = game.player;
  if (game.input.atkBuf <= 0 || p.atkT > 0) return false;
  game.input.atkBuf = 0;
  p.atkT = .34;
  fx.sfx('swing');

  const fm = Math.hypot(p.fx, p.fy) || 1, fxd = p.fx / fm, fyd = p.fy / fm;
  const hx = p.x + fxd * STRIKE_REACH, hy = p.y + fyd * STRIKE_REACH, R = STRIKE_R;

  // light braziers
  if (game.zone === 'tomb') igniteBraziers(game, hx, hy, R, fx);

  // enemies
  for (const e of game.enemies) {
    if (e.dead) continue;
    if (Math.hypot(e.x - hx, e.y - hy) < R + e.w / 2) {
      hitEnemy(game, e, swordDmg(p), fxd * 140, fyd * 140, fx);
    }
  }

  // boss
  const b = game.boss;
  if (b && !b.dead && Math.hypot(b.x - hx, b.y - hy) < R + b.w / 2) {
    b.hp -= swordDmg(p);
    b.flash = .15;
    fx.sfx('hit');
    burst(game.parts, b.x, b.y - 10, 8, '#c9b08a', game.rng);
    if (b.state === 'sleep') { b.state = 'idle'; b.timer = 1; fx.sfx('boss'); }
    if (b.hp <= 0 && !b.dead) killBoss(game, fx);
  }
  return true;
}

/** Boss death: rewards differ between the overworld Guardian and tomb Wardens. */
export function killBoss(game, fx) {
  const b = game.boss;
  b.dead = true;
  fx.sfx('win');
  burst(game.parts, b.x, b.y, 36, '#f2d27a', game.rng);
  if (game.zone === 'ow') {
    gainXp(game, 100, fx);
    game.pickups.push({ kind: 'amulet', x: b.x, y: b.y, v: 1 });
    for (let i = 0; i < 6; i++) {
      game.pickups.push({ kind: 'gold', x: b.x + (game.rng() - .5) * 50, y: b.y + (game.rng() - .5) * 50, v: 3 });
    }
  } else {
    gainXp(game, 60 + game.floorNum * 15, fx);
    game.pickups.push({ kind: 'maxheart', x: b.x, y: b.y, v: 2 });
    for (let i = 0; i < 5; i++) {
      game.pickups.push({ kind: 'gold', x: b.x + (game.rng() - .5) * 50, y: b.y + (game.rng() - .5) * 50, v: 3 });
    }
    if (game.floorNum >= 4 && game.player.swordLv < 3 && game.rng() < .6) {
      game.pickups.push({ kind: 'sword', x: b.x, y: b.y + 24, v: 1 });
    }
    fx.toast(b.name === 'the Middle Manager'
      ? 'Per his last attack: none. The stairs open.'
      : 'The Warden falls — the stairs open.');
  }
}
