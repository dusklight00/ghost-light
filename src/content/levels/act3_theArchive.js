import { defineLevel } from "./levelSchema.js";

// Act III: the Central Compliance Archive heist. Denser, shelving-like layout; guards are
// tankier than default so their cover-seeking reaction (triggered on taking damage — see
// ai.js onEnemyHit) actually gets a chance to play out before they go down.
export const act3TheArchive = defineLevel({
  defaultEnemyTuning: {
    visionRange: 270,
    fovHalfAngle: Math.PI * 0.48,
    chaseSpeed: 170,
    speed: 80,
    fireCooldownTime: 0.55,
    bulletSpeed: 420,
    damage: 11,
    hp: 45,
  },
  walls: (W, H) => {
    const t = 24;
    return [
      { x: 0, y: 0, w: W, h: t },
      { x: 0, y: H - t, w: W, h: t },
      { x: 0, y: 0, w: t, h: H },
      { x: W - t, y: 0, w: t, h: H },
      // three parallel archive shelving rows, staggered so none of them run wall-to-wall
      { x: W * 0.18, y: H * 0.12, w: t, h: H * 0.32 },
      { x: W * 0.18, y: H * 0.56, w: t, h: H * 0.32 },
      { x: W * 0.40, y: H * 0.20, w: t, h: H * 0.30 },
      { x: W * 0.40, y: H * 0.62, w: t, h: H * 0.28 },
      { x: W * 0.62, y: H * 0.10, w: t, h: H * 0.30 },
      { x: W * 0.62, y: H * 0.52, w: t, h: H * 0.38 },
      { x: W * 0.80, y: H * 0.30, w: t, h: H * 0.40 },
      // a couple of cross-aisles for cover/flanking
      { x: W * 0.18, y: H * 0.44, w: W * 0.22, h: t },
      { x: W * 0.62, y: H * 0.40, w: W * 0.18, h: t },
    ];
  },
  playerStart: (W, H) => ({ x: W * 0.06, y: H * 0.88 }),
  exitZone: (W, H) => ({ x: W * 0.90, y: H * 0.08, w: 55, h: 55 }),
  enemies: [
    { xf: 0.30, yf: 0.22 },
    { xf: 0.30, yf: 0.75 },
    { xf: 0.52, yf: 0.45 },
    { xf: 0.72, yf: 0.20 },
    { xf: 0.88, yf: 0.72 },
  ],
  objective: {
    withEnemies: "Objective: clear the Archive floor to unlock the exit",
    cleared: "Objective: reach the exit with the files",
  },
});
