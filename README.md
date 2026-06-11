# SOME HERO
*(title: final. do not improve. — the Ledger)*

**"Somebody has to. Apparently it's you."**

A playable vertical slice of the SOME HERO design doc, built by gutting the
Amulet of the Sands atomic engine. Covers Build Order v2 steps 1–5 plus both
engine prerequisites. The desert art is placeholder; the *systems* and the
*voice* are the deliverable.

## Run / test

```
npm start         # any static server works
npm test          # 144 unit tests, zero runtime dependencies, node --test
npm run test:e2e  # drives the real game in headless Chromium (Playwright dev-dep;
                  # uses $CHROME_PATH, /usr/bin/chromium, or Playwright's download)
```

The e2e suite (`tests/e2e/game.e2e.mjs`) covers the seams unit tests can't:
the splash timeline and the Ledger's key reactions, Enter-to-start, the Door
Golem's stamp ceremony playing *topside* before descent, the trap-counter
room, and customs happening *at the door* before daylight. It screenshots
each beat into `tests/e2e/shots/`. The game exposes its state for the test
only when loaded with `?test`.

## What's implemented (mapped to the design doc)

**Engine prerequisite #1 — pinned rooms.** `world/floorgen.js` accepts
`pinned: [{w, h, tag}]` — "load-bearing rooms the renovation imps can't
move." They always generate, join the corridor chain (so connectivity is
inherited and tested), never hold stairs, and come back tagged so story
content can be placed inside. Wired demo: every floor pins a `breakroom`
with a guaranteed Glurp cache.

**Engine prerequisite #2 — persistent day counter.** `core/meta.js` is the
"knowledge is permanent" half of the design: deaths, runs, surface day
(+1 per dungeon run), death-cause grudges, grades, best depth. It survives
death AND `newRun`. The HUD shows the day; Hespeth quotes it.

**Build step 1 — the Ledger + death messages + Hespeth's counter.**
- `systems/ledger.js`: cause-aware incident reports (deterministic, so the
  grudges are unit-tested, which the Ledger would hate), run grading
  (rubric never shown; dying to the same thing twice drops a full grade;
  after death #50 the reports just say "Yeah."), `ledgerize()` house
  spelling ("origenal," authoritative, will not be corrected), and
  ALL-CAPS loot lines for THE GOOD KIND.
- `content/hespeth.js`: death-count milestone dialogue, #1 "Oh no." →
  #30 "Stampathy and I were just talking about you."

**Build step 2 — topside hub slice.** Death is no longer game over:
`systems/respawn.js` files the incident report, applies the resurrection
deductible (half your gold, rounded up — per the ticket), resets
consumables to 1 Glurp (items are temporary), keeps your DIRK! (basically
immortal), and respawns you at the Guild Hall with the surface exactly as
you left it. Hub cast: Clerk Hespeth (quest + death processing), the Gift
Shop Gnoll (GLURP™ "Now With Fewer Eels!" and DIRK!™ "It's basically a
sword!"), and a Picketing Hero whose chants don't scan.

**Build step 3 (complete) — the Door Golem + customs.** The golem gates
the dungeon mouth (`systems/credentials.js`): a sword (any sword-shaped
object passes, with tier-appropriate commentary), a notarized tragic
backstory (the Ledger writes it, Hespeth stamps it — you don't get to read
it first), and crippling debt (one gift-shop purchase on credit suffices).
First credentialed entry triggers the stamp ceremony; the pause is sacred
and unit-tested (`>= 3` ellipsis lines, do not cut). Surfacing alive with
dungeon gold triggers customs: declare it (he inspects each coin,
individually, respectfully) or smuggle it — which the golem KNOWS, can't
prove, and writes in his little book. The book is the **Menace Résumé**
(`meta.menace`), readable in the customs dialogue; every page is about
you. Dying skips customs (the body bin has diplomatic status). The Ledger
also now grades every *survived* run on surfacing.

**Build step 5 (started) — the knowledge-puzzle framework.** The Riddle
Door That Learned Its Lesson (`systems/riddle.js`) joins the seal rotation
as a fourth puzzle type. It asks about things that happened THIS RUN —
kills by kind, Glurps consumed — all tracked in `runStats`. Wrong answers:
the door sighs and asks an easier one, more disappointed each time; the
third fallback is the floor number (it's written on the door); after three
misses it just asks your name, every answer is correct, and that is the
punishment.

**Re-voicing.** The overworld boss is the Middle Manager (he announces
"let's circle back" when he wakes — the telegraph IS the joke); the win
screen stamps TICKET #44,107; warden floors are "performance reviews."

## Not in this slice
The suggestion box long con, Gerald, Gregory, the museum, strata theming,
the Origenal Hero, menace-earning petty crimes beyond smuggling (the
Menace Résumé plumbing is in; puzzle #5 needs deeds to document). The bones for all of them exist:
pinned rooms hold fixed story content, `meta.day`/`meta.runs` drive the
long cons, and the effects interface is where the Ledger's narration
expands. The splash mockup (`some-hero-splash.html`) referenced in the doc
wasn't provided, so the title screen is a plain re-skin.

## Architecture
Unchanged from the engine README (three layers, injected effects, seedable
RNG). New atomic modules: `core/meta.js`, `systems/ledger.js`,
`systems/respawn.js`, `systems/credentials.js`, `systems/riddle.js`,
`content/hespeth.js`, `content/golem.js`. Death causes thread through
`hurtPlayer(game, dmg, fx, cause)`.
