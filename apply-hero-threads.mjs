#!/usr/bin/env node
/**
 * apply-hero-threads.mjs
 *
 * Gives the Hero an animated "Threads" background (React Bits, WebGL) and swaps
 * the hero copy for a single large headline.
 *
 * What it does
 *   - app/Threads.jsx + app/Threads.css   NEW. The React Bits Threads component.
 *   - app/page.js (Hero only)
 *       * imports Threads
 *       * adds the background layer behind the hero content (one marked block)
 *       * headline becomes "Building Systems / That Make Ideas / Work."
 *         (same font-display / extrabold / tight tracking, just larger)
 *       * removes the subtitle paragraph and the two buttons
 *   - No new npm packages. The component is plain WebGL2.
 *
 * Options
 *   --config=1|2     1 = 81 lines, flat angle, full opacity.
 *                    2 = 94 lines, angle 11, opacity 0.65 (default).
 *   --bg=hero|site|keep
 *       hero  (default) hero is pure white, with a soft fade into your cream
 *                       background at its bottom edge.
 *       site            the whole site background becomes white
 *                       (--bg-primary and LIGHT.bg).
 *       keep            keep your cream background; threads sit on top of it.
 *   --keep-subtitle  keep the paragraph under the headline.
 *   --keep-buttons   keep "See projects" / "Get in touch".
 *   --desktop-only   do not render the threads on phones (saves battery/GPU).
 *   --dry-run        preview only, writes nothing.
 *   --revert         undo everything (restores backups, deletes Threads files).
 *
 * Usage (from the project root, next to package.json):
 *   node apply-hero-threads.mjs
 *   node apply-hero-threads.mjs --config=1 --desktop-only
 *   node apply-hero-threads.mjs --revert
 *
 * Safe to re-run: the background block is refreshed in place, so you can change
 * --config, --desktop-only and the keep flags by re-running. To change --bg
 * after applying, run --revert first, then apply again.
 *
 * Backups (made once, before the first change):
 *   app/page.js.bak-hero-threads, app/globals.css.bak-hero-threads
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync, unlinkSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(__dirname, "app");
const F = {
  page: path.join(APP, "page.js"),
  css: path.join(APP, "globals.css"),
  jsx: path.join(APP, "Threads.jsx"),
  tcss: path.join(APP, "Threads.css"),
};
const BAK = ".bak-hero-threads";

/* ── options ─────────────────────────────────────────────────────────── */
const args = process.argv.slice(2);
const has = (n) => args.includes(n);
const val = (n, d) => { const a = args.find((x) => x.startsWith(n + "=")); return a ? a.split("=")[1] : d; };
const DRY = has("--dry-run");
const REVERT = has("--revert");
const KEEP_SUB = has("--keep-subtitle");
const KEEP_BTNS = has("--keep-buttons");
const DESKTOP_ONLY = has("--desktop-only");
const CONFIG = Number(val("--config", "2"));
const BG = val("--bg", "hero");

const CONFIGS = {
  1: { lineCount: 81, amplitude: 1.3, distance: 0.35, speed: 0.5, fray: 0.35, angle: 2, opacity: 1, seed: 6 },
  2: { lineCount: 94, amplitude: 0.9, distance: 0.45, speed: 0.4, fray: 0.3, angle: 11, opacity: 0.65, seed: 7 },
};

