// Procedural pixel-art textures — everything is drawn on a small offscreen canvas and sampled
// with NEAREST filtering (see gl.js), no image files anywhere in this project.

import { makeTexture } from "./gl.js";

function drawTopDownGuy(ctx, s, bodyColor, headColor, gunColor, outline) {
  const cx = s / 2, cy = s / 2 + s * 0.03;
  ctx.fillStyle = outline;
  ctx.beginPath(); ctx.ellipse(cx, cy, s * 0.40, s * 0.36, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = bodyColor;
  ctx.beginPath(); ctx.ellipse(cx, cy, s * 0.33, s * 0.30, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = headColor;
  ctx.beginPath(); ctx.ellipse(cx, cy - s * 0.10, s * 0.20, s * 0.18, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = gunColor;
  ctx.fillRect(cx - s * 0.05, s * 0.02, s * 0.10, s * 0.30);
}

// A simple front-facing bust for dialogue portraits: hair block, face oval, two-tone outfit.
// Exported so plain 2D-canvas UI components (dialogue boxes, cutscenes) can draw the same art
// directly, without needing a WebGL context.
export function drawPortrait(ctx, s, { skin, hair, outfit, accent }) {
  ctx.fillStyle = outfit;
  ctx.fillRect(s * 0.15, s * 0.62, s * 0.70, s * 0.38);
  ctx.fillStyle = accent;
  ctx.fillRect(s * 0.15, s * 0.62, s * 0.70, s * 0.06);
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.ellipse(s * 0.5, s * 0.42, s * 0.22, s * 0.26, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = hair;
  ctx.beginPath(); ctx.ellipse(s * 0.5, s * 0.24, s * 0.25, s * 0.16, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(s * 0.25, s * 0.20, s * 0.50, s * 0.14);
  ctx.fillStyle = "#0000004d";
  ctx.fillRect(s * 0.34, s * 0.44, s * 0.08, s * 0.04);
  ctx.fillRect(s * 0.58, s * 0.44, s * 0.08, s * 0.04);
}

export const PORTRAIT_PALETTES = {
  elias: { skin: "#d9b08c", hair: "#3a2a1c", outfit: "#2a3138", accent: "#1fb8d6" },
  naila: { skin: "#c99a76", hair: "#241a14", outfit: "#3a2436", accent: "#c74fae" },
  sable: { skin: "#e2c3a3", hair: "#8d8d8d", outfit: "#26292c", accent: "#c9c9c9" },
  wire: { skin: "#8a5a3c", hair: "#141414", outfit: "#233d2e", accent: "#3ee06b" },
  echo: { skin: "#caa27e", hair: "#4a1f1f", outfit: "#33202a", accent: "#e0a13e" },
  latch: { skin: "#b98a63", hair: "#5c4a3a", outfit: "#3a2e22", accent: "#d97a3e" },
  draeger: { skin: "#e6d2c0", hair: "#c7c7c7", outfit: "#43474d", accent: "#e63d3d" },
};

export function createTextures(ctx) {
  const floorTex = makeTexture(ctx, (c2d, s) => {
    c2d.fillStyle = "#171a20";
    c2d.fillRect(0, 0, s, s);
    c2d.fillStyle = "#1d212a";
    c2d.fillRect(0, 0, s, 2);
    c2d.fillRect(0, 0, 2, s);
    c2d.fillStyle = "#12151b";
    for (let i = 0; i < 6; i++) c2d.fillRect((i * 37 + 5) % s, (i * 53 + 9) % s, 2, 2);
  }, 32, true);

  const wallTex = makeTexture(ctx, (c2d, s) => {
    c2d.fillStyle = "#54565f";
    c2d.fillRect(0, 0, s, s);
    c2d.fillStyle = "#3c3d45";
    for (let row = 0; row < 4; row++) {
      const y = row * (s / 4);
      c2d.fillRect(0, y, s, 2);
      const offset = (row % 2) * (s / 8);
      c2d.fillRect(offset % s, y, 2, s / 4);
      c2d.fillRect((offset + s / 4) % s, y, 2, s / 4);
      c2d.fillRect((offset + s / 2) % s, y, 2, s / 4);
      c2d.fillRect((offset + 3 * s / 4) % s, y, 2, s / 4);
    }
    c2d.fillStyle = "#63656e";
    c2d.fillRect(4, 4, 4, 4);
    c2d.fillRect(s / 2 + 6, s / 2 + 2, 4, 4);
  }, 32, true);

  const exitTex = makeTexture(ctx, (c2d, s) => {
    c2d.fillStyle = "#123d1c";
    c2d.fillRect(0, 0, s, s);
    c2d.fillStyle = "#1f7a3d";
    c2d.fillRect(2, 2, s - 4, s - 4);
    c2d.fillStyle = "#123d1c";
    c2d.fillRect(4, 4, s - 8, s - 8);
    c2d.fillStyle = "#3ee06b";
    c2d.beginPath();
    c2d.moveTo(s * 0.3, s * 0.65); c2d.lineTo(s * 0.5, s * 0.3); c2d.lineTo(s * 0.7, s * 0.65);
    c2d.closePath(); c2d.fill();
    c2d.fillRect(s * 0.42, s * 0.55, s * 0.16, s * 0.2);
  }, 32, false);

  const playerTex = makeTexture(ctx, (c2d, s) => drawTopDownGuy(c2d, s, "#1fb8d6", "#0d5866", "#eafbff", "#093036"), 32, false);
  const enemyTex = makeTexture(ctx, (c2d, s) => drawTopDownGuy(c2d, s, "#d8d8d8", "#8a8a8a", "#ffffff", "#3a3a3a"), 32, false);
  const whiteTex = makeTexture(ctx, (c2d, s) => { c2d.fillStyle = "#fff"; c2d.fillRect(0, 0, s, s); }, 2, false);

  const portraits = {};
  for (const [name, palette] of Object.entries(PORTRAIT_PALETTES)) {
    portraits[name] = makeTexture(ctx, (c2d, s) => drawPortrait(c2d, s, palette), 64, false);
  }

  return { floorTex, wallTex, exitTex, playerTex, enemyTex, whiteTex, portraits };
}
