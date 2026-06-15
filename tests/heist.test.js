// Act II heist mechanics: skull puzzle, first-pet deduction, signature gate.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  makeSkullPuzzle, skullAgree, skullCorrect,
  gradeFirstPet, FIRST_PET_ANSWER,
  menaceEnough, trySignature, MENACE_THRESHOLD,
  WITNESSES, deduceFirstPet, canConfirmGregory
} from '../src/systems/heist.js';
import { createMeta, addMenace, hearWitness } from '../src/core/meta.js';

// ---- skull puzzle ----

test('three agrees mark the skull puzzle done', () => {
  let s = makeSkullPuzzle();
  assert.equal(s.done, false);
  s = skullAgree(s); assert.equal(s.done, false, 'two more to go');
  s = skullAgree(s); assert.equal(s.done, false, 'one more to go');
  s = skullAgree(s); assert.equal(s.done, true, 'three agrees: deaccessioned');
  assert.equal(s.agreed, 3);
  assert.equal(s.step, 3);
});

test('fewer than three agrees leave the puzzle open', () => {
  let s = makeSkullPuzzle();
  skullAgree(s); skullAgree(s);
  assert.equal(s.done, false);
  assert.equal(s.agreed, 2);
});

test('correcting Brell advances the step but not the agree count', () => {
  let s = makeSkullPuzzle();
  s = skullAgree(s);
  s = skullCorrect(s);
  assert.equal(s.agreed, 1, 'correction does not count as an agree');
  assert.equal(s.step, 2, 'step still advances');
  assert.equal(s.done, false);
});

test('agreeing after done is a no-op', () => {
  let s = makeSkullPuzzle();
  skullAgree(s); skullAgree(s); skullAgree(s);  // done
  const before = { ...s };
  skullAgree(s);
  assert.deepEqual(s, before, 'no change after done');
});

// ---- witness list + deduction ----

test('WITNESSES: exactly 5 entries, each on a distinct floor 5–9', () => {
  assert.equal(WITNESSES.length, 5);
  const floors = WITNESSES.map(w => w.floor);
  for (let i = 0; i < floors.length; i++) {
    assert.ok(floors[i] >= 5 && floors[i] <= 9, 'floor in range');
  }
  assert.equal(new Set(floors).size, 5, 'all floors distinct');
});

test('WITNESSES: four animal claimers (pet != null) and one rock pointer (pet == null)', () => {
  const animals = WITNESSES.filter(w => w.pet !== null);
  const pointers = WITNESSES.filter(w => w.pet === null);
  assert.equal(animals.length, 4);
  assert.equal(pointers.length, 1);
});

test('deduceFirstPet: returns null when no witnesses heard', () => {
  assert.equal(deduceFirstPet([]), null);
});

test('deduceFirstPet: returns null when only some animal claimers heard', () => {
  assert.equal(deduceFirstPet(['skel', 'goose', 'slime']), null, 'three of four — not enough');
  assert.equal(deduceFirstPet(['skel', 'bat']), null, 'two — not enough');
});

test('deduceFirstPet: returns FIRST_PET_ANSWER once all four animal claimers heard', () => {
  const allFour = ['skel', 'goose', 'slime', 'bat'];
  assert.equal(deduceFirstPet(allFour), FIRST_PET_ANSWER);
});

test('deduceFirstPet: order-independent', () => {
  assert.equal(deduceFirstPet(['bat', 'slime', 'skel', 'goose']), FIRST_PET_ANSWER);
});

test('deduceFirstPet: extra ids beyond the required four do not break it', () => {
  assert.equal(deduceFirstPet(['skel', 'goose', 'slime', 'bat', 'sage', 'extra']), FIRST_PET_ANSWER);
});

test('canConfirmGregory: false before sufficient testimony', () => {
  const meta = createMeta();
  assert.equal(canConfirmGregory(meta), false, 'empty heard');
  hearWitness(meta, 'skel'); hearWitness(meta, 'goose');
  assert.equal(canConfirmGregory(meta), false, 'partial heard');
});

test('canConfirmGregory: true after all four animal claimers heard', () => {
  const meta = createMeta();
  ['skel', 'goose', 'slime', 'bat'].forEach(id => hearWitness(meta, id));
  assert.equal(canConfirmGregory(meta), true);
});

test('hearWitness: idempotent — no duplicate ids in heard', () => {
  const meta = createMeta();
  hearWitness(meta, 'skel');
  hearWitness(meta, 'skel');
  hearWitness(meta, 'skel');
  assert.equal(meta.heist.heard.length, 1, 'only recorded once');
  assert.equal(meta.heist.heard[0], 'skel');
});

test('hearWitness: multiple different ids accumulate correctly', () => {
  const meta = createMeta();
  hearWitness(meta, 'skel');
  hearWitness(meta, 'goose');
  hearWitness(meta, 'slime');
  assert.equal(meta.heist.heard.length, 3);
});

// ---- first pet deduction (gradeFirstPet — for dialogue free-text fallback) ----

test('gradeFirstPet: Gregory (exact and variants) → true', () => {
  assert.equal(gradeFirstPet('Gregory'), true);
  assert.equal(gradeFirstPet('gregory'), true);
  assert.equal(gradeFirstPet('  GREGORY  '), true);
  assert.equal(gradeFirstPet('Gregory the rock'), true);
  assert.equal(gradeFirstPet('it was gregory, dear'), true);
});

test('gradeFirstPet: other answers → false', () => {
  assert.equal(gradeFirstPet('goose'), false);
  assert.equal(gradeFirstPet('skeleton'), false);
  assert.equal(gradeFirstPet('slime'), false);
  assert.equal(gradeFirstPet(''), false);
  assert.equal(gradeFirstPet('  '), false);
});

// ---- menace / signature ----

test('menaceEnough: true at threshold, false below', () => {
  const meta = createMeta();
  assert.equal(menaceEnough(meta), false, '0 deeds');
  for (let i = 0; i < MENACE_THRESHOLD - 1; i++) addMenace(meta, 'crime ' + i);
  assert.equal(menaceEnough(meta), false, MENACE_THRESHOLD - 1 + ' deeds — not quite');
  addMenace(meta, 'the last one');
  assert.equal(menaceEnough(meta), true, MENACE_THRESHOLD + ' deeds: enough');
});

test('trySignature: insufficient when below threshold', () => {
  const meta = createMeta();
  addMenace(meta, 'only one');
  assert.equal(trySignature(meta), 'insufficient');
  assert.equal(meta.heist.signature, false);
});

test('trySignature: granted at threshold and sets heist flag', () => {
  const meta = createMeta();
  for (let i = 0; i < MENACE_THRESHOLD; i++) addMenace(meta, 'crime ' + i);
  assert.equal(trySignature(meta), 'granted');
  assert.equal(meta.heist.signature, true, 'token set in meta');
});

test('trySignature: returns "have" when already granted', () => {
  const meta = createMeta();
  for (let i = 0; i < MENACE_THRESHOLD; i++) addMenace(meta, 'crime ' + i);
  trySignature(meta);                   // first call grants
  assert.equal(trySignature(meta), 'have', 'second call is a no-op');
  assert.equal(meta.heist.signature, true);
});
