// Tomb floor generation. Rooms are carved then chained with L-corridors in
// sequence, so the floor is always fully connected. Each floor gets one
// seal puzzle: a Warden fight every 4th floor, otherwise key / plates /
// braziers at random.

import { T, TL, TOMB } from '../constants.js';
import { tileWalkable } from './tilemap.js';
import { mkEnemy, pickTombKind } from '../entities/enemy.js';
import { mkBoss, wardenStats } from '../entities/boss.js';

/**
 * @param {number} f      floor number (1-based)
 * @param {function} h2   hash2 (only used by the renderer for decoration; carried on world)
 * @param {function} rng  Math.random-compatible
 * @param {Array}  pinned "load-bearing rooms" the renovation imps can't move:
 *                        [{ w, h, tag }] — always generated, always connected,
 *                        returned in result.pinnedRooms with their tag so story
 *                        content can be placed inside.
 */
export function generateFloor(f, h2, rng = Math.random, pinned = []) {
  const w = TOMB.W, h = TOMB.H;
  const map = new Uint8Array(w * h).fill(TL.TW);
  const world = { map, w, h, h2 };
  const enemies = [], pickups = [], blocks = [], plates = [], torches = [];
  let boss = null, puzzle = null;

  // ---- carve rooms + sequential L-corridors ----
  const rooms = [];
  const nR = 6 + Math.min(4, f >> 1);
  for (let i = 0; i < nR; i++) {
    const rw = 4 + (rng() * 5 | 0), rh = 4 + (rng() * 4 | 0);
    const x = 2 + (rng() * (w - rw - 4) | 0), y = 2 + (rng() * (h - rh - 4) | 0);
    rooms.push({ x, y, w: rw, h: rh, cx: x + (rw >> 1), cy: y + (rh >> 1) });
    for (let yy = y; yy < y + rh; yy++) for (let xx = x; xx < x + rw; xx++) map[yy * w + xx] = TL.TF;
  }
  // pinned rooms join the same chain, so connectivity is inherited
  const pinnedRooms = [];
  for (const spec of pinned) {
    const rw = Math.max(3, Math.min(spec.w || 5, w - 6));
    const rh = Math.max(3, Math.min(spec.h || 4, h - 6));
    const x = 2 + (rng() * (w - rw - 4) | 0), y = 2 + (rng() * (h - rh - 4) | 0);
    const room = { x, y, w: rw, h: rh, cx: x + (rw >> 1), cy: y + (rh >> 1), tag: spec.tag };
    rooms.push(room);
    pinnedRooms.push(room);
    for (let yy = y; yy < y + rh; yy++) for (let xx = x; xx < x + rw; xx++) map[yy * w + xx] = TL.TF;
  }
  for (let i = 1; i < rooms.length; i++) {
    let a = rooms[i - 1], b = rooms[i], x = a.cx, y = a.cy;
    while (x !== b.cx) { map[y * w + x] = TL.TF; x += Math.sign(b.cx - x); }
    while (y !== b.cy) { map[y * w + x] = TL.TF; y += Math.sign(b.cy - y); }
    map[y * w + x] = TL.TF;
  }

  // ---- spawn room = first; exit = farthest non-pinned room ----
  const spawn = rooms[0];
  let exitR = rooms[1], best = -1;
  for (let i = 1; i < rooms.length; i++) {
    if (rooms[i].tag) continue;  // pinned rooms hold story content, not stairs
    const d = Math.hypot(rooms[i].cx - spawn.cx, rooms[i].cy - spawn.cy);
    if (d > best) { best = d; exitR = rooms[i]; }
  }
  map[spawn.cy * w + spawn.cx] = TL.SU;
  map[exitR.cy * w + exitR.cx] = TL.SD;

  const midRooms = rooms.filter(r => r !== spawn && r !== exitR && !r.tag);
  const pickRoom = () => midRooms.length ? midRooms[(rng() * midRooms.length) | 0] : exitR;
  const freeSpotIn = r => {
    for (let k = 0; k < 40; k++) {
      const tx = r.x + 1 + (rng() * Math.max(1, r.w - 2)) | 0,
            ty = r.y + 1 + (rng() * Math.max(1, r.h - 2)) | 0;
      if (tileWalkable(world, blocks, tx, ty)) return { tx, ty };
    }
    return { tx: r.cx, ty: r.cy };
  };

  // ---- seal puzzle ----
  if (f % 4 === 0) {
    puzzle = { type: 'warden' };
    const s = wardenStats(f);
    boss = mkBoss(exitR.cx * T, (exitR.cy - 1) * T, s);
  } else {
    const types = ['key', 'plates', 'torch', 'riddle'];
    const ty = types[(rng() * 4) | 0];
    if (ty === 'riddle') {
      puzzle = { type: 'riddle', solved: false, attempts: 0 };
    } else if (ty === 'key') {
      puzzle = { type: 'key', have: false };
      const r = pickRoom(), s = freeSpotIn(r);
      pickups.push({ kind: 'key', x: s.tx * T + T / 2, y: s.ty * T + T / 2, v: 1 });
    } else if (ty === 'plates') {
      const need = Math.min(3, 2 + (f >> 3));
      puzzle = { type: 'plates', need, done: 0, solved: false };
      let placed = 0, guard = 0;
      while (placed < need && guard++ < 80) {
        const r = pickRoom();
        if (r.w < 4 || r.h < 4) continue;
        const ptx = r.x + 1 + (rng() * (r.w - 2)) | 0, pty = r.y + 1 + (rng() * (r.h - 2)) | 0;
        if (map[pty * w + ptx] !== TL.TF) continue;
        // block 2 tiles away inside the room, with a clear lane
        const btx = Math.min(r.x + r.w - 2, Math.max(r.x + 1, ptx + (rng() < .5 ? -2 : 2)));
        if (btx === ptx || map[pty * w + btx] !== TL.TF) continue;
        if (blocks.some(b => b.tx === btx && b.ty === pty)) continue;
        map[pty * w + ptx] = TL.PLATE;
        plates.push({ tx: ptx, ty: pty, on: false });
        blocks.push({ tx: btx, ty: pty, rx: btx * T, ry: pty * T });
        placed++;
      }
      puzzle.need = plates.length || 1;
      if (!plates.length) puzzle = { type: 'key', have: true };  // degenerate fallback: open
    } else {
      const n = 3 + Math.min(2, f >> 2);
      const time = Math.max(6, 14 - f * 0.6);
      puzzle = { type: 'torch', n, time, solved: false };
      let placed = 0, guard = 0;
      while (placed < n && guard++ < 80) {
        const r = pickRoom(), s = freeSpotIn(r);
        if (torches.some(o => o.tx === s.tx && o.ty === s.ty)) continue;
        torches.push({ tx: s.tx, ty: s.ty, lit: false, tm: 0 });
        placed++;
      }
      puzzle.n = torches.length || 1;
    }
  }

  // ---- enemies & loot ----
  const count = (puzzle.type === 'warden' ? 3 : 6) + Math.min(10, f);
  for (let i = 0; i < count; i++) {
    const r = midRooms.length ? pickRoom() : exitR, s = freeSpotIn(r);
    const e = mkEnemy(pickTombKind(f, rng), s.tx * T + T / 2, s.ty * T + T / 2);
    e.hp = e.maxhp = Math.ceil(e.maxhp * (1 + f * 0.15));
    e.dmg += (f >> 3);
    e.xpv += f * 2;
    e.aggro = 260;
    enemies.push(e);
  }
  for (let i = 0; i < 4 + (f >> 1); i++) {
    const r = pickRoom(), s = freeSpotIn(r);
    pickups.push(rng() < .18
      ? { kind: 'potion', x: s.tx * T + T / 2, y: s.ty * T + T / 2, v: 1 }
      : { kind: 'gold',   x: s.tx * T + T / 2, y: s.ty * T + T / 2, v: 2 });
  }

  // ---- pinned-room content ----
  for (const r of pinnedRooms) {
    if (r.tag === 'breakroom') {
      // the imp break area: a guaranteed Glurp cache. Mundane container,
      // insane contents.
      pickups.push({ kind: 'potion', x: r.cx * T + T / 2, y: r.cy * T + T / 2, v: 1 });
    }
  }

  return { world, enemies, pickups, blocks, plates, torches, puzzle, boss,
           spawn: { cx: spawn.cx, cy: spawn.cy }, pinnedRooms };
}
