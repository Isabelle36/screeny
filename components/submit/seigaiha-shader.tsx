'use client';

import { useEffect, useRef } from 'react';

const VERTEX_SHADER = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const FRAGMENT_SHADER = `
precision mediump float;
uniform vec2 uResolution;
uniform float uTime;

const vec3 PAPER = vec3(0.980, 0.973, 0.953);
const vec3 INDIGO = vec3(0.184, 0.255, 0.447);
const vec3 VERMILION = vec3(0.886, 0.290, 0.204);
const float RINGS = 4.0;
const float ROW_HEIGHT = 0.5;

vec2 seigaiha(vec2 p, float topRow) {
  float first = floor((p.y - 1.0) / ROW_HEIGHT);
  for (int k = 0; k < 6; k++) {
    float row = first + float(k);
    if (row > topRow) break;
    float offset = mod(row, 2.0);
    float cx = floor((p.x - offset) * 0.5 + 0.5) * 2.0 + offset;
    float bob = 0.05 * sin(uTime * 0.8 + row * 1.7);
    float d = length(p - vec2(cx, row * ROW_HEIGHT + bob));
    if (d < 1.0) return vec2(d, 1.0);
  }
  return vec2(1.0, 0.0);
}

void main() {
  float height = uResolution.y;
  vec2 uv = gl_FragCoord.xy / height;
  float width = uResolution.x / height;
  float pixel = 1.0 / height;

  vec3 color = PAPER;
  float sunDistance = length(uv - vec2(width * 0.82, 0.58));
  float sun = 1.0 - smoothstep(0.27 - pixel, 0.27 + pixel, sunDistance);
  color = mix(color, VERMILION, sun * 0.92);

  float scale = 7.0;
  vec2 p = uv * scale;
  p.x += uTime * 0.22;
  vec2 wave = seigaiha(p, floor(0.52 * scale / ROW_HEIGHT));
  if (wave.y > 0.5) {
    float r = wave.x * RINGS;
    float toLine = min(fract(r), 1.0 - fract(r));
    float ringPixel = pixel * scale * RINGS;
    float line = 1.0 - smoothstep(0.11 - ringPixel, 0.11 + ringPixel, toLine);
    vec3 sea = mix(PAPER, INDIGO, 0.05 + 0.07 * (1.0 - uv.y));
    color = mix(sea, INDIGO, line * 0.62);
  }

  gl_FragColor = vec4(color, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function SeigaihaShader({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false });
    if (!canvas || !gl || gl.isContextLost()) return;

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const resolution = gl.getUniformLocation(program, 'uResolution');
    const time = gl.getUniformLocation(program, 'uTime');

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now();
    let frame = 0;

    const draw = () => {
      gl.uniform1f(time, reducedMotion ? 4 : (performance.now() - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = () => {
      draw();
      frame = requestAnimationFrame(loop);
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(resolution, canvas.width, canvas.height);
      if (reducedMotion) draw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    if (reducedMotion) draw();
    else frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={`block bg-[#faf8f3] ${className}`} />;
}
