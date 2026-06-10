// Enemy archetypes and factory.

export const ENEMY_TYPES = {
  scarab: { hp: 4,  spd: 62,  dmg: 1, xp: 6,  r: 11, col: '#7a4a8f', aggro: 150 },
  jackal: { hp: 6,  spd: 118, dmg: 1, xp: 10, r: 12, col: '#8f5a3a', aggro: 210 },
  spirit: { hp: 9,  spd: 54,  dmg: 2, xp: 16, r: 12, col: '#74c4b8', aggro: 240, ghost: true },
  mummy:  { hp: 14, spd: 40,  dmg: 2, xp: 22, r: 13, col: '#c9b08a', aggro: 260 }
};

export function mkEnemy(kind, x, y) {
  const base = ENEMY_TYPES[kind];
  return {
    kind, x, y, w: base.r * 2, h: base.r * 2,
    hp: base.hp, maxhp: base.hp, spd: base.spd, dmg: base.dmg,
    xpv: base.xp, col: base.col, aggro: base.aggro, ghost: !!base.ghost,
    wx: 0, wy: 0, wt: 0, kb: 0, kbx: 0, kby: 0, flash: 0, dead: false
  };
}

/** Which enemy kind to spawn on tomb floor f. */
export function pickTombKind(f, rng = Math.random) {
  const r = rng();
  if (f >= 3 && r < .25) return 'mummy';
  if (r < .45) return 'spirit';
  if (r < .72) return 'jackal';
  return 'scarab';
}
