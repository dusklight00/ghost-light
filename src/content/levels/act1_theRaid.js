import { defineLevel } from "./levelSchema.js";

// Act I vignette: no combat, no guards — just the street outside the apartment block, the night
// Naila is taken. The player rounds the corner and runs toward the steps; reaching them is the
// only interaction, and it fires onWin regardless (noCombat) so the cutscene can take it from here.
export const act1TheRaid = defineLevel({
  noCombat: true,
  walls: (W, H) => {
    const t = 24;
    return [
      // outer bounds of the street block
      { x: 0, y: 0, w: W, h: t },
      { x: 0, y: H - t, w: W, h: t },
      { x: 0, y: 0, w: t, h: H },
      { x: W - t, y: 0, w: t, h: H },
      // a narrow side-street corner the player rounds at the start
      { x: W * 0.10, y: 0, w: t, h: H * 0.30 },
      { x: W * 0.10, y: H * 0.30, w: W * 0.20, h: t },
      // a couple of shallow apartment-door alcoves lining the block, just for texture —
      // small dead-end recesses, not a maze
      { x: W * 0.42, y: H * 0.18, w: W * 0.10, h: t },
      { x: W * 0.42, y: H * 0.18, w: t, h: H * 0.14 },
      { x: W * 0.68, y: H * 0.55, w: W * 0.10, h: t },
      { x: W * 0.76, y: H * 0.55, w: t, h: H * 0.14 },
    ];
  },
  playerStart: (W, H) => ({ x: W * 0.14, y: H * 0.18 }),
  exitZone: (W, H) => ({ x: W * 0.78, y: H * 0.80, w: 60, h: 60 }),
  enemies: [],
});
