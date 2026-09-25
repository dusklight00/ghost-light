import { defineLevel } from "./levelSchema.js";

// Act II: the Undertow's training run. Two guards, gentle tuning — this is the player's first
// real look at the Wedge, the Chorus, hearing, dodge and cover, so nothing here should punish
// a mistake too hard.
export const act2TheUndertow = defineLevel({
  defaultEnemyTuning: {
    visionRange: 200,
    fovHalfAngle: Math.PI * 0.45,
    chaseSpeed: 150,
    speed: 70,
    fireCooldownTime: 0.7,
    bulletSpeed: 380,
    damage: 8,
    hp: 30,
  },
  walls: (W, H) => {
    const t = 24;
    return [
      { x: 0, y: 0, w: W, h: t },
      { x: 0, y: H - t, w: W, h: t },
      { x: 0, y: 0, w: t, h: H },
      { x: W - t, y: 0, w: t, h: H },
      // a single training partition splitting the flooded platform roughly in half
      { x: W * 0.48, y: H * 0.10, w: t, h: H * 0.35 },
      { x: W * 0.48, y: H * 0.55, w: t, h: H * 0.35 },
      // one low crate-row guards can duck behind
      { x: W * 0.22, y: H * 0.65, w: W * 0.18, h: t },
    ];
  },
  playerStart: (W, H) => ({ x: W * 0.10, y: H * 0.50 }),
  exitZone: (W, H) => ({ x: W * 0.90, y: H * 0.50 - 25, w: 50, h: 50 }),
  enemies: [
    { xf: 0.70, yf: 0.25 },
    { xf: 0.72, yf: 0.75 },
  ],
  objective: {
    withEnemies: "Objective: down both guards to open the training-room exit",
    cleared: "Objective: reach the exit",
  },
});
