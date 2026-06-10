// HUD: hp / xp bars, stat line, potion button label.

import { xpNeed } from '../systems/progression.js';

export function makeHud(els) {
  const { hpFill, xpFill, statline, btnP, hud, questEl } = els;
  return {
    update(player, meta) {
      hpFill.style.width = (player.hp / player.maxhp * 100) + '%';
      xpFill.style.width = (player.xp / xpNeed(player) * 100) + '%';
      statline.textContent = 'Lv ' + player.lv + ' · ' + player.gold + ' g · Day ' + (meta ? meta.day : 1)
        + (player.swordLv > 1 ? ' · ' + '⚔'.repeat(player.swordLv - 1) : '');
      btnP.textContent = '🧪 ' + player.potions;
    },
    setQuestHTML(html) { questEl.innerHTML = html; },
    show() { hud.style.opacity = 1; questEl.style.opacity = 1; },
    hide() { hud.style.opacity = 0; questEl.style.opacity = 0; }
  };
}
