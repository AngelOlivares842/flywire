import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * 3D Bounded Behavioral Arena with interactive stimulus beacon (Light / Odor).
 */
export default function ArenaBox({
  bounds = { x: 45, y: 30, z: 45 },
  stimulus = null,
  isVisible = true,
  flyTrail = [],
}) {
  const beaconRef = useRef();
  const ringRef = useRef();

  const size = useMemo(() => [bounds.x * 2, bounds.y * 2, bounds.z * 2], [bounds]);

  // Trail line geometry
  const trailGeometry = useMemo(() => {
    if (!flyTrail || flyTrail.length < 2) return null;
    const points = flyTrail.map(p => new THREE.Vector3(p[0], p[1], p[2]));
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [flyTrail]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (beaconRef.current) {
      beaconRef.current.position.y += Math.sin(t * 2) * 0.02;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.01;
      const s = 1.0 + Math.sin(t * 3) * 0.15;
      ringRef.current.scale.set(s, s, s);
    }
  });

  if (!isVisible) return null;

  const stimColor = stimulus?.type === 'light' ? '#f59e0b' : stimulus?.type === 'odor' ? '#a855f7' : '#10b981';

  return (
    <group>
      {/* ── Bounded Glass Chamber ── */}
      <mesh>
        <boxGeometry args={size} />
        <meshBasicMaterial
          color="#0ea5e9"
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* Grid Floor */}
      <gridHelper
        args={[bounds.x * 2, 20, '#0284c7', '#1e293b']}
        position={[0, -bounds.y, 0]}
      />

      {/* ── Flight Path Trajectory Ribbon ── */}
      {trailGeometry && (
        <line geometry={trailGeometry}>
          <lineBasicMaterial
            color="#22d3ee"
            transparent
            opacity={0.4}
            linewidth={1}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </line>
      )}

      {/* ── Interactive Stimulus Beacon (Light / Odor target) ── */}
      {stimulus && stimulus.active && stimulus.type !== 'none' && (
        <group ref={beaconRef} position={stimulus.position}>
          {/* Central Glowing Core */}
          <mesh>
            <sphereGeometry args={[1.8, 20, 20]} />
            <meshBasicMaterial color={stimColor} />
          </mesh>

          {/* Outer Halo */}
          <mesh>
            <sphereGeometry args={[3.2, 16, 16]} />
            <meshBasicMaterial color={stimColor} transparent opacity={0.25} />
          </mesh>

          {/* Radiant Light */}
          {stimulus.type === 'light' && (
            <pointLight color="#fbbf24" intensity={2.5} distance={70} />
          )}

          {/* Pulsing Sensory Field Ring */}
          <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[4.0, 4.4, 32]} />
            <meshBasicMaterial color={stimColor} transparent opacity={0.3} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </group>
  );
}
