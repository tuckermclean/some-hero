// Quest state machine.
// stage: 0 none, 1 hunting scarabs, 2 claim reward, 3 seek the Guardian, 4 amulet won.

/** Elder Naia gives the hunt. */
export function startHunt(quest) {
  quest.stage = 1;
  quest.kills = 0;
}

/** Called when a scarab dies. Returns true if the quest advanced/changed. */
export function recordScarabKill(quest) {
  if (quest.stage !== 1) return false;
  quest.kills++;
  if (quest.kills >= quest.need) quest.stage = 2;
  return true;
}

/** Elder Naia pays out and points at the tomb. */
export function claimReward(game) {
  game.player.gold += 50;
  game.quest.stage = 3;
}

/** Amulet collected. */
export function completeQuest(quest) {
  quest.stage = 4;
}

/** Overworld quest label (HTML). Your ticket, per the Ledger. */
export function questLabel(quest, deepest = 0) {
  if (quest.stage === 0) return 'TICKET #44,107: report to <b>Clerk Hespeth</b>';
  if (quest.stage === 1) return 'Pest control (it counts): <b>' + quest.kills + ' / ' + quest.need + '</b>';
  if (quest.stage === 2) return 'Return to <b>Clerk Hespeth</b> for stamping';
  if (quest.stage === 3) return 'Defeat <b>the Middle Manager</b> ↗ NE';
  return '<b>✦ Cancel the apocalypse (Downstairs) ✦</b>' + (deepest > 0 ? ' · depth ' + deepest : '');
}

/** Live quest line shown while inside the tomb (HTML). */
export function tombQuestLine(game) {
  let s = 'Floor ' + game.floorNum + ' · ';
  const pz = game.puzzle;
  if (!pz) return s + 'find the stairs';
  if (pz.type === 'warden') return s + ((game.boss && game.boss.dead) ? '<b>stairs open ↓</b>' : '<b>performance review: the Warden</b>');
  if (pz.type === 'key') return s + (pz.have ? '<b>stairs open ↓</b>' : 'find the <b>bronze key</b>');
  if (pz.type === 'plates') return s + (pz.solved ? '<b>stairs open ↓</b>' : 'plates <b>' + pz.done + ' / ' + pz.need + '</b>');
  if (pz.type === 'riddle') return s + (pz.solved ? '<b>stairs open ↓</b>' : 'answer <b>the door</b>');
  if (pz.type === 'traps') return s + (pz.solved ? '<b>stairs open ↓</b>' : 'incidents <b>' + pz.done + ' / ' + pz.need + '</b>');
  const lit = game.torches.filter(o => o.lit).length;
  return s + (pz.solved ? '<b>stairs open ↓</b>' : 'braziers <b>' + lit + ' / ' + pz.n + '</b>');
}
