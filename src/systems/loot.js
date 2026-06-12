// Death loot: 1-3 gold scatter; topside, 10% heart / 6% potion.
// The dungeon drops no heals — Glurp is the only mid-run medicine,
// and the breakroom (and the gift shop's credit line) is where it lives.

export function dropLoot(pickups, x, y, rng = Math.random, inDungeon = false) {
  const g = 1 + (rng() * 3 | 0);
  for (let i = 0; i < g; i++) {
    pickups.push({ kind: 'gold', x: x + (rng() - .5) * 22, y: y + (rng() - .5) * 22, v: 1 });
  }
  if (inDungeon) return;
  const r = rng();
  if (r < .10) pickups.push({ kind: 'heart', x, y, v: 2 });
  else if (r < .16) pickups.push({ kind: 'potion', x, y, v: 1 });
}
