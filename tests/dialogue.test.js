// Content smoke tests for dialogue that mutates state. The dialog box is
// stubbed (it's DOM-side); we only need say()'s after-callback semantics.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { talkTo } from '../src/content/dialogue.js';
import { blankGame, spyFx } from './helpers.js';

function stubDialog() {
  const log = [];
  return {
    log,
    say(name, lines, after) { log.push({ name, lines }); if (after) after(); },
    setSpeaker() {}, setText(t) { log.push({ text: t }); },
    open() {}, showHint() {}, choice(opts) { log.push({ opts }); }
  };
}

test('Hermit Gorse grants Pointy once, while stickless, and is re-talkable', () => {
  const game = blankGame(), fx = spyFx(), dlg = stubDialog();
  game.player.swordLv = 0;
  talkTo({ name: 'Hermit Gorse' }, game, dlg, fx);
  assert.equal(game.player.swordLv, 1, 'Pointy granted');
  assert.match(fx.last('toast')[1], /Pointy/);

  // with a stick (or better) in hand, he just asks after her
  talkTo({ name: 'Hermit Gorse' }, game, dlg, fx);
  assert.equal(game.player.swordLv, 1);
  game.player.swordLv = 3;
  talkTo({ name: 'Hermit Gorse' }, game, dlg, fx);
  assert.equal(game.player.swordLv, 3, 'never downgrades');
});

test('the GLURP-O-MATIC sells, finances, and remembers being kicked', () => {
  const game = blankGame(), fx = spyFx(), dlg = stubDialog();
  game.rng = () => 0.9;   // the kick yields nothing today
  const machine = { name: 'GLURP-O-MATIC', kind: 'machine' };

  // cash sale
  game.player.gold = 25;
  talkTo(machine, game, dlg, fx);
  dlg.log.at(-1).opts.find(o => /Insert/.test(o.label)).fn();
  assert.equal(game.player.potions, 2);
  assert.equal(game.player.gold, 5);

  // credit requires income (the machine reads the same form)
  talkTo(machine, game, dlg, fx);
  dlg.log.at(-1).opts.find(o => /credit/.test(o.label)).fn();
  assert.equal(game.meta.credit.balance, 0, 'declined: no verifiable income');
  game.meta.income = 15;
  talkTo(machine, game, dlg, fx);
  dlg.log.at(-1).opts.find(o => /credit/.test(o.label)).fn();
  assert.equal(game.meta.credit.balance, 20);
  assert.equal(game.player.potions, 3);

  // the kick is documented
  talkTo(machine, game, dlg, fx);
  dlg.log.at(-1).opts.find(o => /KICK/.test(o.label)).fn();
  assert.equal(game.meta.menace.length, 1);
  assert.match(game.meta.menace[0].deed, /vending machine/);
  assert.equal(game.player.potions, 3, 'no free Glurp at rng 0.9');
});

test("Skritch's radio: touching it is documented; respecting the note is not", () => {
  const game = blankGame(), fx = spyFx(), dlg = stubDialog();
  const radio = { name: "Skritch's Radio", kind: 'radio' };
  talkTo(radio, game, dlg, fx);
  dlg.log.at(-1).opts.find(o => /TOUCH/.test(o.label)).fn();
  assert.equal(game.meta.menace.length, 1);
  assert.match(game.meta.menace[0].deed, /note specifically said/);

  talkTo(radio, game, dlg, fx);
  dlg.log.at(-1).opts.find(o => /Respect/.test(o.label)).fn();
  assert.equal(game.meta.menace.length, 1, 'restraint goes undocumented');
});
