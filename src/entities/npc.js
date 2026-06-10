// Pflumton-upon-Dungeon hub NPCs and proximity query.
// Twinned with Lesser Pflum (legally required).

import { T, VIL } from '../constants.js';

export const TALK_RANGE = 44;

export function villageNpcs() {
  return [
    { name: 'Clerk Hespeth',    x: (VIL.x - 2) * T,   y: (VIL.y - 2) * T,   col: '#5a7a9e', hat: '#f2d27a' },
    { name: 'Gift Shop Gnoll',  x: (VIL.x + 2.5) * T, y: (VIL.y - 1) * T,   col: '#9e5a5a', hat: '#e8c27a' },
    { name: 'Picketing Hero',   x: (VIL.x) * T,       y: (VIL.y + 2.5) * T, col: '#5a9e6f', hat: '#b06a4a' }
  ];
}

/** The NPC within talking range of (x,y), or null. */
export function nearestNpc(npcs, x, y, range = TALK_RANGE) {
  let found = null;
  for (const n of npcs) if (Math.hypot(n.x - x, n.y - y) < range) found = n;
  return found;
}
