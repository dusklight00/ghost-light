import { defineLevel } from "./levelSchema.js";

// The finale: Vault 12. Full squad-alert, wide-FOV, fast-firing tuning — this is the "make it
// so so so hard" difficulty pass, unchanged from the standalone prototype.
export const act5Vault12 = defineLevel({
  walls: (W, H) => {
    const t = 24;
    return [
      { x: 0, y: 0, w: W, h: t },
      { x: 0, y: H - t, w: W, h: t },
      { x: 0, y: 0, w: t, h: H },
      { x: W - t, y: 0, w: t, h: H },
      { x: W * 0.20, y: H * 0.15, w: t, h: H * 0.35 },
      { x: W * 0.20, y: H * 0.55, w: W * 0.25, h: t },
      { x: W * 0.45, y: H * 0.20, w: t, h: H * 0.45 },
      { x: W * 0.60, y: H * 0.60, w: W * 0.22, h: t },
      { x: W * 0.75, y: H * 0.25, w: t, h: H * 0.35 },
      { x: W * 0.35, y: H * 0.75, w: W * 0.15, h: t },
      { x: W * 0.08, y: H * 0.40, w: W * 0.12, h: t },
    ];
  },
  playerStart: (W, H) => ({ x: W * 0.08, y: H * 0.85 }),
  exitZone: (W) => ({ x: W - 90, y: 40, w: 50, h: 50 }),
  enemies: [
    { xf: 0.30, yf: 0.30 },
    { xf: 0.55, yf: 0.75 },
    { xf: 0.68, yf: 0.40 },
    { xf: 0.85, yf: 0.80 },
    { xf: 0.15, yf: 0.60 },
    { xf: 0.45, yf: 0.85 },
    { xf: 0.90, yf: 0.15 },
    { xf: 0.60, yf: 0.10 },
  ],
  objective: {
    withEnemies: "Objective: clear Vault 12 to unlock the exit",
    cleared: "Objective: reach the exit — get out",
  },
});
