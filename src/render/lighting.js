// Lantern darkness: screen-space radial vignette around the player in the tomb.

export function drawLantern(ctx, game, screen) {
  if (game.zone !== 'tomb') return;
  const { W, H, scale } = screen;
  const px = (game.player.x - game.cam.x) * scale, py = (game.player.y - game.cam.y) * scale;
  const flick = 1 + Math.sin(game.t * 9) * .03;
  const g = ctx.createRadialGradient(px, py, H * 0.15 * flick, px, py, H * 0.62 * flick);
  g.addColorStop(0, 'rgba(12,8,6,0)');
  g.addColorStop(.7, 'rgba(12,8,6,.45)');
  g.addColorStop(1, 'rgba(12,8,6,.88)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}
