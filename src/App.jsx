import { useState } from "react";
import { GameCanvas } from "./engine/GameCanvas.jsx";
import { act5Vault12 } from "./content/levels/act5_vault12.js";

// Temporary smoke-test shell: just runs the finale level standalone so the ported engine can be
// verified before the full campaign state machine (menu/cutscenes/acts) is wired on top of it.
export function App() {
  const [runId, setRunId] = useState(0);
  const [result, setResult] = useState(null); // null | "won" | "lost"

  if (result) {
    return (
      <div style={{
        position: "fixed", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", color: "#fff",
        font: "20px monospace", background: "rgba(0,0,0,0.65)", textAlign: "center",
      }}>
        <div>{result === "won" ? "Objective complete — you escaped!" : "You were eliminated"}</div>
        <button
          style={{ marginTop: 16, padding: "8px 20px", font: "16px monospace", cursor: "pointer" }}
          onClick={() => { setResult(null); setRunId(id => id + 1); }}
        >
          Restart
        </button>
      </div>
    );
  }

  return (
    <GameCanvas
      key={runId}
      levelDef={act5Vault12}
      onWin={() => setResult("won")}
      onLose={() => setResult("lost")}
      hint="Move: WASD / Arrows   Aim: Mouse   Shoot: Hold Left Click"
    />
  );
}
