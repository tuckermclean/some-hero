// 🎵 GLURP! It's adventure fluid! / GLURP! Don't ask what's in it!
//    If you're hurt or sad or cursed or dead-ish, / GLURP'll fix you in a minute!* 🎵
//    [spoken, rapidly, tiny print:] BY OPENING THE LID, YOU AGREE TO INDEMNIFY
//    THE GLURP BOTTLING CONCERN FOR ANY CLAIMS ARISING FROM THE USE OF GLURP.
//
// The recorded jingle (assets/audio/glurp-jingle.mp3, master .wav alongside)
// loops near the Gift Shop topside, proximity-faded, and ends with a really
// wet *glurp* — which is exactly the sound of drinking one.
//
// Everything here is best-effort: if audio is unavailable or the asset
// fails to load, the game shrugs and the beeps carry on.

import { getAC, masterOut } from './sfx.js';

const SRC = 'assets/audio/glurp-jingle.mp3';
const STING_AT = 12.05;       // the wet glurp's onset (low-band analysis)
const SHOP_RANGE = 170;       // px within which the gift shop is audible
const SHOP_GAIN = 0.5;

let buffer = null, loading = false;
let loopSrc = null, loopGain = null;

function load() {
  if (buffer || loading) return;
  loading = true;
  fetch(SRC)
    .then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .then(data => getAC().decodeAudioData(data))
    .then(b => { buffer = b; })
    .catch(() => { /* no jingle today; the Concern will hear about this */ });
}

function ensureLoop() {
  if (loopSrc || !buffer) return;
  const ctx = getAC();
  loopSrc = ctx.createBufferSource();
  loopSrc.buffer = buffer;
  loopSrc.loop = true;
  loopGain = ctx.createGain();
  loopGain.gain.value = 0;
  loopSrc.connect(loopGain); loopGain.connect(masterOut());
  loopSrc.start();
}

/**
 * Per-frame: fade the shop loop by distance to the Gift Shop Gnoll.
 * Loads lazily; until then this is a no-op.
 */
export function updateJingle(game) {
  try {
    if (!buffer) { load(); return; }
    ensureLoop();
    if (!loopGain) return;
    let target = 0;
    if (game.zone === 'ow') {
      const gnoll = game.npcs.find(n => n.name === 'Gift Shop Gnoll');
      if (gnoll) {
        const d = Math.hypot(gnoll.x - game.player.x, gnoll.y - game.player.y);
        if (d < SHOP_RANGE) target = SHOP_GAIN * (1 - d / SHOP_RANGE);
      }
    }
    // smooth toward the target so walking by doesn't click
    loopGain.gain.setTargetAtTime(target, getAC().currentTime, 0.15);
  } catch (e) { /* audio unavailable */ }
}

/** The wet *glurp* from the end of the recording. Returns false if not loaded. */
export function glurpSting() {
  try {
    if (!buffer) { load(); return false; }
    const ctx = getAC();
    const s = ctx.createBufferSource();
    s.buffer = buffer;
    const g = ctx.createGain();
    g.gain.value = 0.8;
    s.connect(g); g.connect(masterOut());
    s.start(0, STING_AT, buffer.duration - STING_AT);
    return true;
  } catch (e) { return false; }
}