const THREADS_JSX = `'use client';

import { useEffect, useRef } from 'react';

import './Threads.css';

const LINE_VERTEX = \`#version 300 es
precision highp float;
in vec2 aPoint;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uFrame;
uniform float uAmplitude;
uniform float uDistance;
uniform vec2 uMouse;
uniform float uCount;
uniform float uThickness;
uniform float uSoftness;
uniform float uWaves;
uniform float uSplit;
uniform float uFray;
uniform float uSeed;
uniform vec2 uTurn;
uniform vec4 uPart;
uniform float uTaper;
out float vEdge;
out float vBand;
out float vDraw;
out float vAlpha;
out float vIndex;

float Perlin2D(vec2 P) {
  vec2 Pi = floor(P);
  vec4 Pf_Pfmin1 = P.xyxy - vec4(Pi, Pi + 1.0);
  vec4 Pt = vec4(Pi.xy, Pi.xy + 1.0);
  Pt = Pt - floor(Pt * (1.0 / 71.0)) * 71.0;
  Pt += vec2(26.0, 161.0).xyxy;
  Pt *= Pt;
  Pt = Pt.xzxz * Pt.yyww;
  vec4 hash_x = fract(Pt * (1.0 / 951.135664));
  vec4 hash_y = fract(Pt * (1.0 / 642.949883));
  vec4 grad_x = hash_x - 0.49999;
  vec4 grad_y = hash_y - 0.49999;
  vec4 grad_results = inversesqrt(grad_x * grad_x + grad_y * grad_y) * (grad_x * Pf_Pfmin1.xzxz + grad_y * Pf_Pfmin1.yyww);
  grad_results *= 1.4142135623730950;
  vec2 blend = Pf_Pfmin1.xy * Pf_Pfmin1.xy * Pf_Pfmin1.xy * (Pf_Pfmin1.xy * (Pf_Pfmin1.xy * 6.0 - 15.0) + 10.0);
  vec4 blend2 = vec4(blend, vec2(1.0 - blend));
  return dot(grad_results, blend2.zxzx * blend2.wwyy);
}

void main() {
  float perc = float(gl_InstanceID) / uCount;
  float x = aPoint.x;
  float pixel = 1.0 / max(uResolution.x, uResolution.y);
  float splitPoint = uSplit + perc * uFray;
  float amplitudeNormal = smoothstep(splitPoint, max(0.7, splitPoint + 0.2), x);
  float finalAmplitude = amplitudeNormal * 0.5 * uAmplitude * (1.0 + (uMouse.y - 0.5) * 0.2);
  float timeScaled = uTime / 10.0 + (uMouse.x - 0.5);
  float blur = smoothstep(splitPoint, splitPoint + 0.05, x) * perc;
  float xnoise = mix(
    Perlin2D(vec2(timeScaled * 2.5 + uSeed, (x * uWaves + perc) * 2.5)),
    Perlin2D(vec2(timeScaled * 3.5 + uSeed, (x * uWaves + timeScaled) * 3.5)) / 1.5,
    x * 0.3
  );
  float y = 0.5 + (perc - 0.5) * uDistance + xnoise / 2.0 * finalAmplitude;
  vec2 local = vec2((x - 0.5) * uFrame.x, (y - 0.5) * uFrame.y);
  if (uPart.z > 0.0) {
    vec2 delta = local - uPart.xy;
    float reach = uPart.w;
    float pull = exp(-dot(delta, delta) / (reach * reach));
    local.y += delta.y * pull * uPart.z;
  }
  float width = 7.0 * uThickness * pixel * (1.0 - perc);
  float band = (width / 2.0 + 10.0 * uSoftness * pixel * blur) * uFrame.y;
  float draw = max(band, 1.0);
  local.y += aPoint.y * draw;
  vec2 turned = vec2(local.x * uTurn.x - local.y * uTurn.y, local.x * uTurn.y + local.y * uTurn.x);
  gl_Position = vec4(turned / (uResolution * 0.5), 0.0, 1.0);
  vEdge = aPoint.y * draw;
  vBand = band;
  vDraw = draw;
  vAlpha = 1.0 - smoothstep(0.0, 1.0, pow(perc, 0.3)) * uTaper;
  vIndex = perc;
}\`;

const LINE_FRAGMENT = \`#version 300 es
precision highp float;
in float vEdge;
in float vBand;
in float vDraw;
in float vAlpha;
in float vIndex;
uniform vec3 uColor;
uniform vec3 uAccent;
out vec4 outColor;
void main() {
  float coverage = (1.0 - smoothstep(0.0, vDraw, abs(vEdge))) * (vBand / vDraw) * vAlpha;
  outColor = vec4(mix(uColor, uAccent, vIndex) * coverage, coverage);
}\`;

const SCREEN_VERTEX = \`#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}\`;

const SCREEN_FRAGMENT = \`#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uLines;
uniform vec2 uResolution;
uniform float uFade;
uniform float uOpacity;
uniform float uCurve;
out vec4 outColor;

float smootherstep(float edge, float x) {
  float t = clamp(x / edge, 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

void main() {
  vec4 lines = texture(uLines, vUv);
  float alpha = lines.a;
  vec3 color = alpha > 0.0001 ? lines.rgb / alpha : vec3(0.0);
  float mask = uOpacity;
  if (uFade > 0.0) {
    vec2 px = vUv * uResolution;
    float edge = uFade * min(uResolution.x, uResolution.y) * 0.5;
    mask *= smootherstep(edge, px.x) * smootherstep(edge, uResolution.x - px.x);
    mask *= smootherstep(edge, px.y) * smootherstep(edge, uResolution.y - px.y);
  }
  outColor = vec4(color * pow(alpha, uCurve), alpha) * mask;
}\`;

const MAX_RENDER_DIM = 1920;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const compile = (gl, type, source) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
};

const link = (gl, vertexSource, fragmentSource) => {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  gl.deleteProgram(program);
  return null;
};

const locate = (gl, program, names) => {
  const result = {};
  for (const name of names) result[name] = gl.getUniformLocation(program, name);
  return result;
};

const Threads = ({
  color = [1, 1, 1],
  accentColor,
  amplitude = 1.7,
  distance = 0.4,
  enableMouseInteraction = false,
  lineCount = 90,
  thickness = 0.6,
  softness = 1.3,
  speed = 0.6,
  waves = 1.05,
  split = 0.04,
  fray = 0.5,
  angle = 25,
  seed = 0,
  parting = 0,
  taper = 0.85,
  brightness = 1.4,
  fade = 0,
  opacity = 1,
  paused = false,
  ...rest
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const wakeRef = useRef(null);
  const colorKey = \`\${Array.isArray(color) ? color.join(',') : String(color)}|\${
    Array.isArray(accentColor) ? accentColor.join(',') : String(accentColor ?? '')
  }\`;
  const settings = {
    color,
    accentColor,
    colorKey,
    amplitude,
    distance,
    enableMouseInteraction,
    lineCount: clamp(Math.round(lineCount), 1, 400),
    thickness: Math.max(0, thickness),
    softness: Math.max(0, softness),
    speed,
    waves: Math.max(0, waves),
    split: clamp(split, 0, 1),
    fray: clamp(fray, 0, 1),
    angle,
    seed,
    parting: clamp(parting, 0, 1),
    taper: clamp(taper, 0, 1),
    brightness: clamp(brightness, 0.25, 2),
    fade: clamp(fade, 0, 1),
    opacity: clamp(opacity, 0, 1),
    paused
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false
    });
    if (!container || !canvas || !gl) return undefined;

    const lineProgram = link(gl, LINE_VERTEX, LINE_FRAGMENT);
    const screenProgram = link(gl, SCREEN_VERTEX, SCREEN_FRAGMENT);
    if (!lineProgram || !screenProgram) return undefined;

    const lineUniforms = locate(gl, lineProgram, [
      'uTime',
      'uResolution',
      'uFrame',
      'uAmplitude',
      'uDistance',
      'uMouse',
      'uCount',
      'uThickness',
      'uSoftness',
      'uWaves',
      'uSplit',
      'uFray',
      'uSeed',
      'uTurn',
      'uPart',
      'uTaper',
      'uColor',
      'uAccent'
    ]);
    const screenUniforms = locate(gl, screenProgram, ['uLines', 'uResolution', 'uFade', 'uOpacity', 'uCurve']);

    const lineVao = gl.createVertexArray();
    const lineBuffer = gl.createBuffer();
    gl.bindVertexArray(lineVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    const pointLocation = gl.getAttribLocation(lineProgram, 'aPoint');
    gl.enableVertexAttribArray(pointLocation);
    gl.vertexAttribPointer(pointLocation, 2, gl.FLOAT, false, 0, 0);

    const screenVao = gl.createVertexArray();
    const screenBuffer = gl.createBuffer();
    gl.bindVertexArray(screenVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, screenBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const positionLocation = gl.getAttribLocation(screenProgram, 'aPosition');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    const target = gl.createTexture();
    const framebuffer = gl.createFramebuffer();
    gl.bindTexture(gl.TEXTURE_2D, target);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const probe = document.createElement('canvas');
    probe.width = 1;
    probe.height = 1;
    const probeContext = probe.getContext('2d', { willReadFrequently: true });
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const state = {
      time: 0,
      width: 1,
      height: 1,
      segments: 0,
      colorKey: '',
      color: [1, 1, 1],
      accent: [1, 1, 1],
      mouse: [0.5, 0.5],
      targetMouse: [0.5, 0.5],
      pointer: [0, 0],
      targetPointer: [0, 0],
      presence: 0,
      inside: false
    };
    let raf = 0;
    let last = 0;
    let visible = true;
    let alive = true;

    const toRgb = value => {
      if (Array.isArray(value)) return [0, 1, 2].map(i => clamp(Number(value[i] ?? 1), 0, 1));
      if (!probeContext) return [1, 1, 1];
      probeContext.clearRect(0, 0, 1, 1);
      probeContext.fillStyle = '#ffffff';
      probeContext.fillStyle = String(value);
      probeContext.fillRect(0, 0, 1, 1);
      const [r, g, b] = probeContext.getImageData(0, 0, 1, 1).data;
      return [r / 255, g / 255, b / 255];
    };

    const resolveColors = s => {
      if (s.colorKey === state.colorKey) return;
      state.colorKey = s.colorKey;
      state.color = toRgb(s.color);
      state.accent = s.accentColor === undefined || s.accentColor === null ? state.color : toRgb(s.accentColor);
    };

    const buildStrip = segments => {
      if (segments === state.segments) return;
      state.segments = segments;
      const points = new Float32Array((segments + 1) * 4);
      for (let i = 0; i <= segments; i++) {
        const u = i / segments;
        points.set([u, -1, u, 1], i * 4);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
    };

    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      const baseDpr = Math.min(window.devicePixelRatio || 1, 2);
      const longest = Math.max(width, height) * baseDpr;
      const dpr = longest > MAX_RENDER_DIM ? (baseDpr * MAX_RENDER_DIM) / longest : baseDpr;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      state.width = width;
      state.height = height;
      gl.bindTexture(gl.TEXTURE_2D, target);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      buildStrip(clamp(Math.round(width / 3), 96, 640));
      render();
    };

    const render = () => {
      const s = settingsRef.current;
      resolveColors(s);
      const w = canvas.width;
      const h = canvas.height;
      const radians = (s.angle * Math.PI) / 180;
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);
      const length = Math.abs(w * cos) + Math.abs(h * sin);
      const across = Math.abs(w * sin) + Math.abs(h * cos);
      const scale = w / state.width;
      const mouse = s.enableMouseInteraction ? state.mouse : [0.5, 0.5];
      const strength = s.parting * state.presence * 2;
      const px = state.pointer[0] * scale;
      const py = state.pointer[1] * scale;
      const local = [px * cos + py * sin, -px * sin + py * cos];

      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(lineProgram);
      gl.uniform1f(lineUniforms.uTime, state.time);
      gl.uniform2f(lineUniforms.uResolution, w, h);
      gl.uniform2f(lineUniforms.uFrame, length, across);
      gl.uniform1f(lineUniforms.uAmplitude, s.amplitude);
      gl.uniform1f(lineUniforms.uDistance, s.distance);
      gl.uniform2f(lineUniforms.uMouse, mouse[0], mouse[1]);
      gl.uniform1f(lineUniforms.uCount, s.lineCount);
      gl.uniform1f(lineUniforms.uThickness, s.thickness);
      gl.uniform1f(lineUniforms.uSoftness, s.softness);
      gl.uniform1f(lineUniforms.uWaves, s.waves);
      gl.uniform1f(lineUniforms.uSplit, s.split);
      gl.uniform1f(lineUniforms.uFray, s.fray);
      gl.uniform1f(lineUniforms.uSeed, s.seed * 13.37);
      gl.uniform2f(lineUniforms.uTurn, cos, sin);
      gl.uniform4f(lineUniforms.uPart, local[0], local[1], strength, Math.min(w, h) * 0.16);
      gl.uniform1f(lineUniforms.uTaper, s.taper);
      gl.uniform3f(lineUniforms.uColor, state.color[0], state.color[1], state.color[2]);
      gl.uniform3f(lineUniforms.uAccent, state.accent[0], state.accent[1], state.accent[2]);
      gl.bindVertexArray(lineVao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, (state.segments + 1) * 2, s.lineCount);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, w, h);
      gl.disable(gl.BLEND);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(screenProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, target);
      gl.uniform1i(screenUniforms.uLines, 0);
      gl.uniform2f(screenUniforms.uResolution, w, h);
      gl.uniform1f(screenUniforms.uFade, s.fade);
      gl.uniform1f(screenUniforms.uOpacity, s.opacity);
      gl.uniform1f(screenUniforms.uCurve, 2 / s.brightness);
      gl.bindVertexArray(screenVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
    };

    const frame = now => {
      raf = 0;
      if (!alive || !visible || document.hidden) return;
      const s = settingsRef.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const moving = !s.paused && !reduce;
      if (moving) state.time += dt * s.speed;
      const follow = 1 - Math.exp(-dt * 3);
      state.mouse[0] += (state.targetMouse[0] - state.mouse[0]) * follow;
      state.mouse[1] += (state.targetMouse[1] - state.mouse[1]) * follow;
      const glide = 1 - Math.exp(-dt * 10);
      state.pointer[0] += (state.targetPointer[0] - state.pointer[0]) * glide;
      state.pointer[1] += (state.targetPointer[1] - state.pointer[1]) * glide;
      state.presence += ((state.inside && s.parting > 0 ? 1 : 0) - state.presence) * (1 - Math.exp(-dt * 4));
      render();
      const settling =
        Math.abs(state.targetMouse[0] - state.mouse[0]) > 0.0005 ||
        Math.abs(state.targetMouse[1] - state.mouse[1]) > 0.0005 ||
        Math.abs(state.targetPointer[0] - state.pointer[0]) > 0.05 ||
        Math.abs(state.targetPointer[1] - state.pointer[1]) > 0.05 ||
        Math.abs((state.inside && s.parting > 0 ? 1 : 0) - state.presence) > 0.002;
      if (moving || settling) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    const wake = () => {
      if (!raf && alive && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const onPointerMove = event => {
      const rect = container.getBoundingClientRect();
      const x = (event.clientX - rect.left) / Math.max(1, rect.width);
      const y = (event.clientY - rect.top) / Math.max(1, rect.height);
      const inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
      if (inside) {
        state.targetMouse = [x, 1 - y];
        state.targetPointer = [
          event.clientX - rect.left - rect.width / 2,
          rect.height / 2 - (event.clientY - rect.top)
        ];
        if (!state.inside && state.presence < 0.01) state.pointer = [...state.targetPointer];
      } else if (state.inside) {
        state.targetMouse = [0.5, 0.5];
      }
      state.inside = inside;
      wake();
    };

    const onPointerLeave = () => {
      state.inside = false;
      state.targetMouse = [0.5, 0.5];
      wake();
    };

    const onVisibility = () => {
      last = 0;
      wake();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const intersection = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) {
        last = 0;
        wake();
      }
    });
    intersection.observe(container);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);
    resize();

    wakeRef.current = () => {
      if (!raf) render();
      wake();
    };

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteFramebuffer(framebuffer);
      gl.deleteTexture(target);
      gl.deleteBuffer(lineBuffer);
      gl.deleteBuffer(screenBuffer);
      gl.deleteVertexArray(lineVao);
      gl.deleteVertexArray(screenVao);
      gl.deleteProgram(lineProgram);
      gl.deleteProgram(screenProgram);
    };
  }, []);

  useEffect(() => {
    wakeRef.current?.();
  });

  const { className = '', ...attributes } = rest;

  return (
    <div ref={containerRef} className={\`threads-container\${className ? \` \${className}\` : ''}\`} {...attributes}>
      <canvas ref={canvasRef} className="threads-canvas" aria-hidden="true" />
    </div>
  );
};

export default Threads;
`;
const THREADS_CSS = `.threads-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.threads-canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}
`;

