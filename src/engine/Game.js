import { createGLContext, resizeGL } from "./gl.js";
import { createTextures } from "./sprites.js";
import { createRenderer } from "./renderer.js";
import { createInput } from "./input.js";
import { aabb, hitsWall, moveWithCollision } from "./physics.js";
import { buildGrid } from "./pathfinding.js";
import { mkEnemy, enemyStateColor, updateEnemies, onEnemyHit } from "./ai.js";

const DEFAULT_OBJECTIVE = {
  withEnemies: "Objective: eliminate all guards to unlock the exit",
  cleared: "Objective: reach the green exit zone!",
};

// Owns one level's entire runtime: WebGL context, textures, input, and the update/draw loop.
// React only ever talks to this through the constructor options and start()/stop() — everything
// else (player, enemies, bullets...) is private mutable state, same as the original prototype,
// just no longer sitting in module-level globals.
export class Game {
  constructor(canvas, levelDef, callbacks = {}) {
    this.canvas = canvas;
    this.levelDef = levelDef;
    this.callbacks = callbacks;
    this.ctx = createGLContext(canvas);
    this.textures = createTextures(this.ctx);
    this.renderer = createRenderer(this.ctx);
    this.input = createInput(canvas);
    this.firedEvents = new Set();
    this._raf = null;
    this._lastTime = 0;

    this._onResize = () => this._resize();
    window.addEventListener("resize", this._onResize);
    this._resize();
    this._buildLevel();
  }

