// Actor rendering: shadows, NPCs, enemies, boss, player.

export function shadow(ctx, x, y, r) {
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  ctx.beginPath(); ctx.ellipse(x, y, r, r * .45, 0, 0, Math.PI * 2); ctx.fill();
}

export function drawNpc(ctx, n, game) {
  const t = game.t, player = game.player;
  shadow(ctx, n.x, n.y + 10, 9);
  const bob = Math.sin(t * 2 + n.x) * 1.2;
  ctx.fillStyle = n.col; ctx.fillRect(n.x - 7, n.y - 6 + bob, 14, 16);
  ctx.fillStyle = '#e8c0a0'; ctx.beginPath(); ctx.arc(n.x, n.y - 12 + bob, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = n.hat; ctx.fillRect(n.x - 8, n.y - 18 + bob, 16, 5);
  if (Math.hypot(n.x - player.x, n.y - player.y) < 44) {
    ctx.fillStyle = '#f6e7c8'; ctx.font = 'bold 11px Trebuchet MS';
    ctx.fillText('!', n.x - 2, n.y - 26 + Math.sin(t * 4) * 2);
  }
}

export function drawEnemy(ctx, e, game) {
  const t = game.t;
  shadow(ctx, e.x, e.y + e.h / 2 - 2, e.w / 2);
  const fl = e.flash > 0;
  if (e.kind === 'scarab') {
    ctx.fillStyle = fl ? '#fff' : e.col;
    ctx.beginPath(); ctx.ellipse(e.x, e.y, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.moveTo(e.x, e.y - 8); ctx.lineTo(e.x, e.y + 8); ctx.stroke();
    ctx.fillStyle = '#2a1c14'; ctx.fillRect(e.x - 7, e.y - 2, 3, 3); ctx.fillRect(e.x + 4, e.y - 2, 3, 3);
  } else if (e.kind === 'jackal') {
    ctx.fillStyle = fl ? '#fff' : e.col;
    ctx.fillRect(e.x - 11, e.y - 5, 22, 10);
    ctx.fillRect(e.x + 6, e.y - 12, 9, 9);
    ctx.beginPath(); ctx.moveTo(e.x + 7, e.y - 12); ctx.lineTo(e.x + 9, e.y - 18); ctx.lineTo(e.x + 12, e.y - 12); ctx.fill();
    ctx.fillStyle = '#2a1c14'; ctx.fillRect(e.x + 11, e.y - 9, 2, 2);
  } else if (e.kind === 'mummy') {
    ctx.fillStyle = fl ? '#fff' : e.col;
    ctx.fillRect(e.x - 9, e.y - 14, 18, 26);
    ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(e.x - 9, e.y - 11 + i * 7); ctx.lineTo(e.x + 9, e.y - 8 + i * 7); ctx.stroke();
    }
    ctx.fillStyle = '#2a1c14'; ctx.fillRect(e.x - 4, e.y - 10, 4, 4);
    ctx.fillStyle = '#e0644b'; ctx.fillRect(e.x + 1, e.y - 10, 4, 4);
  } else { // spirit
    const fade = .55 + .25 * Math.sin(t * 4 + e.x);
    ctx.globalAlpha = fade;
    ctx.fillStyle = fl ? '#fff' : e.col;
    ctx.beginPath(); ctx.arc(e.x, e.y - 3, 10, Math.PI, 0);
    ctx.lineTo(e.x + 10, e.y + 8);
    for (let i = 0; i < 4; i++) ctx.lineTo(e.x + 10 - (i + .5) * 5, e.y + 8 - (i % 2 ? 0 : 4));
    ctx.lineTo(e.x - 10, e.y + 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2a1c14'; ctx.fillRect(e.x - 5, e.y - 5, 3, 4); ctx.fillRect(e.x + 2, e.y - 5, 3, 4);
    ctx.globalAlpha = 1;
  }
  if (e.hp < e.maxhp) {
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(e.x - 10, e.y - e.h / 2 - 9, 20, 3);
    ctx.fillStyle = '#e0644b'; ctx.fillRect(e.x - 10, e.y - e.h / 2 - 9, 20 * e.hp / e.maxhp, 3);
  }
}

export function drawBoss(ctx, game) {
  const b = game.boss, t = game.t;
  shadow(ctx, b.x, b.y + 22, 22);
  const tele = b.state === 'tele' && Math.sin(t * 24) > 0;
  ctx.fillStyle = b.flash > 0 ? '#fff' : (tele ? '#e0644b' : '#8a6a52');
  // sarcophagus body
  ctx.beginPath();
  ctx.moveTo(b.x - 16, b.y + 22); ctx.lineTo(b.x - 20, b.y - 8); ctx.lineTo(b.x - 10, b.y - 24);
  ctx.lineTo(b.x + 10, b.y - 24); ctx.lineTo(b.x + 20, b.y - 8); ctx.lineTo(b.x + 16, b.y + 22);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f2d27a'; ctx.fillRect(b.x - 12, b.y - 18, 24, 4);
  if (b.state !== 'sleep') {
    ctx.fillStyle = '#74c4b8'; ctx.fillRect(b.x - 9, b.y - 10, 6, 5); ctx.fillRect(b.x + 3, b.y - 10, 6, 5);
  }
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(b.x - 21, b.y - 36, 42, 5);
  ctx.fillStyle = '#e0644b'; ctx.fillRect(b.x - 21, b.y - 36, 42 * b.hp / b.maxhp, 5);
}

export function drawPlayer(ctx, game) {
  const p = game.player, t = game.t;
  shadow(ctx, p.x, p.y + 10, 9);
  if (p.inv > 0 && Math.sin(t * 26) > 0) return;  // hit-flicker
  ctx.fillStyle = '#3f6f9e'; ctx.fillRect(p.x - 7, p.y - 5, 14, 15);          // robe
  ctx.fillStyle = '#e8c0a0'; ctx.beginPath(); ctx.arc(p.x, p.y - 11, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f6e7c8'; ctx.fillRect(p.x - 8, p.y - 16, 16, 5);          // turban
  ctx.fillStyle = '#e0644b'; ctx.fillRect(p.x + 4, p.y - 16, 4, 5);
  ctx.fillStyle = '#2a1c14';
  const ex = p.x + p.fx * 3; ctx.fillRect(ex - 3, p.y - 12, 2, 3); ctx.fillRect(ex + 1, p.y - 12, 2, 3);
  // sword swing
  if (p.atkT > 0.14) {
    const fm = Math.hypot(p.fx, p.fy) || 1, fx = p.fx / fm, fy = p.fy / fm;
    const prog = 1 - (p.atkT - 0.14) / 0.2;
    const a0 = Math.atan2(fy, fx) - 1.2 + prog * 2.4;
    ctx.strokeStyle = p.swordLv > 1 ? '#f2d27a' : '#d8d8d8'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(p.x + Math.cos(a0) * 10, p.y - 4 + Math.sin(a0) * 10);
    ctx.lineTo(p.x + Math.cos(a0) * 30, p.y - 4 + Math.sin(a0) * 30); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(p.x, p.y - 4, 26, a0 - .5, a0 + .1); ctx.stroke();
  }
}
