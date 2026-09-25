// Pure geometry helpers — every function takes the walls it needs explicitly instead of
// reaching for module-level globals, so a level's state lives entirely in the Game instance.

export function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export function hitsWall(entRect, walls) {
  for (const w of walls) if (aabb(entRect, w)) return true;
  return false;
}

export function hasLineOfSight(x0, y0, x1, y1, walls) {
  const dx = x1 - x0, dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.floor(dist / 10));
  for (let i = 1; i < steps; i++) {
    const px = x0 + (dx * i) / steps;
    const py = y0 + (dy * i) / steps;
    for (const w of walls) if (pointInRect(px, py, w)) return false;
  }
  return true;
}

// Exact ray-vs-wall distance (slab method) — used to clip the guard's vision cone at the first
// wall it hits, so the flashlight-style cone is properly wall-occluded instead of shining through.
export function raycastDistance(ox, oy, dx, dy, maxDist, walls) {
  let nearest = maxDist;
  const invDx = 1 / dx, invDy = 1 / dy;
  for (const w of walls) {
    let t1 = (w.x - ox) * invDx, t2 = (w.x + w.w - ox) * invDx;
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
    let t3 = (w.y - oy) * invDy, t4 = (w.y + w.h - oy) * invDy;
    if (t3 > t4) { const tmp = t3; t3 = t4; t4 = tmp; }
    const tmin = Math.max(t1, t3), tmax = Math.min(t2, t4);
    if (tmax < 0 || tmin > tmax) continue;
    const t = tmin >= 0 ? tmin : tmax;
    if (t >= 0 && t < nearest) nearest = t;
  }
  return nearest;
}

export function angleDiff(a, b) {
  let d = Math.abs(a - b) % (Math.PI * 2);
  return d > Math.PI ? Math.PI * 2 - d : d;
}

export function moveWithCollision(ent, dx, dy, walls) {
  ent.x += dx;
  if (hitsWall(ent, walls)) ent.x -= dx;
  ent.y += dy;
  if (hitsWall(ent, walls)) ent.y -= dy;
}
