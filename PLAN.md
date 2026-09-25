# GHOSTLIGHT — Implementation Plan

Turning the single-file WebGL prototype (`index.html`) into a full Vite + React game that plays through the GHOSTLIGHT story from `README.md`, keeping every existing mechanic (movement, shooting, FOV cone, hearing, pathfinding, wandering, cover, dodge, squad-alert, hit-flash, exit-unlock) intact.

## Architecture

```
game/
  legacy/prototype.html        — original single-file build, kept as reference/fallback
  index.html                   — new Vite entry point
  package.json, vite.config.js
  src/
    main.jsx                   — React root
    App.jsx                    — campaign state machine: Menu → Cutscene → Level → Cutscene → ... → Ending
    engine/
      gl.js                    — WebGL context + shader compile/link
      renderer.js              — batched quad/triangle draw calls (ported as-is)
      sprites.js               — procedural pixel-art generators: player/guard/floor/wall/exit + new character portrait busts for cutscenes
      input.js                 — keyboard/mouse state
      physics.js               — aabb / collision / moveWithCollision
      pathfinding.js           — grid build + A* (ported as-is)
      ai.js                    — guard state machine: FOV, hearing, chase, investigate, cover, dodge, squad-alert (ported as-is)
      GameCanvas.jsx           — React component: WebGL canvas + rAF loop, takes a level definition, fires onWin/onLose/onNarrativeEvent
    content/
      story/
        dialogue/act1.js..act5.js   — the README's scenes condensed into spoken dialogue lines per character
      levels/
        act1_theRaid.js         — non-combat scripted vignette (the night Naila is taken)
        act2_theUndertow.js     — tutorial level, diegetic call-outs the first time you enter a cone / get heard / get dodged-at
        act3_theArchive.js      — medium heist level, cover-seeking guards front and center
        act4_theAmbush.js       — Latch's last stand + the Wire/Naila-alive reveal
        act5_vault12.js         — the finale — current hardest tuning (8 guards, wide FOV, squad alert)
      levelSchema.js            — shared shape: { walls, enemySpawns, exitZone, playerStart, triggers }
    ui/
      DialogueBox.jsx, CutsceneScreen.jsx, HUD.jsx, MainMenu.jsx, EndingScreen.jsx
    state/
      gameState.js              — React context + reducer: current act, story flags, health carryover

public/                          — empty; everything is procedural, no binary assets to serve
```

## Story → level mapping

| Act | Level | Beat |
|---|---|---|
| I | scripted vignette, no combat | ordinary life → the raid → Elias left for dead |
| II | 1-guard tutorial | Undertow training; Echo/Latch/Wire lines trigger the first time you actually enter a cone / get heard / get dodged at |
| III | medium heist (4-5 guards) | the Archive job; cover-seeking guards introduced hard |
| IV | scripted last-stand + cutscenes | Latch's death, Wire's betrayal reveal, "Naila is alive" gut-punch |
| V | current hard tuning (8 guards) | Vault 12, Draeger, reunion, the sacrifice, epilogue |

Cutscenes are static illustrated dialogue beats (two procedurally-drawn pixel-art portraits + mood-colored backdrop + dialogue box), not animated cinematics — keeps this achievable without an animation/video pipeline.

## Explicit scope cuts

- No audio/voice — text + existing procedural visuals only, unless you ask for SFX after.
- No branching choices — linear, matches the README exactly.
- No save system beyond per-act restart.
- No new npm dependencies beyond React/Vite itself (no state library, no animation library) — five acts of state doesn't need one.

## Execution order

1. **Sequential (me):** git init for a safety net, preserve the current prototype under `legacy/`, scaffold Vite+React by hand, port the engine 1:1 with zero behavior change, verify the ported version plays identically to the original before adding anything new.
2. **Parallel (forks), once the port is verified:**
   - Fork A — write the five level definition files against `levelSchema`.
   - Fork B — write the five dialogue content files from the README's prose.
   - Fork C — build `DialogueBox`/`CutsceneScreen` UI and the new portrait sprite generators.
3. **Sequential (me):** wire `App.jsx`'s act state machine together, hook narrative trigger flags into the existing AI callbacks, playtest the full campaign start to finish, `npm run build` to confirm it's error-free.

I can't take a screenshot in this environment, so once it's running I'll ask you to eyeball it — I'll flag anything I couldn't verify myself.
