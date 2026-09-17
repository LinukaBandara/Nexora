"use client";

import { useEffect, useRef } from "react";
import "./AcidSquares.css";

const vertexShader = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const fragmentShader = `
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uSpeed;
uniform float uDensity;
uniform float uGlow;
uniform float uBrightness;
uniform float uOpacity;
uniform vec2 uMouse;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float roundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

  float t = uTime * uSpeed;
  vec2 mouse = (uMouse - 0.5) * vec2(aspect, 1.0);
  float mouseInfluence = exp(-dot(p - mouse, p - mouse) * 5.0) * 0.035;
  p += vec2(mouseInfluence * sin(t * 1.5), mouseInfluence * cos(t * 1.2));

  vec3 color = uColor1 * 0.42;
  float density = max(uDensity, 3.0);

  for (int yi = -5; yi <= 5; yi++) {
    for (int xi = -7; xi <= 7; xi++) {
      vec2 cell = vec2(float(xi), float(yi));
      vec2 grid = vec2(0.105, 0.13);
      vec2 center = cell * grid;
      float phase = hash21(cell + 19.7);
      float drift = sin(t * (0.55 + phase * 0.5) + phase * 6.2831) * 0.025;
      center.y += drift;
      center.x += cos(t * 0.32 + phase * 8.0) * 0.012;

      vec2 local = p - center;
      float scale = 0.72 + 0.2 * sin(t * 0.8 + phase * 6.2831);
      float size = (0.035 + 0.012 * phase) * scale * (8.0 / density);
      float d = roundedBox(local, vec2(size), 0.008);
      float edge = 1.0 - smoothstep(-0.002, 0.008, d);
      float inner = 1.0 - smoothstep(-0.015, 0.004, d);
      float pulse = 0.45 + 0.55 * sin(t * (0.9 + phase) + phase * 12.0);

      vec3 squareColor = mix(uColor2, uColor3, 0.35 + 0.65 * phase);
      squareColor = mix(uColor1, squareColor, 0.35 + 0.65 * pulse);
      color += squareColor * edge * (0.42 + 0.58 * pulse);
      color += squareColor * inner * uGlow * 0.08;
    }
  }

  float vignette = 1.0 - smoothstep(0.3, 0.95, length((uv - 0.5) * vec2(0.9, 1.1)));
  color *= 0.72 + vignette * 0.48;
  color *= uBrightness;

  float grain = hash21(gl_FragCoord.xy + uTime) - 0.5;
  color += grain * 0.018;
  gl_FragColor = vec4(clamp(color, 0.0, 1.0), uOpacity);
}`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create WebGL shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Unknown shader error";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl) {
  const vertex = createShader(gl, gl.VERTEX_SHADER, vertexShader);
  const fragment = createShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
  const program = gl.createProgram();
  if (!program) throw new Error("Unable to create WebGL program");
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || "Unknown WebGL program error";
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  const number = Number.parseInt(value, 16);
  return [((number >> 16) & 255) / 255, ((number >> 8) & 255) / 255, (number & 255) / 255];
}

export default function AcidSquares({
  color1 = "#071C14",
  color2 = "#185F3D",
  color3 = "#B9EACB",
  speed = 0.24,
  density = 8.5,
  glow = 0.82,
  brightness = 0.82,
  opacity = 0.78,
  mouseInteraction = true,
  className = "",
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: true });
    if (!gl) return;

    let program;
    try {
      program = createProgram(gl);
    } catch (error) {
      console.error("NEXORA AcidSquares shader failed:", error);
      return;
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

    const position = gl.getAttribLocation(program, "aPosition");
    const uniforms = {
      resolution: gl.getUniformLocation(program, "uResolution"),
      time: gl.getUniformLocation(program, "uTime"),
      color1: gl.getUniformLocation(program, "uColor1"),
      color2: gl.getUniformLocation(program, "uColor2"),
      color3: gl.getUniformLocation(program, "uColor3"),
      speed: gl.getUniformLocation(program, "uSpeed"),
      density: gl.getUniformLocation(program, "uDensity"),
      glow: gl.getUniformLocation(program, "uGlow"),
      brightness: gl.getUniformLocation(program, "uBrightness"),
      opacity: gl.getUniformLocation(program, "uOpacity"),
      mouse: gl.getUniformLocation(program, "uMouse"),
    };

    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    const rgb3 = hexToRgb(color3);
    const mouse = { x: 0.5, y: 0.5 };
    let animationFrame = 0;
    let start = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const onPointerMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = (event.clientX - rect.left) / Math.max(rect.width, 1);
      mouse.y = 1 - (event.clientY - rect.top) / Math.max(rect.height, 1);
    };

    const render = (now) => {
      resize();
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.time, (now - start) / 1000);
      gl.uniform3fv(uniforms.color1, rgb1);
      gl.uniform3fv(uniforms.color2, rgb2);
      gl.uniform3fv(uniforms.color3, rgb3);
      gl.uniform1f(uniforms.speed, speed);
      gl.uniform1f(uniforms.density, density);
      gl.uniform1f(uniforms.glow, glow);
      gl.uniform1f(uniforms.brightness, brightness);
      gl.uniform1f(uniforms.opacity, opacity);
      gl.uniform2f(uniforms.mouse, mouseInteraction ? mouse.x : 0.5, mouseInteraction ? mouse.y : 0.5);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrame = requestAnimationFrame(render);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    if (mouseInteraction) canvas.addEventListener("pointermove", onPointerMove);
    resize();
    animationFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      if (mouseInteraction) canvas.removeEventListener("pointermove", onPointerMove);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, [color1, color2, color3, speed, density, glow, brightness, opacity, mouseInteraction]);

  return <canvas ref={canvasRef} className={`acid-squares-canvas ${className}`.trim()} aria-hidden="true" />;
}
