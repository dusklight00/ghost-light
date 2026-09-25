import { useEffect, useState } from "react";
import { DialogueBox } from "./DialogueBox.jsx";

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function lighten(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  const mix = c => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

// Full-screen narrative beat: a mood-colored backdrop with one dialogue line at a time.
// Advances on click (via DialogueBox) or Space/Enter (owned here, as the single keyboard
// source of truth so a keypress never double-advances).
export function CutsceneScreen({ lines, onComplete, background = "#0b0d12" }) {
  const [index, setIndex] = useState(0);

  const advance = () => setIndex(i => i + 1);

  useEffect(() => {
    if (index >= lines.length) {
      onComplete && onComplete();
    }
  }, [index, lines.length, onComplete]);

  useEffect(() => {
    const onKeyDown = e => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (index >= lines.length) return null;
  const current = lines[index];

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: `radial-gradient(circle at 50% 40%, ${lighten(background, 0.18)} 0%, ${background} 55%, #000 140%)`,
      }}
    >
      <DialogueBox speaker={current.speaker} text={current.text} onAdvance={advance} />
    </div>
  );
}
