// Populate a freshly generated overworld with enemies, the sleeping
// Tomb Guardian in the ruins, and the village NPCs.

import { T, TL, VIL, RUIN } from '../constants.js';
import { tileAt } from './tilemap.js';
import { mkEnemy } from '../entities/enemy.js';
import { mkBoss } from '../entities/boss.js';
import { villageNpcs } from '../entities/npc.js';

export function spawnOverworld(world, rng = Math.random) {
  const enemies = [];
  const onSand = (x, y) => {
    const v = tileAt(world, x, y);
    return v === TL.SAND || v === TL.DUNE || v === TL.ROAD;
  };

  let tries = 0;
  while (enemies.length < 26 && tries++ < 3000) {
    const x = 2 + (rng() * (world.w - 4)) | 0, y = 2 + (rng() * (world.h - 4)) | 0;
    if (!onSand(x, y)) continue;
    if (Math.hypot(x - VIL.x, y - VIL.y) < 11) continue;                       // village safe zone
    if (x >= RUIN.x0 - 2 && x <= RUIN.x1 + 2 && y >= RUIN.y0 - 2 && y <= RUIN.y1 + 2) continue;
    enemies.push(mkEnemy(rng() < .62 ? 'scarab' : 'jackal', x * T + T / 2, y * T + T / 2));
  }

  // spirits haunting the ruins
  for (let i = 0; i < 6; i++) {
    const x = RUIN.x0 + 2 + (rng() * (RUIN.x1 - RUIN.x0 - 4)) | 0,
          y = RUIN.y0 + 2 + (rng() * (RUIN.y1 - RUIN.y0 - 4)) | 0;
    if (tileAt(world, x, y) === TL.RFLOOR) enemies.push(mkEnemy('spirit', x * T + T / 2, y * T + T / 2));
  }

  const boss = mkBoss(((RUIN.x0 + RUIN.x1) / 2) * T, ((RUIN.y0 + RUIN.y1) / 2 - 1) * T, { hp: 40, dmg: 2 });
  const npcs = villageNpcs();

  return { enemies, boss, npcs };
}
