// Full-screen overlays: title menu, death screen, win screen.

export function makeScreens(els) {
  const { menu, over, overTitle, overSub, overTip } = els;
  return {
    hideMenu() { menu.classList.add('hidden'); },
    hideOver() { over.classList.remove('hidden'); over.classList.add('hidden'); },
    showIncidentReport(report, grade, hespeth) {
      overTitle.textContent = 'INCIDENT REPORT';
      overSub.textContent = report + '  — run grade: ' + grade;
      overTip.textContent = hespeth + '\ntap for resurrection (deductible applies)';
      over.classList.remove('hidden');
    },
    showWin() {
      overTitle.textContent = '✦ TICKET #44,107: STAMPED ✦';
      overSub.textContent = '…and beneath the Middle Manager\u2019s desk, stairs grind open. The Downstairs awaits.';
      overTip.textContent = 'tap — then descend. NOW LEAVING: SAFETY.';
      over.classList.remove('hidden');
    },
    closeOver() { over.classList.add('hidden'); }
  };
}
