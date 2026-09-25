export function EndingScreen({ onRestart }) {
  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 24,
      background: "radial-gradient(circle at 50% 40%, #4a3418 0%, #241c10 55%, #0a0704 140%)",
      color: "#f0e6d2", textAlign: "center", padding: "0 10%",
    }}>
      <div style={{ font: "italic 22px/1.7 Georgia, serif", maxWidth: 620 }}>
        The lantern still burns a warmer color than any Lumen bulb ever has.
        <br />
        Rewind, if you like. Some lights are worth passing by more than once.
      </div>
      <button
        onClick={onRestart}
        style={{
          marginTop: 8, padding: "12px 36px", font: "bold 16px monospace",
          letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
          background: "#caa15a", color: "#241c10", border: "none", borderRadius: 3,
        }}
      >
        Play Again
      </button>
    </div>
  );
}