/* ── helpers ─────────────────────────────────────────────────────────── */
function fail(m) { console.error("✖ " + m); process.exit(1); }
const note = (m) => console.log(m);
const eolOf = (s) => (s.includes("\r\n") ? "\r\n" : "\n");
const withEol = (s, eol) => s.replace(/\r?\n/g, eol);
function backupOnce(file) {
  const bak = file + BAK;
  if (!existsSync(bak)) {
    if (!DRY) copyFileSync(file, bak);
    note("  backup   " + path.relative(__dirname, bak));
  }
}
const write = (f, t) => { if (!DRY) writeFileSync(f, t); };

if (![1, 2].includes(CONFIG)) fail("--config must be 1 or 2.");
if (!["hero", "site", "keep"].includes(BG)) fail("--bg must be hero, site or keep.");
if (!existsSync(F.page) || !existsSync(F.css)) fail("Run this from the project root (app/page.js and app/globals.css must exist).");

/* ── revert ──────────────────────────────────────────────────────────── */
if (REVERT) {
  note("Reverting hero threads" + (DRY ? " (dry run)" : "") + "...");
  for (const k of ["page", "css"]) {
    const bak = F[k] + BAK;
    if (existsSync(bak)) {
      if (!DRY) { copyFileSync(bak, F[k]); unlinkSync(bak); }
      note("  restored " + path.relative(__dirname, F[k]));
    } else note("  skipped  " + path.relative(__dirname, F[k]) + " (no backup)");
  }
  for (const k of ["jsx", "tcss"]) {
    if (existsSync(F[k])) { if (!DRY) unlinkSync(F[k]); note("  removed  " + path.relative(__dirname, F[k])); }
  }
  note("Done.");
  process.exit(0);
}

