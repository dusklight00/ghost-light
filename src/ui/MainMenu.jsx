const DEFAULT_TAGLINE = "The lucky ones never learn to see in the dark. It only ever means something's coming.";

export function MainMenu({ onStart, title = "GHOSTLIGHT", tagline = DEFAULT_TAGLINE }) {
  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 28,
      background: "radial-gradient(circle at 50% 35%, #12151c 0%, #05060a 70%, #000 140%)",
      color: "#eee", textAlign: "center", padding: "0 8%",
    }}>
      <div style={{
        font: "bold 64px monospace", letterSpacing: "0.12em",
        color: "#1fb8d6", textShadow: "0 0 24px rgba(31,184,214,0.45)",
      }}>
        {title}
      </div>
      <div style={{
        font: "italic 18px/1.6 Georgia, serif", color: "#a9a49a", maxWidth: 560,
      }}>
        {tagline}
      </div>
      <button
        onClick={onStart}
        style={{
          marginTop: 12, padding: "12px 36px", font: "bold 16px monospace",
          letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
          background: "#caa15a", color: "#0b0d12", border: "none", borderRadius: 3,
        }}
      >
        Begin
      </button>
    </div>
  );
}
