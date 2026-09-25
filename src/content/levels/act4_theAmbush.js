import { defineLevel } from "./levelSchema.js";

// Act IV: the compromised extraction. This is a "flee, don't clear" level (winWithoutClearing) —
// reaching the fallback exit wins even with guards still standing, mirroring the crew falling
// back through Latch's held chokepoint rather than finishing the fight. Tougher than act3, just
// short of act5's finale extreme.
export const act4TheAmbush = defineLevel({
  winWithoutClearing: true,
  defaultEnemyTuning: {
    visionRange: 300,
    fovHalfAngle: Math.PI * 0.5,
    chaseSpeed: 190,
    speed: 85,
    fireCooldownTime: 0.5,
    bulletSpeed: 440,
    damage: 12,
    hp: 30,
  },
  walls: (W, H) => {
    const t = 24;
    return [
      { x: 0, y: 0, w: W, h: t },
      { x: 0, y: H - t, w: W, h: t },
      { x: 0, y: 0, w: t, h: H },
      { x: W - t, y: 0, w: t, h: H },
      // a zig-zag extraction corridor: staggered chokepoint walls forcing the player through
      // a narrow gauntlet rather than an open room
      { x: W * 0.20, y: 0, w: t, h: H * 0.62 },
      { x: W * 0.38, y: H * 0.38, w: t, h: H * 0.62 },
      { x: W * 0.56, y: 0, w: t, h: H * 0.62 },
      { x: W * 0.74, y: H * 0.38, w: t, h: H * 0.62 },
    ];
  },
  playerStart: (W, H) => ({ x: W * 0.06, y: H * 0.50 }),
  exitZone: (W, H) => ({ x: W * 0.90, y: H * 0.46, w: 55, h: 55 }),
  enemies: [
    { xf: 0.29, yf: 0.80 },
    { xf: 0.29, yf: 0.20 },
    { xf: 0.47, yf: 0.20 },
    { xf: 0.65, yf: 0.80 },
    { xf: 0.65, yf: 0.20 },
    { xf: 0.83, yf: 0.75 },
  ],
  objective: {
    withEnemies: "Objective: get to the fallback exit — don't stop to fight",
    cleared: "Objective: reach the fallback exit",
  },
});
