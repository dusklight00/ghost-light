import { useEffect, useRef } from "react";
import { drawPortrait, PORTRAIT_PALETTES } from "../engine/sprites.js";

// Draws a character bust on a plain 2D canvas (no WebGL needed) using the same procedural
// pixel-art routine the in-game portrait textures use.
export function PortraitCanvas({ name, size = 128 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, size, size);
    const palette = PORTRAIT_PALETTES[name];
    if (palette) drawPortrait(ctx, size, palette);
  }, [name, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size, imageRendering: "pixelated", display: "block" }}
    />
  );
}
