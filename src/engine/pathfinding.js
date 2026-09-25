// Grid-based A* so guards route around walls instead of walking into them, plus the
// "follow this target, recomputing occasionally" helper every AI state (chase/investigate/
// cover/wander) shares.

import { moveWithCollision, hasLineOfSight } from "./physics.js";

export function buildGrid(walls, width, height) {
  const cell = 32;
  const cols = Math.ceil(width / cell), rows = Math.ceil(height / cell);
  const blocked = new Uint8Array(cols * rows);
  const margin = 10; // keeps the path a body-width away from wall faces
  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const cx = gx * cell + cell / 2, cy = gy * cell + cell / 2;
      let block = false;
      for (const w of walls) {
        if (cx > w.x - margin && cx < w.x + w.w + margin && cy > w.y - margin && cy < w.y + w.h + margin) { block = true; break; }
      }
      blocked[gy * cols + gx] = block ? 1 : 0;
    }
  }
  return { cell, cols, rows, blocked };
}

export function cellBlocked(grid, gx, gy) {
  if (gx < 0 || gy < 0 || gx >= grid.cols || gy >= grid.rows) return true;
  return grid.blocked[gy * grid.cols + gx] === 1;
}

export function randomOpenPoint(grid) {
  for (let tries = 0; tries < 30; tries++) {
    const gx = Math.floor(Math.random() * grid.cols), gy = Math.floor(Math.random() * grid.rows);
    if (!cellBlocked(grid, gx, gy)) return { x: gx * grid.cell + grid.cell / 2, y: gy * grid.cell + grid.cell / 2 };
  }
  return null;
}

const NEIGHBORS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

export function findPath(grid, sx, sy, tx, ty) {
  const startGx = Math.floor(sx / grid.cell), startGy = Math.floor(sy / grid.cell);
  const goalGx = Math.floor(tx / grid.cell), goalGy = Math.floor(ty / grid.cell);
  const goalKey = goalGy * grid.cols + goalGx;
  if (cellBlocked(grid, goalGx, goalGy) || (startGx === goalGx && startGy === goalGy)) return [];

  const open = [{ gx: startGx, gy: startGy, g: 0, f: Math.hypot(startGx - goalGx, startGy - goalGy) }];
  const cameFrom = new Map();
  const gScore = new Map([[startGy * grid.cols + startGx, 0]]);
  const closed = new Set();

  let iterations = 0;
  while (open.length > 0 && iterations++ < 4000) {
    let bestIdx = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[bestIdx].f) bestIdx = i;
    const current = open.splice(bestIdx, 1)[0];
    const curKey = current.gy * grid.cols + current.gx;
    if (curKey === goalKey) {
      const path = [];
      let k = curKey;
      while (cameFrom.has(k)) {
        const gx = k % grid.cols, gy = Math.floor(k / grid.cols);
        path.push({ x: gx * grid.cell + grid.cell / 2, y: gy * grid.cell + grid.cell / 2 });
        k = cameFrom.get(k);
      }
      return path.reverse();
    }
    if (closed.has(curKey)) continue;
    closed.add(curKey);
    for (const [dx, dy] of NEIGHBORS) {
      const nx = current.gx + dx, ny = current.gy + dy;
      if (cellBlocked(grid, nx, ny)) continue;
      if (dx !== 0 && dy !== 0 && (cellBlocked(grid, current.gx + dx, current.gy) || cellBlocked(grid, current.gx, current.gy + dy))) continue;
      const nKey = ny * grid.cols + nx;
      if (closed.has(nKey)) continue;
      const tentativeG = current.g + (dx !== 0 && dy !== 0 ? 1.41421 : 1);
      if (!gScore.has(nKey) || tentativeG < gScore.get(nKey)) {
        gScore.set(nKey, tentativeG);
        cameFrom.set(nKey, curKey);
        open.push({ gx: nx, gy: ny, g: tentativeG, f: tentativeG + Math.hypot(nx - goalGx, ny - goalGy) });
      }
    }
  }
  return null; // unreachable within budget
}

// Moves an enemy toward (tx,ty) following its cached path, recomputing when the target moves or
// the cache goes stale; falls back to a direct line if no path exists. Returns true on arrival.
export function followTarget(e, tx, ty, dt, speed, grid, walls) {
  e.pathRecalc -= dt;
  const targetMoved = !e.pathTarget || Math.hypot(tx - e.pathTarget.x, ty - e.pathTarget.y) > 40;
  if (e.pathRecalc <= 0 || targetMoved) {
    e.path = findPath(grid, e.x + e.w / 2, e.y + e.h / 2, tx, ty) || [];
    e.pathTarget = { x: tx, y: ty };
    e.pathRecalc = 0.5;
  }
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2;
  while (e.path.length > 0 && Math.hypot(e.path[0].x - ecx, e.path[0].y - ecy) < 10) e.path.shift();
  if (e.path.length > 0) {
    const wp = e.path[0];
    const ddx = wp.x - ecx, ddy = wp.y - ecy, dd = Math.hypot(ddx, ddy) || 1;
    e.facing = Math.atan2(ddy, ddx);
    moveWithCollision(e, (ddx / dd) * speed * dt, (ddy / dd) * speed * dt, walls);
    return false;
  }
  const ddx = tx - ecx, ddy = ty - ecy, dd = Math.hypot(ddx, ddy);
  if (dd < 10) return true;
  e.facing = Math.atan2(ddy, ddx);
  moveWithCollision(e, (ddx / dd) * speed * dt, (ddy / dd) * speed * dt, walls);
  return false;
}

// Scripted "smart guard" helper: nearest wall corner that's out of the player's sight line —
// rule-based stand-in for a trained cover-seeking policy.
export function findCoverPoint(e, targetPlayer, walls) {
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2;
  const pcx = targetPlayer.x + targetPlayer.w / 2, pcy = targetPlayer.y + targetPlayer.h / 2;
  let best = null, bestDist = Infinity;
  for (const w of walls) {
    const wcx = w.x + w.w / 2, wcy = w.y + w.h / 2;
    const corners = [[w.x, w.y], [w.x + w.w, w.y], [w.x, w.y + w.h], [w.x + w.w, w.y + w.h]];
    for (const [cx, cy] of corners) {
      const dirx = cx - wcx, diry = cy - wcy;
      const len = Math.hypot(dirx, diry) || 1;
      const px = cx + (dirx / len) * 18, py = cy + (diry / len) * 18;
      const d = Math.hypot(px - ecx, py - ecy);
      if (d > 260 || hasLineOfSight(px, py, pcx, pcy, walls)) continue;
      if (d < bestDist) { bestDist = d; best = { x: px, y: py }; }
    }
  }
  return best;
}
