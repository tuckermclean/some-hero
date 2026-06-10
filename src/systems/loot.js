// Death loot: 1-3 gold scatter, 10% heart, 6% potion.

export function dropLoot(pickups, x, y, rng = Math.random) {
  const g = 1 + (rng() * 3 | 0);
  for (let i = 0; i < g; i++) {
    pickups.push({ kind: 'gold', x: x + (rng() - .5) * 22, y: y + (rng() - .5) * 22, v: 1 });
  }
  const r = rng();
  if (r < .10) pickups.push({ kind: 'heart', x, y, v: 2 });
  else if (r < .16) pickups.push({ kind: 'potion', x, y, v: 1 });
}
