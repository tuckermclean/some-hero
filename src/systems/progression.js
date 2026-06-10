// Experience and levelling.

import { burst } from '../entities/particles.js';

export function xpNeed(player) {
  return 18 + player.lv * 14;
}

/** Grant XP; handles multi-level-ups (+2 max HP and a full heal per level). */
export function gainXp(game, n, fx) {
  const p = game.player;
  p.xp += n;
  while (p.xp >= xpNeed(p)) {
    p.xp -= xpNeed(p);
    p.lv++;
    p.maxhp += 2;
    p.hp = p.maxhp;
    fx.sfx('level');
    burst(game.parts, p.x, p.y, 18, '#f2d27a', game.rng);
  }
  fx.hudChanged();
}