note(`Applying hero threads (config ${CONFIG}, bg=${BG}${DESKTOP_ONLY ? ", desktop-only" : ""})${DRY ? " (dry run)" : ""}...`);

/* 1) component files */
for (const [file, text, label] of [[F.jsx, THREADS_JSX, "app/Threads.jsx"], [F.tcss, THREADS_CSS, "app/Threads.css"]]) {
  const prev = existsSync(file) ? readFileSync(file, "utf8") : null;
  if (prev === text) note("  ok       " + label + " up to date");
  else { write(file, text); note("  " + (prev === null ? "created  " : "updated  ") + label); }
}

/* 2) page.js */
let src = readFileSync(F.page, "utf8");
const eol = eolOf(src);
let changed = false;

// 2a) import
if (!src.includes('from "./Threads"')) {
  const re = /(import GlassSurface from "\.\/GlassSurface";\r?\n)/;
  if (!re.test(src)) fail('Could not find `import GlassSurface from "./GlassSurface";` in app/page.js.');
  src = src.replace(re, `$1import Threads from "./Threads";${eol}`);
  changed = true;
}

// 2b) isolate the Hero function
const heroStart = src.indexOf("function Hero(");
if (heroStart < 0) fail("Could not find function Hero( in app/page.js.");
let heroEnd = src.indexOf("/* about-brush:start */", heroStart);
if (heroEnd < 0) heroEnd = src.indexOf("\nfunction ", heroStart + 10);
if (heroEnd < 0) fail("Could not find the end of the Hero function.");
let before = src.slice(0, heroStart);
let hero = src.slice(heroStart, heroEnd);
let after = src.slice(heroEnd);
const heroOriginal = hero;

