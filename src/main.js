// Bootstrap. The only file that knows about both the DOM and the game state.

import { ST, T, VH, VIL } from './constants.js';
import { createGame, newRun } from './core/game.js';
import { updateGame } from './core/update.js';
import { makeEffects } from './core/effects.js';
import { playSfx } from './audio/sfx.js';
import { makeHud } from './ui/hud.js';
import { makeToast } from './ui/toast.js';
import { makeDialog } from './ui/dialog.js';
import { makeScreens } from './ui/screens.js';
import { makeStick } from './input/stick.js';
import { makeKeyboard } from './input/keyboard.js';
import { talkTo } from './content/dialogue.js';
import { bufferAttack } from './systems/movement.js';
import { usePotion } from './systems/potions.js';
import { questLabel } from './systems/quest.js';
import { respawnAtGuild } from './systems/respawn.js';
import { deathReport, gradeRun, gradeRemark } from './systems/ledger.js';
import { hespethLine, resurrectionNote } from './content/hespeth.js';
import { entryLines, approvalLines, customsIntro, declareOutcome, smuggleOutcome, suspicionBook } from './content/golem.js';
import { nextRiddle, answerRiddle, doorSigh } from './systems/riddle.js';
import { render } from './render/index.js';

// ---------- DOM ----------
const $ = id => document.getElementById(id);
const cv = $('c'), ctx = cv.getContext('2d');
const els = {
  hud: $('hud'), hpFill: $('hpFill'), xpFill: $('xpFill'), statline: $('statline'),
  questEl: $('quest'), btnA: $('btnA'), btnP: $('btnP'),
  dlg: $('dlg'), dlgName: $('dlgName'), dlgText: $('dlgText'), dlgBtns: $('dlgBtns'), dlgHint: $('dlgHint'),
  menu: $('menu'), over: $('over'), overTitle: $('overTitle'), overSub: $('overSub'), overTip: $('overTip'),
  toast: $('toast'), stickBase: $('stickBase'), stickKnob: $('stickKnob')
};

// ---------- screen ----------
const screen = { W: 0, H: 0, dpr: 1, scale: 1, viewW: 0 };
function resize() {
  screen.dpr = Math.min(window.devicePixelRatio || 1, 2);
  screen.W = cv.clientWidth; screen.H = cv.clientHeight;
  cv.width = screen.W * screen.dpr; cv.height = screen.H * screen.dpr;
  screen.scale = screen.H / VH;
  screen.viewW = screen.W / screen.scale;
}
window.addEventListener('resize', resize);
resize();

// ---------- game + UI ----------
const game = createGame();
const hud = makeHud(els);
const toast = makeToast(els.toast);
const screens = makeScreens(els);
const dialog = makeDialog(game, els, () => playSfx('talk'));

const fx = makeEffects({
  sfx: playSfx,
  toast: msg => toast.show(msg),
  hudChanged: () => hud.update(game.player, game.meta),
  questChanged: () => hud.setQuestHTML(questLabel(game.quest, game.deepest)),
  setQuestHTML: html => hud.setQuestHTML(html),
  nearNpc: npc => { els.btnA.textContent = npc ? 'TALK' : 'ATTACK'; },
  requestTalk: npc => talkTo(npc, game, dialog, fx),
  onPlayerDeath: () => {
    hud.hide();
    // the Ledger files its report BEFORE Hespeth processes the body
    const cause = game.lastHitBy || null;
    const willBeDeaths = game.meta.deaths + 1;
    const grade = gradeRun(
      { ...game.meta, deaths: willBeDeaths,
        repeatCause: cause && cause === game.meta.lastCause ? game.meta.repeatCause + 1 : 0 },
      { ...game.runStats, died: true });
    pendingDeath = { grade };
    const reportMeta = { deaths: willBeDeaths,
      repeatCause: cause && cause === game.meta.lastCause ? game.meta.repeatCause + 1 : 0 };
    screens.showIncidentReport(
      deathReport(reportMeta, cause) + ' ' + gradeRemark(grade),
      grade,
      hespethLine(willBeDeaths));
  },
  onAmuletFound: () => screens.showWin(),

  // ---- the Door Golem ----
  onGolemEntry: missing => dialog.say('Door Golem', entryLines(game, missing)),
  onGolemApproval: () => dialog.say('Door Golem', approvalLines(game)),
  onGolemCustoms: gold => {
    dialog.say('Door Golem', customsIntro(gold), () => {
      dialog.setSpeaker('Door Golem');
      dialog.setText('Anything to declare?');
      dialog.open();
      dialog.choice([
        { label: 'Declare it', fn: () => { dialog.setText(declareOutcome(gold)); dialog.showHint(); } },
        { label: '"Nothing to declare."', fn: () => { dialog.setText(smuggleOutcome(game)); dialog.showHint(); } },
        { label: '\u{1F4D3} Read his little book', fn: () => {
          dialog.setText(suspicionBook(game.meta).join('  '));
          dialog.showHint();
        }}
      ]);
    });
  },

  // ---- the Riddle Door That Learned Its Lesson ----
  onRiddle: () => askTheDoor()
});

