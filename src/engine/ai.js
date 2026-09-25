// Guard behavior: directional sight (the Wedge), squad-wide alert (the Chorus), hearing,
// chase/investigate/wander via pathfinding, dodge, and cover-seeking.

import { hasLineOfSight, angleDiff, moveWithCollision } from "./physics.js";
import { followTarget, findCoverPoint, randomOpenPoint } from "./pathfinding.js";

// `tuning` lets a level dial guards up/down (see content/levels) without touching this logic.
export function mkEnemy(x, y, tuning = {}) {
  return {
    x, y, w: 26, h: 26,
    hp: tuning.hp ?? 30, maxHp: tuning.hp ?? 30,
    speed: tuning.speed ?? 90, chaseSpeed: tuning.chaseSpeed ?? 200,
    visionRange: tuning.visionRange ?? 340, fovHalfAngle: tuning.fovHalfAngle ?? Math.PI * 0.5,
    fireCooldownTime: tuning.fireCooldownTime ?? 0.45,
    bulletSpeed: tuning.bulletSpeed ?? 460,
    damage: tuning.damage ?? 14,
    shootCooldown: 0,
    facing: Math.PI / 2, alert: false,
    chasing: false, memory: 0, memoryDuration: 4.5, lastSeenX: x, lastSeenY: y,
    investigating: false, investigateX: x, investigateY: y, investigateMemory: 0, investigateDuration: 5,
    seekingCover: false, coverX: x, coverY: y, coverTimer: 0, coverCooldown: 0,
    dodgeTimer: 0, dodgeCooldown: 0, dodgeVX: 0, dodgeVY: 0,
    wanderTarget: null, path: [], pathTarget: null, pathRecalc: 0,
  };
}

export function enemyStateColor(e) {
  if (e.alert) return [1.4, 0.35, 0.25];
  if (e.chasing) return [1.4, 0.85, 0.25];
  if (e.investigating) return [0.55, 0.75, 1.4];
  return [1.1, 0.95, 0.5];
}