  _resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.width = w;
    this.height = h;
    resizeGL(this.ctx, this.canvas, w, h);
  }

  _buildLevel() {
    const { levelDef } = this;
    const w = this.width, h = this.height;

    this.walls = levelDef.walls(w, h);
    this.grid = buildGrid(this.walls, w, h);

    const start = levelDef.playerStart(w, h);
    this.player = { x: start.x, y: start.y, w: 26, h: 26, speed: 260, hp: 100, maxHp: 100, hitFlash: 0 };

    this.enemies = (levelDef.enemies || []).map(spec =>
      mkEnemy(spec.xf * w, spec.yf * h, { ...levelDef.defaultEnemyTuning, ...spec.tuning })
    );

    this.bullets = [];
    this.noiseEvents = [];
    this.exitZone = levelDef.exitZone(w, h);
    this.fireTimer = 0;
    this.gameOver = false;
    this.win = false;
    this.noCombat = !!levelDef.noCombat;
  }

  restart() {
    this._buildLevel();
    this._emitHud();
  }

  start() {
    this._lastTime = performance.now();
    const loop = now => {
      const dt = Math.min(0.05, (now - this._lastTime) / 1000);
      this._lastTime = now;
      if (!this.gameOver) this._update(dt);
      this._draw();
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }

  stop() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this.input.destroy();
    window.removeEventListener("resize", this._onResize);
  }

  _fireOnce(name) {
    if (this.firedEvents.has(name)) return;
    this.firedEvents.add(name);
    this.callbacks.onEvent && this.callbacks.onEvent(name);
  }

  _update(dt) {
    const { player, walls, enemies, bullets } = this;
    this.noiseEvents = [];
    player.hitFlash = Math.max(0, player.hitFlash - dt);

    let dx = 0, dy = 0;
    const { keys, mouse } = this.input;
    if (keys["arrowleft"] || keys["a"]) dx -= 1;
    if (keys["arrowright"] || keys["d"]) dx += 1;
    if (keys["arrowup"] || keys["w"]) dy -= 1;
    if (keys["arrowdown"] || keys["s"]) dy += 1;
    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      moveWithCollision(player, (dx / len) * player.speed * dt, (dy / len) * player.speed * dt, walls);
    }
    player.x = Math.max(0, Math.min(this.width - player.w, player.x));
    player.y = Math.max(0, Math.min(this.height - player.h, player.y));

    if (!this.noCombat) {
      this.fireTimer -= dt;
      if (mouse.down && this.fireTimer <= 0) {
        const cx = player.x + player.w / 2, cy = player.y + player.h / 2;
        const ang = Math.atan2(mouse.y - cy, mouse.x - cx);
        bullets.push({ x: cx, y: cy, w: 6, h: 6, vx: Math.cos(ang) * 620, vy: Math.sin(ang) * 620, owner: "player", originX: cx, originY: cy });
        this.noiseEvents.push({ x: cx, y: cy, radius: 380 });
        this.fireTimer = 0.15;
      }

      const events = [];
      updateEnemies(dt, { enemies, player, walls, grid: this.grid, bullets, noiseEvents: this.noiseEvents, events });
      for (const name of events) this._fireOnce(name);

      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (hitsWall(b, walls) || b.x < -20 || b.y < -20 || b.x > this.width + 20 || b.y > this.height + 20) {
          bullets.splice(i, 1);
          continue;
        }
        if (b.owner === "player") {
          for (const e of enemies) {
            if (aabb(b, e)) {
              e.hp -= 15;
              bullets.splice(i, 1);
              onEnemyHit(e, b, walls, player);
              break;
            }
          }
        } else if (aabb(b, player)) {
          player.hp -= b.damage || 14;
          player.hitFlash = 0.15;
          bullets.splice(i, 1);
        }
      }
      this.enemies = enemies.filter(e => e.hp > 0);

      if (player.hp <= 0 && !this.gameOver) {
        this.gameOver = true;
        this.callbacks.onLose && this.callbacks.onLose();
      }
      const canExit = this.levelDef.winWithoutClearing || this.enemies.length === 0;
      if (canExit && aabb(player, this.exitZone) && !this.win && !this.gameOver) {
        this.win = true;
        this.gameOver = true;
        this.callbacks.onWin && this.callbacks.onWin();
      }
    } else if (aabb(player, this.exitZone) && !this.gameOver) {
      // no-combat vignette: reaching the marked spot simply advances the story
      this.gameOver = true;
      this.win = true;
      this.callbacks.onWin && this.callbacks.onWin();
    }

    this._emitHud();
  }

  _emitHud() {
    if (!this.callbacks.onHud) return;
    this.callbacks.onHud({
      enemyCount: this.enemies.length,
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      objective: this.noCombat
        ? ""
        : this.levelDef.winWithoutClearing
          ? (this.levelDef.objective || DEFAULT_OBJECTIVE).withEnemies
          : this.enemies.length > 0
            ? (this.levelDef.objective || DEFAULT_OBJECTIVE).withEnemies
            : (this.levelDef.objective || DEFAULT_OBJECTIVE).cleared,
    });
  }

  _draw() {
    const { renderer, textures, walls, enemies, player, bullets, exitZone } = this;
    const w = this.width, h = this.height;
    renderer.clear();

    renderer.rectTex(0, 0, w, h, 1, 1, 1, w / 32, h / 32);
    renderer.flush(textures.floorTex, w, h);

    for (const wall of walls) renderer.rectTex(wall.x, wall.y, wall.w, wall.h, 1, 1, 1, wall.w / 32, wall.h / 32);
    renderer.flush(textures.wallTex, w, h);

    const exitOpen = this.noCombat || enemies.length === 0;
    renderer.rectTex(exitZone.x, exitZone.y, exitZone.w, exitZone.h, exitOpen ? 1 : 0.55, exitOpen ? 1 : 0.55, exitOpen ? 1 : 0.55);
    renderer.flush(textures.exitTex, w, h);

    for (const e of enemies) {
      if (e.seekingCover) continue;
      const [r, g, b] = enemyStateColor(e);
      renderer.visionCone(e.x + e.w / 2, e.y + e.h / 2, e.facing, e.fovHalfAngle, e.visionRange, walls, r, g, b, 0.22);
    }
    renderer.flush(textures.whiteTex, w, h);

    for (const e of enemies) {
      const [er, eg, eb] = enemyStateColor(e);
      const dim = e.seekingCover ? 0.7 : 1;
      renderer.rotatedRectTex(e.x + e.w / 2, e.y + e.h / 2, e.w, e.h, e.facing + Math.PI / 2, er * dim, eg * dim, eb * dim);
    }
    renderer.flush(textures.enemyTex, w, h);

    for (const e of enemies) {
      const barW = e.w, barH = 5, bx = e.x, by = e.y - 10;
      const pct = Math.max(0, e.hp / e.maxHp);
      renderer.rectTex(bx, by, barW, barH, 0.15, 0.05, 0.05);
      renderer.rectTex(bx, by, barW * pct, barH, 1.0, 0.15, 0.15);
    }
    renderer.flush(textures.whiteTex, w, h);

    const pcx = player.x + player.w / 2, pcy = player.y + player.h / 2;
    const aimAngle = Math.atan2(this.input.mouse.y - pcy, this.input.mouse.x - pcx);
    const flashed = player.hitFlash > 0;
    renderer.rotatedRectTex(pcx, pcy, player.w, player.h, aimAngle + Math.PI / 2, flashed ? 1.8 : 1, flashed ? 0.3 : 1, flashed ? 0.3 : 1);
    renderer.flush(textures.playerTex, w, h);

    for (const b of bullets) {
      renderer.rectTex(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 1.0, b.owner === "player" ? 0.9 : 0.3, 0.2);
    }
    renderer.flush(textures.whiteTex, w, h);
  }
}