// 2c) background block
const c = { color: "#E02B20", thickness: 0.6, softness: 1, waves: 1.3, split: 0.04, taper: 0.85, brightness: 1.4, parting: 0, enableMouseInteraction: true, fade: 0, ...CONFIGS[CONFIG] };
const propLines = Object.entries(c).map(([k, v]) => {
  const pad = DESKTOP_ONLY ? "            " : "          ";
  return pad + (typeof v === "string" ? `${k}="${v}"` : `${k}={${v}}`);
}).join("\n");
const threadsEl = DESKTOP_ONLY
  ? `        {!isMobile && (\n          <Threads\n${propLines}\n          />\n        )}`
  : `        <Threads\n${propLines}\n        />`;
const wrapStyle = BG === "hero" ? ` style={{ background: "#FFFFFF" }}` : "";
const fadeEl = BG === "hero"
  ? `      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-40 z-[1] pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0), #F6F5F2)" }} />\n`
  : "";
const BLOCK_START = "{/* hero-threads:start */}";
const BLOCK_END = "{/* hero-threads:end */}";
const block = withEol(
  `      ${BLOCK_START}\n` +
  `      <div aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none"${wrapStyle}>\n` +
  `${threadsEl}\n` +
  `      </div>\n` +
  fadeEl +
  `      ${BLOCK_END}\n`, eol);

