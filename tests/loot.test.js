import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dropLoot } from '../src/systems/loot.js';
import { mulberry32 } from '../src/core/rng.js';

test('dropLoot always scatters 1-3 gold near the death point', () => {
  for (let seed = 1; seed <= 50; seed++) {
    const pickups = [];
    dropLoot(pickups, 100, 200, mulberry32(seed));
    const gold = pickups.filter(p => p.kind === 'gold');
    assert.ok(gold.length >= 1 && gold.length <= 3, `gold count ${gold.length}`);
    for (const g of gold) {
      assert.ok(Math.abs(g.x - 100) <= 11 && Math.abs(g.y - 200) <= 11);
      assert.equal(g.v, 1);
    }
  }
});

test('bonus drop is heart ~10%, potion ~6%, nothing otherwise', () => {
  let hearts = 0, potions = 0, n = 4000;
  for (let seed = 0; seed < n; seed++) {
    const pickups = [];
    dropLoot(pickups, 0, 0, mulberry32(seed));
    hearts += pickups.filter(p => p.kind === 'heart').length;
    potions += pickups.filter(p => p.kind === 'potion').length;
    assert.ok(pickups.filter(p => p.kind === 'heart').length <= 1);
    assert.ok(pickups.filter(p => p.kind === 'potion').length <= 1);
  }
  assert.ok(hearts / n > 0.07 && hearts / n < 0.13, `heart rate ${hearts / n}`);
  assert.ok(potions / n > 0.03 && potions / n < 0.09, `potion rate ${potions / n}`);
});
