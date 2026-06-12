// Pflumton-upon-Dungeon hub NPCs and proximity query.
// Twinned with Lesser Pflum (legally required).

import { T, VIL } from '../constants.js';

export const TALK_RANGE = 44;

export function villageNpcs() {
  return [
    { name: 'Clerk Hespeth',    x: (VIL.x - 2) * T,   y: (VIL.y - 2) * T,   col: '#3f5d7a', hat: '#3f8f5a' },
    // her radio, on the desk. the light set. the dial is settled law.
    { name: "Hespeth's Radio",  x: (VIL.x - 3.5) * T, y: (VIL.y - 2) * T,   kind: 'radio' },
    // the shop sits at the village edge so its jingle is a destination,
    // not a roommate of the resurrection desk
    { name: 'Gift Shop Gnoll',  x: (VIL.x + 5) * T,   y: (VIL.y - 1) * T,   col: '#a07232', hat: '#c0392b' },
    { name: 'Picketing Hero',   x: (VIL.x) * T,       y: (VIL.y + 2.5) * T, col: '#4f8f8f', hat: '#c9a227' },
    // ambient residents: one bit each, defended forever
    { name: 'Docent Brell',     x: (VIL.x + 4) * T,   y: (VIL.y + 1.5) * T, col: '#7a4a6e', hat: '#c9a227' },
    { name: 'King Pfilbert',    x: (VIL.x - 4) * T,   y: (VIL.y + 1) * T,   col: '#5e3a8f', hat: '#e0b73d' },
    { name: 'Safety Officer Dimwald', x: (VIL.x - 1.5) * T, y: (VIL.y + 4) * T, col: '#d97b29', hat: '#eeeeee' },
    // away from the group, on purpose, with inventory
    { name: 'Hermit Gorse', x: (VIL.x - 9) * T, y: (VIL.y - 1) * T, col: '#6e6a52', hat: '#8a8f76' }
  ];
}

/** The NPC within talking range of (x,y), or null. */
export function nearestNpc(npcs, x, y, range = TALK_RANGE) {
  let found = null;
  for (const n of npcs) if (Math.hypot(n.x - x, n.y - y) < range) found = n;
  return found;
}
