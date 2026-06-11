// Full-screen overlays: death screen, win screen. (The title is the
// splash — see ui/splash.js.)

export function makeScreens(els) {
  const { over, overTitle, overSub, overTip } = els;
  return {
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
