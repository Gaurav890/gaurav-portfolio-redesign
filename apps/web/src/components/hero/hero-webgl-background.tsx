"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * The actual WebGL scene (DD-002's "bold hero moment"). Loaded exclusively
 * through `hero-background.tsx`'s `next/dynamic(..., { ssr: false })` —
 * never import this file directly from a server component, and never
 * render it when `prefers-reduced-motion` is set (that gating lives in the
 * wrapper, not here, so this file can stay a plain always-animating scene).
 *
 * A single full-viewport plane with a hand-written simplex-noise fragment
 * shader, animated on `u_time`, colored from the warm terracotta/paper
 * palette (DESIGN_SYSTEM.md) at low opacity so hero text stays legible on
 * top of it — this is deliberately a quiet generative field, not a
 * particle explosion, to stay "warm/narrative" per DD-001 even as DD-002
 * asks for more technical ambition in the interaction layer.
 */

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Ashima Arts / Stefan Gustavson simplex noise (public domain / MIT,
// standard reference implementation widely used in WebGL shaders).
const FRAGMENT_SHADER = /* glsl */ `
  varying vec2 vUv;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec3 u_colorA;
  uniform vec3 u_colorB;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = vUv;
    uv.x *= u_resolution.x / u_resolution.y;

    float t = u_time * 0.045;
    float n = snoise(uv * 2.2 + vec2(t, t * 0.6));
    n += 0.5 * snoise(uv * 4.5 - vec2(t * 0.8, t * 0.3));
    n = n * 0.5 + 0.5;

    vec3 color = mix(u_colorA, u_colorB, n);

    // Fade toward the edges so it reads as an ambient field behind the
    // hero text, not a hard-edged rectangle.
    float vignette = smoothstep(0.9, 0.15, distance(vUv, vec2(0.5)));
    float alpha = 0.55 * vignette;

    gl_FragColor = vec4(color, alpha);
  }
`;

/**
 * Resolves a CSS custom property (e.g. `--background`) on `:root` to its
 * actual computed color string. THREE.Color's constructor cannot parse a
 * raw `var(--x)` expression, so this reads the already-resolved value the
 * browser computed instead — that also means it automatically picks up
 * the correct light/dark value without this component needing its own
 * dark-mode branch.
 */
function resolveCssColor(customProperty: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(customProperty)
    .trim();
  return value || fallback;
}

function NoisePlane() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(1, 1) },
      u_colorA: {
        value: new THREE.Color(resolveCssColor("--background", "#faf6ef")),
      },
      u_colorB: {
        value: new THREE.Color(resolveCssColor("--accent", "#c6552b")),
      },
    }),
    [],
  );

  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.u_time.value = state.clock.elapsedTime;
    materialRef.current.uniforms.u_resolution.value.set(
      state.size.width,
      state.size.height,
    );
  });

  return (
    <mesh scale={[2, 2, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
}

export function HeroWebglBackground() {
  return (
    <Canvas
      aria-hidden="true"
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0, 1] }}
    >
      <NoisePlane />
    </Canvas>
  );
}
