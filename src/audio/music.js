// The OST — lo-fi electronic, light and dark versions. Music is diegetic:
// every track (except the title's) plays FROM somewhere, and it's louder
// the closer you are to it.
//
//   ledger-lightning-bolt — the title screen. Heroic self-aware music for
//       beating the beast of corporate. Big drum hits at 10s and 20s (with
//       pickups at 18/19) — the splash reacts to its own soundtrack.
//   audit-microwave — cheeky, cheery, corporate: the Guild Hall radio.
//   factory-synesthesia — working stiff monster music: the imp break
//       room's radio, every floor.
//   performance-review — radiates from the Warden himself. You hear the
//       review approaching.
//   apocalypse-cancel — for facing the final boss (interim: floor 12).
//
// Best-effort everywhere: missing assets or unavailable audio = silence,
// never an error. Everything routes through the master gain (mute is mute).

import { ST } from '../constants.js';
import { getAC, masterOut } from './sfx.js';

const TRACKS = {
  lightning: 'assets/audio/ledger-lightning-bolt.mp3',
  microwave: 'assets/audio/audit-microwave.mp3',
  factory: 'assets/audio/factory-synesthesia.mp3',
  review: 'assets/audio/performance-review.mp3',
  apocalypse: 'assets/audio/apocalypse-cancel.mp3',
  gumdrop: 'assets/audio/gumdrop-verdict.mp3'   // the Reenactor's overture
};

const TITLE_BEATS = [10, 18, 19, 20];   // seconds; per the composer's notes

/**
 * Where is the music coming from right now? Pure — unit-tested.
 * Returns { name, max } for non-spatial (title), or { name, x, y, range, max },
 * or null for silence.
 */
export function musicSource(game) {
  if (game.state === ST.MENU) return { name: 'lightning', max: 0.4 };
  if (game.zone === 'ow') {
    // an activated Reenactor performs. with accompaniment. he brought it.
    const b = game.boss;
    if (b && !b.dead && b.state !== 'sleep') {
      return { name: 'gumdrop', x: b.x, y: b.y, range: 700, max: 0.45 };
    }
    // otherwise: the Guild Hall radio on Hespeth's desk. she did not choose it.
    const h = game.npcs.find(n => n.name === 'Clerk Hespeth');
    return h ? { name: 'microwave', x: h.x, y: h.y, range: 520, max: 0.4 } : null;
  }
  if (game.boss && !game.boss.dead && game.floorNum % 4 === 0) {
    // the review radiates from the reviewer
    return {
      name: game.floorNum >= 12 ? 'apocalypse' : 'review',
      x: game.boss.x, y: game.boss.y, range: 640, max: 0.45
    };
  }
  // the imp break room's radio (it lives on top of the GLURP-O-MATIC)
  const m = game.npcs.find(n => n.kind === 'machine');
  return m ? { name: 'factory', x: m.x, y: m.y, range: 460, max: 0.4 } : null;
}

/** Positional gain for a source, given the listener. Pure. */
export function sourceGain(src, x, y) {
  if (src.x === undefined) return src.max;          // non-spatial
  const d = Math.hypot(src.x - x, src.y - y);
  return d >= src.range ? 0 : src.max * (1 - d / src.range);
}

// ---------- playback (browser-side) ----------

const buffers = {}, loading = {};
let current = null;             // { name, src, gain }
let beatCb = null, beatTimers = [];

function load(name) {
  if (buffers[name] || loading[name]) return;
  loading[name] = true;
  fetch(TRACKS[name])
    .then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .then(d => getAC().decodeAudioData(d))
    .then(b => { buffers[name] = b; })
    .catch(() => { /* no music from this source today */ });
}

/** Trim encoder padding so mp3 loops don't gap. */
function loopPoints(b) {
  const d = b.getChannelData(0), thr = 0.001;
  let s = 0, e = d.length - 1;
  while (s < e && Math.abs(d[s]) < thr) s++;
  while (e > s && Math.abs(d[e]) < thr) e--;
  return { start: s / b.sampleRate, end: (e + 1) / b.sampleRate };
}

function clearBeats() {
  for (const t of beatTimers) clearTimeout(t);
  beatTimers = [];
}

function scheduleBeats() {
  clearBeats();
  beatTimers = TITLE_BEATS.map(sec => setTimeout(() => beatCb && beatCb(sec), sec * 1000));
}

/** The tape hideously winds down: pitch dives, volume dies. For verdicts. */
function windDown(track) {
  const ctx = getAC();
  try {
    track.src.playbackRate.setValueAtTime(1, ctx.currentTime);
    track.src.playbackRate.exponentialRampToValueAtTime(0.04, ctx.currentTime + 2.2);
    track.gain.gain.setValueAtTime(track.gain.gain.value, ctx.currentTime);
    track.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.4);
    setTimeout(() => { try { track.src.stop(); } catch (e) { /* stopped */ } }, 2600);
  } catch (e) { /* audio unavailable */ }
}

function play(name, { dying = false } = {}) {
  const ctx = getAC();
  if (current) {
    const old = current;
    if (dying) windDown(old);
    else {
      old.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
      setTimeout(() => { try { old.src.stop(); } catch (e) { /* already stopped */ } }, 1800);
    }
  }
  clearBeats();
  const b = buffers[name];
  const src = ctx.createBufferSource();
  src.buffer = b;
  src.loop = true;
  const lp = loopPoints(b);
  src.loopStart = lp.start; src.loopEnd = lp.end;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  src.connect(gain); gain.connect(masterOut());
  src.start(0, lp.start);
  current = { name, src, gain };
  if (name === 'lightning' && beatCb) {
    // the drum hits land relative to when the audio actually runs —
    // a suspended context (pre-gesture) hasn't started the song yet
    if (ctx.state === 'running') scheduleBeats();
    else ctx.addEventListener('statechange', function once() {
      if (ctx.state === 'running') { ctx.removeEventListener('statechange', once); scheduleBeats(); }
    });
  }
}

/** The splash registers here to pulse on the title track's drum hits. */
export function onTitleBeat(cb) { beatCb = cb; }

/** Per-frame: pick the source, switch tracks on change, set positional gain. */
export function updateMusic(game) {
  try {
    const want = musicSource(game);
    if (!want) {
      if (current) current.gain.gain.setTargetAtTime(0, getAC().currentTime, 0.4);
      return;
    }
    if (!buffers[want.name]) { load(want.name); return; }
    if (!current || current.name !== want.name) {
      // leaving the Reenactor's overture because he is dead: the tape
      // hideously winds down instead of politely crossfading
      const dying = current && current.name === 'gumdrop' &&
        game.zone === 'ow' && game.boss && game.boss.dead;
      play(want.name, { dying });
    }
    const g = sourceGain(want, game.player.x, game.player.y);
    current.gain.gain.setTargetAtTime(g, getAC().currentTime, 0.2);
  } catch (e) { /* audio unavailable */ }
}
