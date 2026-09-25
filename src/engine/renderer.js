// Batched draw calls, grouped per texture, plus the wall-occluded, fading flashlight cone.

import { raycastDistance } from "./physics.js";

export function createRenderer(ctx) {
  const { gl, buffer, resLoc } = ctx;
  let verts = [];

  function pushVert(x, y, u, v, r, g, b, a) { verts.push(x, y, u, v, r, g, b, a); }

  function quad(x0, y0, x1, y1, x2, y2, x3, y3, u0, v0, u1, v1, r, g, b, a) {
    pushVert(x0, y0, u0, v0, r, g, b, a); pushVert(x1, y1, u1, v0, r, g, b, a); pushVert(x2, y2, u0, v1, r, g, b, a);
    pushVert(x2, y2, u0, v1, r, g, b, a); pushVert(x1, y1, u1, v0, r, g, b, a); pushVert(x3, y3, u1, v1, r, g, b, a);
  }

  function rectTex(x, y, w, h, r, g, b, repeatU, repeatV, a) {
    quad(x, y, x + w, y, x, y + h, x + w, y + h, 0, 0, repeatU || 1, repeatV || 1, r, g, b, a === undefined ? 1 : a);
  }

  function rotatedRectTex(cx, cy, w, h, angle, r, g, b, a) {
    const c = Math.cos(angle), s = Math.sin(angle);
    const hw = w / 2, hh = h / 2;
    const rot = (lx, ly) => [cx + lx * c - ly * s, cy + lx * s + ly * c];
    const [x0, y0] = rot(-hw, -hh), [x1, y1] = rot(hw, -hh), [x2, y2] = rot(-hw, hh), [x3, y3] = rot(hw, hh);
    quad(x0, y0, x1, y1, x2, y2, x3, y3, 0, 0, 1, 1, r, g, b, a === undefined ? 1 : a);
  }

  function triangleFade(x0, y0, a0, x1, y1, a1, x2, y2, a2, r, g, b) {
    pushVert(x0, y0, 0, 0, r, g, b, a0); pushVert(x1, y1, 0, 0, r, g, b, a1); pushVert(x2, y2, 0, 0, r, g, b, a2);
  }

  // Flashlight-style vision cone: raycast per slice against the walls so the light stops at the
  // first wall it hits (a cheap 2D shadow-cast), fading from innerAlpha at the eye to 0 at the tip.
  function visionCone(cx, cy, angle, halfAngle, range, walls, r, g, b, innerAlpha) {
    const segments = 16;
    const step = (halfAngle * 2) / segments;
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const ang = angle - halfAngle + step * i;
      let dx = Math.cos(ang), dy = Math.sin(ang);
      if (Math.abs(dx) < 1e-6) dx = 1e-6;
      if (Math.abs(dy) < 1e-6) dy = 1e-6;
      const dist = raycastDistance(cx, cy, dx, dy, range, walls);
      pts.push({ x: cx + dx * dist, y: cy + dy * dist });
    }
    for (let i = 0; i < segments; i++) {
      triangleFade(cx, cy, innerAlpha, pts[i].x, pts[i].y, 0, pts[i + 1].x, pts[i + 1].y, 0, r, g, b);
    }
  }

  function flush(tex, width, height) {
    if (verts.length === 0) return;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform2f(resLoc, width, height);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, verts.length / 8);
    verts = [];
  }

  function clear() {
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  return { rectTex, rotatedRectTex, visionCone, flush, clear };
}
