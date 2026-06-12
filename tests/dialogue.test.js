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