function askTheDoor() {
  const r = nextRiddle(game);
  dialog.say('The Door', [r.q], () => {});
  dialog.choice(r.options.map(o => ({
    label: o.label,
    fn: () => {
      const result = answerRiddle(game, o, fx);
      if (result === 'wrong') {
        // the sigh deserves its own beat: show it, tap, then the easier question
        dialog.say('The Door', [doorSigh(game.puzzle.attempts)], () => askTheDoor());
      } else {
        dialog.advance();  // close; the toast carries the verdict
      }
    }
  })));
}

// ---------- input ----------
const { stick, start: startStick } = makeStick(els.stickBase, els.stickKnob);

const kb = makeKeyboard({
  onConfirm: () => {
    if (game.state === ST.DIALOG) dialog.advance();
    else if (game.state === ST.MENU) startGame();
    else if (game.state === ST.DEAD) resurrect();
    else bufferAttack(game);
  },
  onPotion: () => usePotion(game, fx)
});

let pendingDeath = null;
window.addEventListener('pointerdown', e => {
  if (game.state === ST.MENU) { startGame(); return; }
  if (game.state === ST.DEAD) { resurrect(); return; }
  if (game.state === ST.WIN) { screens.closeOver(); game.state = ST.PLAY; return; }
  if (game.state === ST.DIALOG) { dialog.advance(); return; }
  if (e.target.classList && e.target.classList.contains('btn')) return;
  if (e.target.tagName === 'BUTTON') return;
  if (e.clientX < screen.W * 0.55 && !stick.active) startStick(e);
});

els.btnA.addEventListener('pointerdown', e => { e.stopPropagation(); bufferAttack(game); els.btnA.classList.add('on'); });
els.btnA.addEventListener('pointerup', () => els.btnA.classList.remove('on'));
els.btnP.addEventListener('pointerdown', e => { e.stopPropagation(); usePotion(game, fx); });

// ---------- start / loop ----------
function resurrect() {
  const grade = pendingDeath ? pendingDeath.grade : 'C';
  pendingDeath = null;
  const { deductible } = respawnAtGuild(game, fx);
  game.meta.grades.push(grade);
  screens.closeOver();
  hud.show();
  toast.show(resurrectionNote(deductible));
}

function startGame() {
  newRun(game);
  game.state = ST.PLAY;
  screens.hideMenu();
  screens.closeOver();
  hud.show();
  fx.hudChanged();
  fx.questChanged();
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(.033, (now - last) / 1000);
  last = now;
  const m = kb.moveVector();
  const controls = {
    mx: m.mx !== 0 ? m.mx : stick.dx,
    my: m.my !== 0 ? m.my : stick.dy
  };
  updateGame(game, controls, dt, { w: screen.viewW }, fx);
  toast.tick(dt);
  render(ctx, game, screen);
  requestAnimationFrame(loop);
}

// menu backdrop: a generated world behind the title
newRun(game);
game.cam.x = Math.max(0, game.player.x - 600);
game.cam.y = Math.max(0, game.player.y - 240);
requestAnimationFrame(loop);
