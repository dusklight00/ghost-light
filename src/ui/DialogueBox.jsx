import { PortraitCanvas } from "./PortraitCanvas.jsx";

// Renders one line of dialogue. Advancing is click-only here — CutsceneScreen owns the
// Space/Enter keydown listener so a single keypress never double-advances.
export function DialogueBox({ speaker, text, onAdvance }) {
  if (speaker === "narration") {
    return (
      <div
        onClick={onAdvance}
        style={{
          position: "fixed", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
          padding: "0 12%", cursor: "pointer", userSelect: "none",
        }}
      >
        <div style={{
          color: "#e7e2d6", font: "italic 26px/1.6 Georgia, serif",
          textAlign: "center", textShadow: "0 0 10px rgba(0,0,0,0.6)",
        }}>
          {text}
        </div>
      </div>
    );
  }

  const name = speaker ? speaker.charAt(0).toUpperCase() + speaker.slice(1) : "";

  return (
    <div
      onClick={onAdvance}
      style={{
        position: "fixed", left: 0, right: 0, bottom: 0,
        display: "flex", alignItems: "flex-start", gap: 20,
        padding: "20px 28px 26px", cursor: "pointer", userSelect: "none",
        background: "rgba(10,12,16,0.92)",
        borderTop: "2px solid #caa15a",
        boxShadow: "0 -8px 30px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ flexShrink: 0, border: "2px solid #caa15a", borderRadius: 4, overflow: "hidden" }}>
        <PortraitCanvas name={speaker} size={96} />
      </div>
      <div style={{ flex: 1, minWidth: 0, position: "relative", paddingBottom: 18 }}>
        <div style={{
          color: "#caa15a", font: "bold 14px monospace", letterSpacing: "0.08em",
          textTransform: "uppercase", marginBottom: 6,
        }}>
          {name}
        </div>
        <div style={{ color: "#f0ede4", font: "18px/1.5 Georgia, serif" }}>
          {text}
        </div>
        <div style={{
          position: "absolute", right: 0, bottom: -4,
          color: "#888", font: "12px monospace",
        }}>
          ▸ click or press space to continue
        </div>
      </div>
    </div>
  );
}
