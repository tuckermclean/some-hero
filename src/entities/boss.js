// Boss factory. The Tomb Guardian (overworld) and floor Wardens share one
// shape and one state machine; only stats and rewards differ.

export function mkBoss(x, y, { hp = 40, dmg = 2 } = {}) {
  return {
    x, y, w: 42, h: 46,
    hp, maxhp: hp,
    state: 'sleep',   // sleep -> idle -> tele -> dash -> idle ...
    timer: 0, vx: 0, vy: 0,
    flash: 0, kb: 0, kbx: 0, kby: 0,
    dead: false, dmg
  };
}

/** Warden stats for tomb floor f. */
export function wardenStats(f) {
  return {
    hp: Math.ceil(40 * (1 + f * 0.18)),
    dmg: 2 + (f >> 3)
  };
}
