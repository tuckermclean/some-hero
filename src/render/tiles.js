// Tile layer rendering.

import { T, TL, TCOL } from '../constants.js';
import { tileAt } from '../world/tilemap.js';
import { stairsOpen } from '../systems/puzzles.js';

export function drawTiles(ctx, game, view) {
  const { world, cam, t } = game;
  const h2 = world.h2;
  const x0 = Math.max(0, Math.floor(cam.x / T)), x1 = Math.min(world.w - 1, Math.ceil((cam.x + view.w) / T));
  const y0 = Math.max(0, Math.floor(cam.y / T)), y1 = Math.min(world.h - 1, Math.ceil((cam.y + view.h) / T));

  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const v = tileAt(world, x, y), px = x * T, py = y * T;
    ctx.fillStyle = TCOL[v]; ctx.fillRect(px, py, T, T);
    const r = h2(x * 5, y * 9);
    if (v === TL.SAND && r < .18) {
      ctx.fillStyle = 'rgba(0,0,0,.05)'; ctx.fillRect(px + 8 + r * 60 % 14, py + 10, 3, 2);
    } else if (v === TL.DUNE) {
      ctx.fillStyle = 'rgba(0,0,0,.08)';
      ctx.beginPath(); ctx.arc(px + T / 2, py + T * .8, T * .42, Math.PI, 0); ctx.fill();
    } else if (v === TL.ROCK) {
      ctx.fillStyle = '#8f6243'; ctx.fillRect(px + 3, py + 3, T - 6, T - 6);
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(px + 5, py + 5, T - 14, 4);
    } else if (v === TL.WATER) {
      ctx.fillStyle = 'rgba(255,255,255,.18)';
      const w1 = Math.sin(t * 2 + x * 1.3 + y * .7) * 3;
      ctx.fillRect(px + 5, py + 10 + w1, T - 10, 2); ctx.fillRect(px + 9, py + 22 - w1, T - 18, 2);
    } else if (v === TL.PALM) {
      ctx.fillStyle = '#cdb47e'; ctx.fillRect(px, py, T, T);
      ctx.fillStyle = '#7a5230'; ctx.fillRect(px + T / 2 - 3, py + 12, 6, T - 14);
      ctx.fillStyle = '#3f8a4f';
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * Math.PI * 2 + .4 + Math.sin(t + x) * 0.06;
        ctx.beginPath();
        ctx.ellipse(px + T / 2 + Math.cos(a) * 9, py + 11 + Math.sin(a) * 6, 10, 3.6, a, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (v === TL.PAVE) {
      ctx.strokeStyle = 'rgba(0,0,0,.1)'; ctx.strokeRect(px + 1, py + 1, T - 2, T - 2);
    } else if (v === TL.RFLOOR) {
      ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.strokeRect(px + .5, py + .5, T - 1, T - 1);
      if (r < .12) { ctx.fillStyle = 'rgba(0,0,0,.1)'; ctx.fillRect(px + 10, py + 14, 9, 3); }
    } else if (v === TL.RWALL) {
      ctx.fillStyle = '#6e523c'; ctx.fillRect(px + 2, py + 2, T - 4, T - 4);
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(px + 4, py + 4, T - 8, 5);
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(px + 4, py + T - 9, T - 8, 5);
    } else if (v === TL.WELL) {
      ctx.fillStyle = '#8a6a52'; ctx.beginPath(); ctx.arc(px + T / 2, py + T / 2, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2e9e8f'; ctx.beginPath(); ctx.arc(px + T / 2, py + T / 2, 8, 0, Math.PI * 2); ctx.fill();
    } else if (v === TL.ROAD) {
      ctx.fillStyle = 'rgba(0,0,0,.06)'; ctx.fillRect(px, py + 4, T, T - 8);
    } else if (v === TL.TF) {
      ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.strokeRect(px + .5, py + .5, T - 1, T - 1);
      if (r < .08) {
        ctx.fillStyle = 'rgba(116,196,184,.12)';
        ctx.fillRect(px + 12, py + 12, 12, 3); ctx.fillRect(px + 16, py + 8, 3, 11);
      }
    } else if (v === TL.TW) {
      ctx.fillStyle = '#1a120d'; ctx.fillRect(px, py, T, T);
      ctx.fillStyle = '#33261c'; ctx.fillRect(px + 2, py + 2, T - 4, T - 10);
      ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(px + 4, py + 4, T - 8, 4);
    } else if (v === TL.SD) {
      const open = game.zone === 'ow' || stairsOpen(game);
      ctx.fillStyle = '#15100b'; ctx.fillRect(px + 3, py + 3, T - 6, T - 6);
      if (open) {
        ctx.fillStyle = '#2a201a'; ctx.fillRect(px + 7, py + 7, T - 14, T - 14);
        ctx.fillStyle = '#3a2c22'; ctx.fillRect(px + 11, py + 11, T - 22, T - 22);
        ctx.fillStyle = 'rgba(116,196,184,' + (.3 + .2 * Math.sin(t * 3)) + ')';
        ctx.fillRect(px + 14, py + 14, T - 28, T - 28);
      } else {
        ctx.fillStyle = '#5a4a3c'; ctx.fillRect(px + 5, py + 5, T - 10, T - 10);
        ctx.strokeStyle = 'rgba(224,100,75,' + (.6 + .3 * Math.sin(t * 4)) + ')'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(px + T / 2, py + T / 2, 8, 0, Math.PI * 2);
        ctx.moveTo(px + T / 2, py + T / 2 - 12); ctx.lineTo(px + T / 2, py + T / 2 + 12); ctx.stroke();
      }
    } else if (v === TL.SU) {
      ctx.fillStyle = '#5a4a3c'; ctx.fillRect(px + 3, py + 3, T - 6, T - 6);
      ctx.fillStyle = '#6e5a48'; ctx.fillRect(px + 7, py + 7, T - 14, T - 14);
      ctx.fillStyle = '#83705c'; ctx.fillRect(px + 11, py + 11, T - 22, T - 22);
      ctx.fillStyle = '#f2d27a'; ctx.beginPath();
      ctx.moveTo(px + T / 2, py + 9); ctx.lineTo(px + T / 2 - 5, py + 17); ctx.lineTo(px + T / 2 + 5, py + 17);
      ctx.closePath(); ctx.fill();
    } else if (v === TL.PLATE) {
      const pl = game.plates.find(o => o.tx === x && o.ty === y);
      ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.strokeRect(px + .5, py + .5, T - 1, T - 1);
      ctx.fillStyle = pl && pl.on ? 'rgba(116,196,184,.5)' : 'rgba(0,0,0,.3)';
      ctx.beginPath(); ctx.arc(px + T / 2, py + T / 2, 11, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = pl && pl.on ? '#74c4b8' : '#8a6a52'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px + T / 2, py + T / 2, 11, 0, Math.PI * 2); ctx.stroke();
    }
  }
}
