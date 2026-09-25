import { useEffect, useRef, useState } from "react";
import { Game } from "./Game.js";
import { HUD } from "../ui/HUD.jsx";

// Mounts one level's WebGL canvas + HUD. Reports win/lose/narrative events up to the caller
// (the campaign state machine in App.jsx) instead of deciding what happens next itself.
export function GameCanvas({ levelDef, onWin, onLose, onEvent, hint }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const [hud, setHud] = useState({ enemyCount: 0, hp: 100, maxHp: 100, objective: "" });

  useEffect(() => {
    const game = new Game(canvasRef.current, levelDef, {
      onHud: setHud,
      onWin,
      onLose,
      onEvent,
    });
    gameRef.current = game;
    game.start();
    return () => game.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelDef]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#05060a", cursor: "crosshair" }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
      <HUD {...hud} />
      {hint && (
        <div style={{
          position: "fixed", bottom: 10, left: 12, color: "#888",
          font: "13px monospace", userSelect: "none",
        }}>{hint}</div>
      )}
    </div>
  );
}
