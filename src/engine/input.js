// Keyboard + mouse state, scoped to one canvas so multiple Game instances (e.g. across
// React remounts between acts) never leak listeners into each other.

export function createInput(canvas) {
  const keys = {};
  const mouse = { x: 0, y: 0, down: false };

  const onKeyDown = e => { keys[e.key.toLowerCase()] = true; };
  const onKeyUp = e => { keys[e.key.toLowerCase()] = false; };
  const onMouseMove = e => { mouse.x = e.clientX; mouse.y = e.clientY; };
  const onMouseDown = () => { mouse.down = true; };
  const onMouseUp = () => { mouse.down = false; };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mouseup", onMouseUp);

  function destroy() {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    canvas.removeEventListener("mousemove", onMouseMove);
    canvas.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("mouseup", onMouseUp);
  }

  return { keys, mouse, destroy };
}
