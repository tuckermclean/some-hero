// Act II heist mechanics: the skull puzzle, the first-pet deduction, and the
// signature gate. All pure — no DOM, no side effects. dialogue.js calls
// these; tests call them directly.

import { grantToken } from '../core/meta.js';

// ---- the Skull (Docent Brell's plaque-logic puzzle) ----

/**
 * Three-round dialogue puzzle: agree with Brell's off-by-one "corrections"
 * three times and the museum auto-deaccessions the skull.
 */
export function makeSkullPuzzle() {
  return { step: 0, agreed: 0, done: false };
}

/** Player agrees with Brell's wrong correction. */
export function skullAgree(state) {
  if (state.done) return state;
  state.agreed++;
  state.step++;
  if (state.agreed >= 3) state.done = true;
  return state;
}

/** Player correctly contradicts Brell — no progress, no penalty. */
export function skullCorrect(state) {
  state.step++;
  return state;
}

// ---- Malgrath's First Pet (witness deduction) ----

export const FIRST_PET_ANSWER = 'gregory';

/**
 * Five elderly dungeon residents, each with strong opinions about Malgrath's
 * first pet and exactly one self-refuting detail. Witnesses live in Stratum II
 * (floors 5–9); testimony is permanent knowledge (meta.heist.heard).
 *
 * Four claim animals; each claim self-destructs on examination.
 * The fifth points at the rock and tells you to ask the Mother.
 * The deduction unlocks once all four animal-claimers have been heard.
 */
export const WITNESSES = [
  {
    id: 'skel', name: 'Elderly Skeleton', floor: 5, pet: 'goose',
    claim: '"Oh, it was definitely a goose. Very loyal bird. Named Bindle. Malgrath adored her."',
    tell: '"I know because I myself have kept geese for thirty years. Skeletons have wonderful rapport with waterfowl." (Skeletons have no flesh. Geese are notoriously uninterested in the undead. The skeleton seems genuinely unbothered by this contradiction.)'
  },
  {
    id: 'goose', name: 'Elderly Goose', floor: 6, pet: 'skeleton',
    claim: '"A skeleton. Very tidy one. Filed everything alphabetically. Named Gerald."',
    tell: '"Gerald was in Archival. Very organized. Showed up every day. Still on payroll, last I checked." (Gerald is an employee. HR distinction: staff are not pets. Malgrath was, by all accounts, very clear on this.)'
  },
  {
    id: 'slime', name: 'Elderly Slime', floor: 7, pet: 'slime',
    claim: '"A slime, obviously. Very calm. Never ran off once in its entire life."',
    tell: '"Slimes technically cannot run. Or stay. Or intend things. But this one was VERY committed. It was basically an intern." (Slimes are interns. Interns are not pets. The distinction is on the form. There is a form.)'
  },
  {
    id: 'bat', name: 'Elderly Mailbat', floor: 8, pet: 'pigeon',
    claim: '"Decorated pigeon. Medal for services to the crown. Very patriotic."',
    tell: '"Crown property, technically. But you know how it is with Malgrath." ("You know how it is" is not a recognized exception under Greater Pflum statute 7(b). Decorated animals are Crown property and cannot be privately owned.)'
  },
  {
    id: 'sage', name: 'Retired Consultant', floor: 9, pet: null,
    claim: '"None of the others are right. Malgrath had something very still. Very grey. Never said a word in forty years. We called it the quiet one."',
    tell: '"Go ask his mother. She will remember. She always remembers." (This is, objectively, the most useful testimony you have heard today.)'
  }
];

/** The four animal-claimers whose self-refuting tells rule out every animal. */
const ANIMAL_WITNESS_IDS = ['skel', 'goose', 'slime', 'bat'];

/**
 * Given the array of heard witness ids, return `'gregory'` once every
 * animal-claimer has been heard (their tells collectively rule out every
 * animal; what remains is a rock). Returns `null` if not enough evidence yet.
 */
export function deduceFirstPet(heard) {
  if (ANIMAL_WITNESS_IDS.every(id => heard.includes(id))) return FIRST_PET_ANSWER;
  return null;
}

/**
 * Can the player confirm Gregory with Malgrath's Mother?
 * True once the downstairs deduction is complete.
 */
export function canConfirmGregory(meta) {
  return deduceFirstPet(meta.heist.heard) === FIRST_PET_ANSWER;
}

/**
 * Did the player name Gregory (the rock)?
 * Accepts any string containing "gregory" — case-insensitive, leading/trailing
 * whitespace trimmed. Even an 11-year-old can get this.
 */
export function gradeFirstPet(answer) {
  return String(answer).trim().toLowerCase().includes(FIRST_PET_ANSWER);
}

// ---- the Signature (menace threshold) ----

/**
 * How many documented petty crimes before the gauntlet will sign.
 * Topside deeds: kick GLURP-O-MATIC, touch radios, royal grass, museum tag.
 * Tomb deeds: Skritch's radio, gap guestbook. Threshold set low so it's
 * reachable without dedicated grinding.
 */
export const MENACE_THRESHOLD = 3;

export function menaceEnough(meta) {
  return meta.menace.length >= MENACE_THRESHOLD;
}

/**
 * Try to obtain the signature. Returns:
 *   'have'        — token already granted
 *   'insufficient' — menace count below threshold
 *   'granted'     — token newly granted (call fx.sfx etc. after)
 */
export function trySignature(meta) {
  if (meta.heist.signature) return 'have';
  if (!menaceEnough(meta)) return 'insufficient';
  grantToken(meta, 'signature');
  return 'granted';
}
