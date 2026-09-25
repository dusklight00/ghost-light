// Shared shape every act's level file exports. Kept as a thin identity function so editors
// get a docstring to hover, without adding a runtime validation dependency for a solo project.

/**
 * @typedef {Object} LevelDef
 * @property {(w:number,h:number)=>Array<{x:number,y:number,w:number,h:number}>} walls
 *   Wall rectangles in pixels, given the current canvas width/height (so layouts scale with the window).
 * @property {(w:number,h:number)=>{x:number,y:number,w:number,h:number}} exitZone
 * @property {(w:number,h:number)=>{x:number,y:number}} playerStart
 * @property {Array<{xf:number, yf:number, tuning?:object}>} [enemies]
 *   xf/yf are 0..1 fractions of the canvas size; tuning overrides mkEnemy's defaults per-guard.
 * @property {object} [defaultEnemyTuning] Applied to every enemy unless it has its own `tuning`.
 * @property {{withEnemies:string, cleared:string}} [objective] HUD objective text.
 * @property {boolean} [noCombat] True for a scripted vignette level with no enemies/combat.
 * @property {boolean} [winWithoutClearing] True if reaching the exit wins even with guards still alive (a "flee" level).
 */
export function defineLevel(def) {
  return def;
}
