// Drinking a potion: +6 hp, only while playing, only if hurt and stocked.

import { ST } from '../constants.js';
import { burst } from '../entities/particles.js';

export function usePotion(game, fx) {
  const p = game.player;
  if (game.state !== ST.PLAY || p.potions <= 0 || p.hp >= p.maxhp) return false;
  p.potions--;
  p.hp = Math.min(p.maxhp, p.hp + 6);
  game.runStats.glurpsDrunk++;
  fx.sfx('heal');
  burst(game.parts, p.x, p.y, 10, '#74c4b8', game.rng);
  fx.hudChanged();
  return true;
}
