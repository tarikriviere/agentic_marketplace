"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Sphere, Line } from "@react-three/drei";
import * as THREE from "three";

// ─── Agent node — glowing sphere ──────────────────────────────────────────
function AgentNode({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const t = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    t.current += delta * 0.5;
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(t.current) * 0.15;
    }
    if (glowRef.current) {
      glowRef.current.position.y = position[1] + Math.sin(t.current) * 0.15;
      const scale = 1.4 + Math.sin(t.current * 2) * 0.1;
      glowRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group>
      {/* Glow halo */}
      <mesh ref={glowRef} position={position}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>
      {/* Core sphere */}
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[0.1, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.2}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>
    </group>
  );
}

// ─── Animated data stream particles along a line ───────────────────────────
function DataStream({
  start,
  end,
  color,
}: {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
}) {
  const particleRef = useRef<THREE.Mesh>(null);
  const t = useRef(Math.random());

  useFrame((_, delta) => {
    t.current = (t.current + delta * 0.3) % 1;
    if (particleRef.current) {
      particleRef.current.position.set(
        start[0] + (end[0] - start[0]) * t.current,
        start[1] + (end[1] - start[1]) * t.current,
        start[2] + (end[2] - start[2]) * t.current
      );
    }
  });

  const points = useMemo(
    () => [new THREE.Vector3(...start), new THREE.Vector3(...end)],
    [start, end]
  );

  return (
    <group>
      <Line points={points} color={color} lineWidth={0.5} transparent opacity={0.2} />
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

// ─── Floating grid ─────────────────────────────────────────────────────────
function Grid() {
  return (
    <gridHelper
      args={[30, 30, "#836EF9", "#200052"]}
      position={[0, -3, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

// ─── Main scene content ────────────────────────────────────────────────────
function SceneContent() {
  const nodes: [number, number, number][] = useMemo(
    () => [
      [-4, 1, -3], [0, 2, -4], [4, 0.5, -3],
      [-3, -1, -1], [3, -0.5, -2], [0, 0, -5],
      [-5, 0, -2], [5, 1, -1], [1.5, -1.5, -3],
    ],
    []
  );

  const colors = ["#836EF9", "#a78bfa", "#c4b5fd", "#7c3aed", "#8b5cf6"];

  const connections = useMemo(
    () => [
      [0, 1], [1, 2], [2, 4], [0, 3], [3, 4],
      [1, 5], [5, 6], [2, 7], [3, 6], [4, 8],
    ],
    []
  );

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 5, 0]} intensity={2} color="#836EF9" />
      <pointLight position={[-5, 0, -5]} intensity={1} color="#a78bfa" />

      <Stars radius={80} depth={60} count={4000} factor={4} saturation={0.5} fade speed={0.5} />
      <Grid />

      {nodes.map((pos, i) => (
        <AgentNode
          key={i}
          position={pos}
          color={colors[i % colors.length]}
        />
      ))}

      {connections.map(([a, b], i) => (
        <DataStream
          key={i}
          start={nodes[a]}
          end={nodes[b]}
          color={colors[i % colors.length]}
        />
      ))}
    </>
  );
}

// ─── Exported canvas component ─────────────────────────────────────────────
export function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 60 }}
      style={{ background: "transparent" }}
      dpr={[1, 2]}
    >
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
    </Canvas>
  );
}
