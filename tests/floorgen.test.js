import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TL, TOMB } from '../src/constants.js';
import { generateFloor } from '../src/world/floorgen.js';
import { mulberry32, makeHash2 } from '../src/core/rng.js';

const h2 = makeHash2(1, 2);

function findTile(world, v) {
  for (let i = 0; i < world.map.length; i++) {
    if (world.map[i] === v) return { tx: i % world.w, ty: (i / world.w) | 0 };
  }
  return null;
}

function reachable(world, from, to) {
  const pass = v => v === TL.TF || v === TL.PLATE || v === TL.SU || v === TL.SD;
  const seen = new Uint8Array(world.map.length);
  const q = [from.ty * world.w + from.tx];
  seen[q[0]] = 1;
  while (q.length) {
    const i = q.pop();
    const x = i % world.w, y = (i / world.w) | 0;
    if (x === to.tx && y === to.ty) return true;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= world.w || ny >= world.h) continue;
      const j = ny * world.w + nx;
      if (seen[j] || !pass(world.map[j])) continue;
      seen[j] = 1; q.push(j);
    }
  }
  return false;
}

test('floors have exactly one SU and one SD, connected (floors 1-8, 5 seeds)', () => {
  for (let seed = 1; seed <= 5; seed++) {
    for (let f = 1; f <= 8; f++) {
      const g = generateFloor(f, h2, mulberry32(seed * 100 + f));
      const su = findTile(g.world, TL.SU), sd = findTile(g.world, TL.SD);
      assert.ok(su && sd, `f${f} seed${seed}: missing stairs`);
      assert.equal(g.world.map.filter(v => v === TL.SU).length, 1);
      assert.equal(g.world.map.filter(v => v === TL.SD).length, 1);
      assert.ok(reachable(g.world, su, sd), `f${f} seed${seed}: SD unreachable from SU`);
      assert.equal(g.world.w, TOMB.W);
      assert.equal(g.spawn.cx, su.tx);
      assert.equal(g.spawn.cy, su.ty);
    }
  }
});

test('every 4th floor is a Warden floor with a boss and no other puzzle props', () => {
  const g = generateFloor(4, h2, mulberry32(11));
  assert.equal(g.puzzle.type, 'warden');
  assert.ok(g.boss);
  assert.ok(!g.boss.dead);
  assert.equal(g.boss.state, 'sleep');
  assert.equal(g.plates.length, 0);
  assert.equal(g.torches.length, 0);
  // warden scales with floor
  const g8 = generateFloor(8, h2, mulberry32(11));
  assert.ok(g8.boss.maxhp > g.boss.maxhp);
});

test('non-warden floors have a consistent puzzle structure', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const g = generateFloor(3, h2, mulberry32(seed));
    assert.equal(g.boss, null);
    if (g.puzzle.type === 'key') {
      // either a key pickup exists, or it is the degenerate already-open fallback
      const hasKey = g.pickups.some(p => p.kind === 'key');
      assert.ok(hasKey || g.puzzle.have === true);
    } else if (g.puzzle.type === 'plates') {
      assert.equal(g.puzzle.need, g.plates.length);
      assert.equal(g.blocks.length, g.plates.length);
      assert.ok(g.plates.length >= 1);
      // plate tiles are stamped into the map
      for (const p of g.plates) assert.equal(g.world.map[p.ty * g.world.w + p.tx], TL.PLATE);
    } else if (g.puzzle.type === 'torch') {
      assert.equal(g.puzzle.n, g.torches.length || 1);
      assert.ok(g.torches.every(t => !t.lit));
      assert.ok(g.puzzle.time >= 6);
    } else if (g.puzzle.type === 'riddle') {
      assert.equal(g.puzzle.solved, false);
      assert.equal(g.puzzle.attempts, 0);
      assert.equal(g.plates.length, 0);
      assert.equal(g.torches.length, 0);
    } else {
      assert.fail('unexpected puzzle type ' + g.puzzle.type);
    }
  }
});

test('enemy stats scale with floor depth', () => {
  const g1 = generateFloor(1, h2, mulberry32(2));
  const g9 = generateFloor(9, h2, mulberry32(2));
  const avg = es => es.reduce((s, e) => s + e.maxhp, 0) / es.length;
  assert.ok(avg(g9.enemies) > avg(g1.enemies));
  assert.ok(g9.enemies.length >= g1.enemies.length);
  assert.ok(g9.enemies.every(e => e.aggro === 260));
});

test('enemies and loot spawn on walkable tiles', () => {
  const g = generateFloor(5, h2, mulberry32(13));
  const ok = (x, y) => {
    const v = g.world.map[Math.floor(y / 36) * g.world.w + Math.floor(x / 36)];
    return v === TL.TF || v === TL.PLATE || v === TL.SU || v === TL.SD;
  };
  for (const e of g.enemies) assert.ok(ok(e.x, e.y), 'enemy in a wall');
  for (const p of g.pickups) assert.ok(ok(p.x, p.y), 'pickup in a wall');
});