// Mutates `enemies` and pushes into `bullets`/`events`. `events` collects narrative trigger
// names (e.g. "spotted", "dodged", "heard") the first time each happens, for diegetic call-outs.
export function updateEnemies(dt, { enemies, player, walls, grid, bullets, noiseEvents, events }) {
  const pcx0 = player.x + player.w / 2, pcy0 = player.y + player.h / 2;

  // Squad alert (the Chorus): if any guard currently sees the player, every guard is radioed
  // the position — no distance/wall/hearing limit.
  const anyVisible = enemies.some(e => {
    const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2;
    const d = Math.hypot(pcx0 - ecx, pcy0 - ecy);
    const ang = Math.atan2(pcy0 - ecy, pcx0 - ecx);
    return d < e.visionRange && angleDiff(e.facing, ang) < e.fovHalfAngle && hasLineOfSight(ecx, ecy, pcx0, pcy0, walls);
  });

  for (const e of enemies) {
    const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2;
    const pcx = player.x + player.w / 2, pcy = player.y + player.h / 2;
    const distToPlayer = Math.hypot(pcx - ecx, pcy - ecy);
    const angleToPlayer = Math.atan2(pcy - ecy, pcx - ecx);
    const visible = distToPlayer < e.visionRange
      && angleDiff(e.facing, angleToPlayer) < e.fovHalfAngle
      && hasLineOfSight(ecx, ecy, pcx, pcy, walls);
    e.alert = visible;
    if (visible && events) events.push("spotted");

    e.coverCooldown = Math.max(0, e.coverCooldown - dt);
    e.dodgeCooldown = Math.max(0, e.dodgeCooldown - dt);
    e.dodgeTimer = Math.max(0, e.dodgeTimer - dt);

    if (visible) {
      e.lastSeenX = pcx; e.lastSeenY = pcy;
      e.memory = e.memoryDuration;
      e.chasing = true;
      e.investigating = false;
      e.facing = angleToPlayer;
    } else if (anyVisible) {
      e.lastSeenX = pcx; e.lastSeenY = pcy;
      e.memory = e.memoryDuration;
      e.chasing = true;
      e.investigating = false;
    } else if (e.chasing) {
      e.memory -= dt;
      if (e.memory <= 0) { e.chasing = false; e.wanderTarget = null; e.path = []; }
    }

    // hearing: a guard not already actively hunting can be drawn toward a nearby gunshot
    if (!visible && !e.chasing) {
      for (const n of noiseEvents) {
        if (Math.hypot(n.x - ecx, n.y - ecy) < n.radius) {
          e.investigating = true;
          e.investigateX = n.x; e.investigateY = n.y;
          e.investigateMemory = e.investigateDuration;
          e.facing = Math.atan2(n.y - ecy, n.x - ecx);
          if (events) events.push("heard");
          break;
        }
      }
    }

    if (visible && !e.seekingCover) {
      e.shootCooldown -= dt;
      if (e.shootCooldown <= 0) {
        bullets.push({ x: ecx, y: ecy, w: 6, h: 6, vx: Math.cos(e.facing) * e.bulletSpeed, vy: Math.sin(e.facing) * e.bulletSpeed, owner: "enemy", damage: e.damage });
        noiseEvents.push({ x: ecx, y: ecy, radius: 230 });
        e.shootCooldown = e.fireCooldownTime;
      }
    }

    // dodge: alert guards react to an incoming player bullet by sidestepping it
    if (!e.seekingCover && (visible || e.chasing || e.investigating) && e.dodgeCooldown <= 0 && e.dodgeTimer <= 0) {
      for (const b of bullets) {
        if (b.owner !== "player") continue;
        const speed2 = b.vx * b.vx + b.vy * b.vy;
        if (!speed2) continue;
        const t = ((ecx - b.x) * b.vx + (ecy - b.y) * b.vy) / speed2;
        if (t < 0 || t > 0.35) continue;
        const closeX = b.x + b.vx * t, closeY = b.y + b.vy * t;
        if (Math.hypot(ecx - closeX, ecy - closeY) < 24) {
          const perp = Math.atan2(b.vy, b.vx) + Math.PI / 2;
          const side = Math.random() < 0.5 ? 1 : -1;
          e.dodgeVX = Math.cos(perp) * side * 220;
          e.dodgeVY = Math.sin(perp) * side * 220;
          e.dodgeTimer = 0.25;
          e.dodgeCooldown = 1.0;
          if (events) events.push("dodged");
          break;
        }
      }
    }

    // movement priority: dodge > duck to cover > engage in sight > chase (pathfound) > investigate (pathfound) > wander (pathfound)
    if (e.dodgeTimer > 0) {
      moveWithCollision(e, e.dodgeVX * dt, e.dodgeVY * dt, walls);
    } else if (e.seekingCover) {
      const arrived = followTarget(e, e.coverX, e.coverY, dt, e.chaseSpeed, grid, walls);
      e.coverTimer -= dt;
      if (arrived || e.coverTimer <= 0) e.seekingCover = false;
    } else if (visible) {
      const tdist = distToPlayer;
      if (tdist > 40) moveWithCollision(e, (pcx - ecx) / tdist * e.chaseSpeed * dt, (pcy - ecy) / tdist * e.chaseSpeed * dt, walls);
    } else if (e.chasing) {
      followTarget(e, e.lastSeenX, e.lastSeenY, dt, e.chaseSpeed, grid, walls);
    } else if (e.investigating) {
      e.investigateMemory -= dt;
      const arrived = followTarget(e, e.investigateX, e.investigateY, dt, e.speed * 1.3, grid, walls);
      if (arrived || e.investigateMemory <= 0) { e.investigating = false; e.wanderTarget = null; }
    } else {
      if (!e.wanderTarget || Math.hypot(e.wanderTarget.x - ecx, e.wanderTarget.y - ecy) < 16) {
        e.wanderTarget = randomOpenPoint(grid);
      }
      if (e.wanderTarget) followTarget(e, e.wanderTarget.x, e.wanderTarget.y, dt, e.speed, grid, walls);
    }
  }
}

// Called when a player bullet lands on an enemy: reveals the shooter's direction and rolls for
// a cover-seeking reaction.
export function onEnemyHit(e, bullet, walls, player) {
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2;
  e.chasing = true;
  e.investigating = false;
  e.lastSeenX = bullet.originX;
  e.lastSeenY = bullet.originY;
  e.memory = e.memoryDuration;
  e.facing = Math.atan2(bullet.originY - ecy, bullet.originX - ecx);
  if (!e.seekingCover && e.coverCooldown <= 0 && Math.random() < 0.6) {
    const cp = findCoverPoint(e, player, walls);
    if (cp) { e.seekingCover = true; e.coverX = cp.x; e.coverY = cp.y; e.coverTimer = 1.6; e.coverCooldown = 4; }
  }
}