const blockRe = /[ \t]*\{\/\* hero-threads:start \*\/\}[\s\S]*?\{\/\* hero-threads:end \*\/\}\r?\n/;
if (blockRe.test(hero)) {
  hero = hero.replace(blockRe, () => block);
} else {
  const re = /(style=\{heroVars\}\s*>\r?\n)([ \t]*<div className="relative z-10 flex flex-col gap-6 md:gap-8">)/;
  if (!re.test(hero)) fail("Could not find the Hero content wrapper to attach the background to.");
  hero = hero.replace(re, (_, a, b) => a + block + b);
}

// 2d) headline copy
if (!hero.includes("Building Systems")) {
  const lines = [
    [`<span className="block" style={{ color: "var(--h-text)" }}>Websites, apps</span>`,
     `<span className="block" style={{ color: "var(--h-text)" }}>Building Systems</span>`],
    [`<span className="block" style={{ color: "var(--h-text)" }}>and connected</span>`,
     `<span className="block" style={{ color: "var(--h-text)" }}>That Make Ideas</span>`],
    [`<span className="block" style={{ color: "var(--h-text)" }}>devices<span style={{ color: "var(--h-accent)" }}>.</span></span>`,
     `<span className="block" style={{ color: "var(--h-text)" }}>Work<span style={{ color: "var(--h-accent)" }}>.</span></span>`],
  ];
  let ok = true;
  for (const [o] of lines) if (!hero.includes(o)) ok = false;
  if (!ok) note("  skipped  headline text (original lines not found, left untouched)");
  else {
    for (const [o, n] of lines) hero = hero.replace(o, n);
    const oldCls = `className="text-[clamp(2.4rem,8vw,5.5rem)] font-display font-extrabold leading-none tracking-[-0.055em]"`;
    if (hero.includes(oldCls))
      hero = hero.replace(oldCls, `className="text-[clamp(2.6rem,9.5vw,8.5rem)] font-display font-extrabold leading-none tracking-[-0.055em]"`);
  }
}

