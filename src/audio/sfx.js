// WebAudio bleep synth. The only audio in the game.

let AC = null;

export function beep(f, d, type, vol, slide) {
  try {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f, AC.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, AC.currentTime + d);
    g.gain.setValueAtTime(vol || .04, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + d);
    o.connect(g); g.connect(AC.destination);
    o.start(); o.stop(AC.currentTime + d);
  } catch (e) { /* audio unavailable */ }
}

export const sfx = {
  swing:  () => beep(300, .1, 'sawtooth', .03, 120),
  hit:    () => beep(150, .1, 'square', .05),
  hurt:   () => beep(100, .25, 'sawtooth', .06, 60),
  coin:   () => { beep(990, .06, 'sine', .05); setTimeout(() => beep(1480, .09, 'sine', .05), 50); },
  heal:   () => beep(520, .18, 'sine', .05, 780),
  level:  () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, .14, 'sine', .05), i * 90)); },
  talk:   () => beep(660, .05, 'square', .03),
  boss:   () => beep(60, .5, 'sawtooth', .08),
  win:    () => { [523, 659, 784, 659, 1046].forEach((f, i) => setTimeout(() => beep(f, .2, 'sine', .06), i * 140)); },
  push:   () => beep(110, .09, 'square', .05),
  ignite: () => beep(680, .16, 'sine', .06, 1250),
  douse:  () => beep(180, .12, 'sine', .03, 90),
  // a dry mechanism clack, then the sad thunk of a dart not arriving
  click:  () => { beep(1300, .03, 'square', .06); setTimeout(() => beep(220, .05, 'square', .03), 45); }
};

export function playSfx(name) {
  const f = sfx[name];
  if (f) f();
}
