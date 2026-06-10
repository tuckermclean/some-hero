// The Door Golem of Credential Verification requires three things of any
// adventurer entering the Downstairs:
//   (a) a sword       — any sword-shaped object passes. The player always
//                       carries something sword-shaped; the golem approves
//                       it with commentary proportional to its tier.
//   (b) a tragic backstory — notarized. The Ledger writes it (florid,
//                       house spelling); Clerk Hespeth stamps it.
//   (c) crippling debt — one purchase on credit from the gift shop suffices.
//
// Credentials are knowledge, so they live on meta and are permanent.

/** Which credentials are still missing? ('sword' never is.) */
export function missingCredentials(meta) {
  const m = [];
  if (!meta.credentials.backstory) m.push('backstory');
  if (!meta.credentials.debt) m.push('debt');
  return m;
}

export function grantBackstory(meta) {
  meta.credentials.backstory = true;
  return meta;
}

export function grantDebt(meta) {
  meta.credentials.debt = true;
  return meta;
}

/** The golem's verdict on whatever sword-shaped object you're holding. */
export function swordVerdict(swordLv) {
  if (swordLv >= 3) return 'Sword: sun-steel. Extremely sword-shaped. The golem is moved.';
  if (swordLv === 2) return 'Sword: a DIRK!\u2122. "Basically a sword." The golem has read the case law. It counts.';
  return 'Sword: technically. The golem has seen swordfish pass this checkpoint. Approved.';
}
