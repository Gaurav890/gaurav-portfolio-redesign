"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * The actual WebGL scene (DD-002's "bold hero moment"). Loaded exclusively
 * through `hero-background.tsx`'s `next/dynamic(..., { ssr: false })` —
 * never import this file directly from a server component, and never
 * render it when `prefers-reduced-motion` is set (that gating lives in the
 * wrapper, not here).
 *
 * 2026-07-25, second pass: the original v1 was a full-bleed organic
 * simplex-noise color field (even reworked to fractal noise at a lower
 * opacity ceiling, it still read as a blurry colored stain, not a
 * considered piece of generative art — fair feedback, an amorphous color
 * wash is genuinely hard to art-direct well via shader math alone).
 * Replaced with a precise particle/constellation field: small drifting
 * points that connect with thin lines when near each other or the cursor.
 * A deliberately different *category* of visual — geometric/precise
 * rather than organic/painterly — both easier to keep looking clean at
 * low density and more on-brand ("systems/network" reads as agentic
 * systems in a way an abstract color field didn't).
 *
 * All particle math works directly in R3F's `viewport` world units (the
 * actual visible plane size at z=0 for whatever camera is active) rather
 * than a separate normalized space scaled by a wrapping group transform —
 * that indirection was the source of an earlier sizing bug in this file's
 * first draft of this pass; keeping one coordinate space end to end avoids
 * it entirely.
 */

const PARTICLE_COUNT = 70;
const CONNECTION_FRACTION = 0.11; // of viewport width, resolution-independent
const CURSOR_CONNECTION_FRACTION = 0.16;

function createSoftDotTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function resolveCssColor(customProperty: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(customProperty).trim();
  return value || fallback;
}

type Particle = {
  position: THREE.Vector2;
  velocity: THREE.Vector2;
};

function ConstellationField() {
  const { viewport, pointer } = useThree();

  const dotColor = useMemo(() => resolveCssColor("--accent", "#c6552b"), []);
  const lineColor = useMemo(() => resolveCssColor("--foreground-muted", "#6b6259"), []);
  const dotTexture = useMemo(() => createSoftDotTexture(), []);

  // Particle state and the typed arrays fed to Three.js are intentionally
  // *mutated in place* every frame (standard practice for WebGL buffers —
  // allocating fresh arrays 60x/sec would be wasteful and would itself
  // hurt performance). That mutation is exactly what `useMemo`'s contract
  // forbids (its return value is assumed stable/read-only, which is what
  // the React Compiler's `react-hooks/immutability` rule was correctly
  // catching here) — `useRef` is the right primitive for data that's
  // deliberately mutable across renders without a re-render bailout.
  const particlesRef = useRef<Particle[]>([]);
  const pointsGeometryRef = useRef<THREE.BufferGeometry>(null);
  const linesGeometryRef = useRef<THREE.BufferGeometry>(null);
  const pointPositionsRef = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT * 3));
  // Worst case every particle connects to every other + the cursor: budget
  // generously so the buffer never needs reallocating mid-animation.
  const maxLineVertices = PARTICLE_COUNT * PARTICLE_COUNT * 2 + PARTICLE_COUNT * 2;
  const linePositionsRef = useRef<Float32Array>(new Float32Array(maxLineVertices * 3));

  // Re-seeded whenever the viewport size changes (e.g. a real window
  // resize, not just re-renders) so particles redistribute across the
  // actual visible area instead of staying confined to whatever size the
  // canvas was on first mount.
  useEffect(() => {
    const halfW = viewport.width / 2;
    const halfH = viewport.height / 2;
    const list: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      list.push({
        position: new THREE.Vector2(
          (Math.random() * 2 - 1) * halfW,
          (Math.random() * 2 - 1) * halfH,
        ),
        velocity: new THREE.Vector2(
          (Math.random() - 0.5) * viewport.width * 0.012,
          (Math.random() - 0.5) * viewport.height * 0.012,
        ),
      });
    }
    particlesRef.current = list;
  }, [viewport.width, viewport.height]);

  // Buffer attributes are attached imperatively (not via declarative
  // `<bufferAttribute>` JSX reading `ref.current` at render time, which
  // React's rules correctly forbid - refs must not be read during render)
  // - this is also the idiomatic R3F pattern for geometry whose contents
  // mutate every frame rather than on every re-render.
  useEffect(() => {
    pointsGeometryRef.current?.setAttribute(
      "position",
      new THREE.BufferAttribute(pointPositionsRef.current, 3),
    );
    linesGeometryRef.current?.setAttribute(
      "position",
      new THREE.BufferAttribute(linePositionsRef.current, 3),
    );
  }, []);

  useFrame(() => {
    const particles = particlesRef.current;
    const pointPositions = pointPositionsRef.current;
    const linePositions = linePositionsRef.current;
    if (particles.length === 0) return; // not yet seeded by the effect above
    const halfW = viewport.width / 2;
    const halfH = viewport.height / 2;
    const connectionDistance = viewport.width * CONNECTION_FRACTION;
    const cursorConnectionDistance = viewport.width * CURSOR_CONNECTION_FRACTION;
    const cursorWorld = new THREE.Vector2(pointer.x * halfW, pointer.y * halfH);

    for (const particle of particles) {
      particle.position.add(particle.velocity);
      if (particle.position.x > halfW) particle.position.x = -halfW;
      if (particle.position.x < -halfW) particle.position.x = halfW;
      if (particle.position.y > halfH) particle.position.y = -halfH;
      if (particle.position.y < -halfH) particle.position.y = halfH;
    }

    for (let i = 0; i < particles.length; i++) {
      pointPositions[i * 3] = particles[i].position.x;
      pointPositions[i * 3 + 1] = particles[i].position.y;
      pointPositions[i * 3 + 2] = 0;
    }
    if (pointsGeometryRef.current) {
      pointsGeometryRef.current.attributes.position.needsUpdate = true;
    }

    let lineVertexCount = 0;
    const pushLineVertex = (v: THREE.Vector2) => {
      linePositions[lineVertexCount * 3] = v.x;
      linePositions[lineVertexCount * 3 + 1] = v.y;
      linePositions[lineVertexCount * 3 + 2] = 0;
      lineVertexCount++;
    };

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        if (particles[i].position.distanceTo(particles[j].position) < connectionDistance) {
          pushLineVertex(particles[i].position);
          pushLineVertex(particles[j].position);
        }
      }

      // Cursor-reactive: nearby particles also draw a line to the pointer
      // (DD-002's cursor-reactive-interaction request, applied here too,
      // not just the button magnetism elsewhere on the page).
      if (particles[i].position.distanceTo(cursorWorld) < cursorConnectionDistance) {
        pushLineVertex(particles[i].position);
        pushLineVertex(cursorWorld);
      }
    }

    if (linesGeometryRef.current) {
      linesGeometryRef.current.setDrawRange(0, lineVertexCount);
      linesGeometryRef.current.attributes.position.needsUpdate = true;
    }
  });

  return (
    <>
      <lineSegments>
        <bufferGeometry ref={linesGeometryRef} />
        <lineBasicMaterial color={lineColor} transparent opacity={0.18} depthWrite={false} />
      </lineSegments>

      <points>
        <bufferGeometry ref={pointsGeometryRef} />
        <pointsMaterial
          map={dotTexture}
          color={dotColor}
          size={viewport.width * 0.014}
          transparent
          opacity={0.7}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </>
  );
}

export function HeroWebglBackground() {
  return (
    <Canvas aria-hidden="true" dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}>
      <ConstellationField />
    </Canvas>
  );
}
