// Transient toast messages.

export function makeToast(el) {
  let t = 0;
  return {
    show(msg) {
      el.textContent = msg;
      el.style.opacity = 1;
      t = 2.4;
    },
    tick(dt) {
      if (t > 0) {
        t -= dt;
        if (t <= 0) el.style.opacity = 0;
      }
    }
  };
}
