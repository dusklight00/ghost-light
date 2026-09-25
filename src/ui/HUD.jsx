export function HUD({ enemyCount, hp, maxHp, objective }) {
  const pct = Math.max(0, (hp / maxHp) * 100);
  return (
    <div style={{
      position: "fixed", top: 10, left: 12, color: "#eee",
      font: "15px monospace", textShadow: "0 0 4px #000", userSelect: "none",
    }}>
      {objective && <div>{objective}</div>}
      {objective && <div>Guards remaining: {enemyCount}</div>}
      <div style={{ width: 160, height: 14, background: "#300", border: "1px solid #900", marginTop: 4 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "#e33" }} />
      </div>
    </div>
  );
}
