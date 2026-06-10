// Shared constants for the whole engine. No logic lives here.

export const T = 36;            // tile size in world px
export const VH = 480;          // virtual viewport height in world px

export const OVERWORLD = { W: 72, H: 72 };
export const TOMB = { W: 34, H: 34 };

// Tile ids
export const TL = {
  SAND: 0, DUNE: 1, ROCK: 2, WATER: 3, PALM: 4, PAVE: 5,
  RFLOOR: 6, RWALL: 7, WELL: 8, ROAD: 9,
  TF: 10,   // tomb floor
  TW: 11,   // tomb wall
  SD: 12,   // stairs down
  SU: 13,   // stairs up
  PLATE: 14 // pressure plate
};

// Per-tile collision, indexed by tile id
export const SOLID = [
  false, false, true, true, true, false, false, true, true, false,
  false, true, false, false, false
];

// Base tile fill colours, indexed by tile id
export const TCOL = [
  '#e8c27a', '#dcae5f', '#a8764f', '#2e9e8f', '#e8c27a', '#d9b98a',
  '#cdb592', '#8a6a52', '#d9b98a', '#e0b46a',
  '#4a3a30', '#241a14', '#4a3a30', '#4a3a30', '#4a3a30'
];

// Overworld landmarks (tile coords)
export const VIL = { x: 16, y: 40 };
export const RUIN = { x0: 52, y0: 8, x1: 66, y1: 21 };

// Top-level game states
export const ST = { MENU: 0, PLAY: 1, DIALOG: 2, DEAD: 3, WIN: 4 };