// 2e) subtitle and buttons
if (!KEEP_SUB && hero.includes("<motion.p")) {
  hero = hero.replace(/\r?\n[ \t]*<motion\.p[\s\S]*?<\/motion\.p>[ \t]*\r?\n/, eol);
}
if (!KEEP_BTNS && hero.includes("See projects")) {
  const m = hero.match(/\r?\n[ \t]*<motion\.div[\s\S]*?<\/motion\.div>[ \t]*\r?\n/);
  if (m && m[0].includes("See projects")) hero = hero.replace(m[0], eol);
}

hero = hero.replace(/(\r?\n){3,}/g, eol + eol); // tidy blank lines left by the removals
if (hero !== heroOriginal) changed = true;
src = before + hero + after;

// 2f) site-wide white
if (BG === "site") {
  const re = /(const LIGHT = \{[\s\S]*?\n\s*bg: )"#F6F5F2"/;
  if (re.test(src)) { src = src.replace(re, '$1"#FFFFFF"'); changed = true; }
  else if (!/const LIGHT = \{[\s\S]*?\n\s*bg: "#FFFFFF"/.test(src)) note("  skipped  LIGHT.bg in page.js (not found)");
}

if (changed) { backupOnce(F.page); write(F.page, src); note("  patched  app/page.js (Hero)"); }
else note("  ok       app/page.js already up to date");

/* 3) globals.css (site-wide white only) */
if (BG === "site") {
  const css = readFileSync(F.css, "utf8");
  const ce = eolOf(css);
  const S = "/* hero-threads-bg:start */", E = "/* hero-threads-bg:end */";
  if (css.includes(S)) note("  ok       app/globals.css already has the white background");
  else {
    backupOnce(F.css);
    write(F.css, css.replace(/\s*$/, "") + ce + ce + S + ce + ":root { --bg-primary: #FFFFFF; }" + ce + E + ce);
    note("  patched  app/globals.css (--bg-primary: #FFFFFF)");
  }
}

note("");
note(DRY ? "Dry run only, nothing was written." : "Done. Restart `npm run dev`. Hard-refresh the browser if the old hero still shows.");
note("Undo: node apply-hero-threads.mjs --revert");
