// WebGL bootstrap: shader compile/link, the single textured-triangle attribute layout every
// draw call in this game uses, and procedural (canvas-drawn) texture creation.

const VERTEX_SRC = `
  attribute vec2 a_position;
  attribute vec2 a_texcoord;
  attribute vec4 a_color;
  uniform vec2 u_resolution;
  varying vec2 v_texcoord;
  varying vec4 v_color;
  void main() {
    vec2 zeroToOne = a_position / u_resolution;
    vec2 clipSpace = zeroToOne * 2.0 - 1.0;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    v_texcoord = a_texcoord;
    v_color = a_color;
  }
`;

const FRAGMENT_SRC = `
  precision mediump float;
  varying vec2 v_texcoord;
  varying vec4 v_color;
  uniform sampler2D u_tex;
  void main() {
    vec4 tex = texture2D(u_tex, v_texcoord);
    float a = tex.a * v_color.a;
    if (a < 0.03) discard;
    gl_FragColor = vec4(tex.rgb * v_color.rgb, a);
  }
`;

function compile(gl, type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(info);
  }
  return shader;
}

export const STRIDE = 8 * 4; // x,y,u,v,r,g,b,a — 8 floats per vertex

export function createGLContext(canvas) {
  const gl = canvas.getContext("webgl");
  if (!gl) throw new Error("WebGL not supported");

  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX_SRC));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
  }
  gl.useProgram(program);

  const posLoc = gl.getAttribLocation(program, "a_position");
  const texLoc = gl.getAttribLocation(program, "a_texcoord");
  const colorLoc = gl.getAttribLocation(program, "a_color");
  const resLoc = gl.getUniformLocation(program, "u_resolution");

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(posLoc);
  gl.enableVertexAttribArray(texLoc);
  gl.enableVertexAttribArray(colorLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, STRIDE, 0);
  gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, STRIDE, 8);
  gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, STRIDE, 16);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0.05, 0.06, 0.08, 1);

  return { gl, program, buffer, resLoc };
}

export function resizeGL(ctx, canvas, width, height) {
  canvas.width = width;
  canvas.height = height;
  ctx.gl.viewport(0, 0, width, height);
}

// Draws with a small offscreen 2D canvas, sized `size`, then uploads it as a NEAREST-filtered
// texture — the low base resolution plus no smoothing is what gives the pixel-art look.
export function makeTexture(ctx, draw, size, repeat) {
  const { gl } = ctx;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const c2d = c.getContext("2d");
  c2d.imageSmoothingEnabled = false;
  draw(c2d, size);
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  const wrap = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
  return tex;
}
