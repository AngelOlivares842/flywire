import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';

/**
 * High-precision, scientific Drosophila anatomical framework.
 * Proportioned to match the 54-unit FlyWire connectome coordinate space.
 * Replaces cartoonish solid spheres with delicate, high-tech biological contours.
 */
const RealisticFly = React.memo(({
  activityLevel = 0,
  stimulus = null,
  bodyMode = 'silhouette', // 'silhouette' | 'translucent' | 'none'
}) => {
  const groupRef = useRef();
  const leftWingRef = useRef();
  const rightWingRef = useRef();
  const leftAntennaRef = useRef();
  const rightAntennaRef = useRef();
  const proboscisRef = useRef();
  const leftEyeRef = useRef();
  const rightEyeRef = useRef();

  const excitation = useRef(0);
  const stimulusPhase = useRef(0);

  useFrame((state, delta) => {
    if (bodyMode === 'none') return;
    const t = state.clock.getElapsedTime();

    // Smooth excitement easing
    const target = activityLevel > 0 ? Math.min(activityLevel / 10, 1.0) : 0;
    excitation.current += (target - excitation.current) * delta * 3.0;

    if (stimulus) {
      stimulusPhase.current = Math.min(1, stimulusPhase.current + delta * 2.5);
    } else {
      stimulusPhase.current = Math.max(0, stimulusPhase.current - delta * 2.0);
    }

    const exc = excitation.current;
    const sPhase = stimulusPhase.current;

    // Body floating hover
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 0.7) * 0.15;
    }

    // Wings: Danger escape reflex (fast flutter) vs gentle breathing
    if (leftWingRef.current && rightWingRef.current) {
      if (stimulus === 'danger' && sPhase > 0.05) {
        const flutter = Math.sin(t * 48) * 0.35 * sPhase;
        leftWingRef.current.rotation.z = 0.15 + flutter;
        rightWingRef.current.rotation.z = -0.15 - flutter;
        leftWingRef.current.rotation.y = 0.25 + Math.sin(t * 24) * 0.15 * sPhase;
        rightWingRef.current.rotation.y = -0.25 - Math.sin(t * 24) * 0.15 * sPhase;
      } else if (exc > 0.1) {
        const flutter = Math.sin(t * 18) * (0.08 + 0.12 * exc);
        leftWingRef.current.rotation.z = 0.08 + flutter;
        rightWingRef.current.rotation.z = -0.08 - flutter;
      } else {
        leftWingRef.current.rotation.z = 0.05 + Math.sin(t * 1.5) * 0.01;
        rightWingRef.current.rotation.z = -0.05 - Math.sin(t * 1.5) * 0.01;
        leftWingRef.current.rotation.y = 0.12;
        rightWingRef.current.rotation.y = -0.12;
      }
    }

    // Antennae twitch (Odor response)
    if (leftAntennaRef.current && rightAntennaRef.current) {
      if (stimulus === 'odor') {
        const twL = Math.sin(t * 14) * 0.25 * sPhase;
        const twR = Math.cos(t * 15) * 0.25 * sPhase;
        leftAntennaRef.current.rotation.z = twL;
        leftAntennaRef.current.rotation.x = Math.sin(t * 8) * 0.12 * sPhase;
        rightAntennaRef.current.rotation.z = -twR;
        rightAntennaRef.current.rotation.x = Math.sin(t * 8.5) * 0.12 * sPhase;
      } else {
        leftAntennaRef.current.rotation.z = Math.sin(t * 2) * 0.03;
        rightAntennaRef.current.rotation.z = -Math.sin(t * 2.1) * 0.03;
        leftAntennaRef.current.rotation.x = 0;
        rightAntennaRef.current.rotation.x = 0;
      }
    }

    // Proboscis Extension Reflex (Food response)
    if (proboscisRef.current) {
      const extend = stimulus === 'food' ? sPhase : 0;
      proboscisRef.current.scale.y = 0.4 + extend * 1.3;
      proboscisRef.current.position.y = -11.5 - extend * 8.0;
    }

    // Eyes glow on Light stimulus
    if (leftEyeRef.current && rightEyeRef.current) {
      const eyeGlow = stimulus === 'light' ? 0.45 + Math.sin(t * 8) * 0.2 * sPhase : 0.08;
      leftEyeRef.current.opacity = eyeGlow;
      rightEyeRef.current.opacity = eyeGlow;
    }
  });

  if (bodyMode === 'none') return null;

  const isWire = bodyMode === 'silhouette';
  const contourColor = isWire ? '#38bdf8' : '#64748b';
  const baseOpacity = isWire ? 0.12 : 0.18;

  return (
    <group ref={groupRef} raycast={() => null}>
      {/* ── Head Capsule Contour (Framing the 52-unit brain) ── */}
      <mesh position={[0, -0.5, 0]} scale={[30, 16, 12]} raycast={() => null}>
        <sphereGeometry args={[1, 32, 20]} />
        <meshPhysicalMaterial
          color={contourColor}
          wireframe={isWire}
          transparent
          opacity={baseOpacity * 0.8}
          roughness={0.3}
          metalness={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* ── Left Compound Eye (Lateral to Left Optic Lobe, X ≈ -28) ── */}
      <mesh position={[-28.5, -1.5, 1.2]} scale={[7.5, 12.5, 10.5]} rotation={[0, -0.28, -0.1]} raycast={() => null}>
        <sphereGeometry args={[1, 24, 20]} />
        <meshPhysicalMaterial
          ref={leftEyeRef}
          color="#831843"
          emissive="#f43f5e"
          emissiveIntensity={0.15}
          wireframe={isWire}
          transparent
          opacity={isWire ? 0.22 : 0.4}
          roughness={0.2}
          metalness={0.3}
          clearcoat={1.0}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── Right Compound Eye (Lateral to Right Optic Lobe, X ≈ +28) ── */}
      <mesh position={[28.5, -1.5, 1.2]} scale={[7.5, 12.5, 10.5]} rotation={[0, 0.28, 0.1]} raycast={() => null}>
        <sphereGeometry args={[1, 24, 20]} />
        <meshPhysicalMaterial
          ref={rightEyeRef}
          color="#831843"
          emissive="#f43f5e"
          emissiveIntensity={0.15}
          wireframe={isWire}
          transparent
          opacity={isWire ? 0.22 : 0.4}
          roughness={0.2}
          metalness={0.3}
          clearcoat={1.0}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── Antennae (Above Antennal Lobes, pointing forward) ── */}
      <group ref={leftAntennaRef} position={[-4.5, 5.0, 11]}>
        <QuadraticBezierLine start={[0, 0, 0]} mid={[-2.5, 4.0, 6.0]} end={[-2.0, 8.0, 9.0]} color="#38bdf8" lineWidth={1.5} transparent opacity={0.4} />
        {/* Arista feathering */}
        <QuadraticBezierLine start={[-2.0, 8.0, 9.0]} mid={[-5.0, 12.5, 12.0]} end={[-3.0, 16.0, 14.0]} color="#0ea5e9" lineWidth={0.8} transparent opacity={0.35} />
      </group>
      <group ref={rightAntennaRef} position={[4.5, 5.0, 11]}>
        <QuadraticBezierLine start={[0, 0, 0]} mid={[2.5, 4.0, 6.0]} end={[2.0, 8.0, 9.0]} color="#38bdf8" lineWidth={1.5} transparent opacity={0.4} />
        <QuadraticBezierLine start={[2.0, 8.0, 9.0]} mid={[5.0, 12.5, 12.0]} end={[3.0, 16.0, 14.0]} color="#0ea5e9" lineWidth={0.8} transparent opacity={0.35} />
      </group>

      {/* ── Proboscis (Underneath subesophageal ganglion) ── */}
      <group ref={proboscisRef} position={[0, -11.5, 3]}>
        <QuadraticBezierLine start={[0, 0, 0]} mid={[0, -5, 2]} end={[0, -9.5, 1]} color="#64748b" lineWidth={2.0} transparent opacity={0.35} />
        <mesh position={[0, -9.5, 1]} scale={[2.2, 1.4, 2.0]} raycast={() => null}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial color="#b45309" transparent opacity={0.4} />
        </mesh>
      </group>

      {/* ── Thorax Contour (Behind the head) ── */}
      <mesh position={[0, -4.5, -28]} scale={[20, 22, 26]} rotation={[0.08, 0, 0]} raycast={() => null}>
        <sphereGeometry args={[1, 24, 20]} />
        <meshPhysicalMaterial
          color={contourColor}
          wireframe={isWire}
          transparent
          opacity={baseOpacity * 0.6}
          roughness={0.4}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* ── Scutellum (Dorsal thorax plate) ── */}
      <mesh position={[0, 9.5, -34]} scale={[11, 4.5, 8.0]} rotation={[-0.2, 0, 0]} raycast={() => null}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshPhysicalMaterial
          color="#38bdf8"
          wireframe={isWire}
          transparent
          opacity={baseOpacity * 0.7}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* ── Segmented Abdomen Outline ── */}
      {[0, 1, 2, 3, 4].map(i => (
        <mesh key={`abd-${i}`} position={[0, -7.0 - i * 0.8, -48 - i * 8.5]} scale={[18 - i * 2.6, 14 - i * 2.0, 7.5]} raycast={() => null}>
          <sphereGeometry args={[1, 20, 16]} />
          <meshPhysicalMaterial
            color={contourColor}
            wireframe={isWire}
            transparent
            opacity={baseOpacity * (0.6 - i * 0.08)}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* ── Transparent Membranous Wings with Delicate Venation ── */}
      <group position={[-11, 14, -24]} ref={leftWingRef} raycast={() => null}>
        <mesh position={[-25, 0, -35]} rotation={[0.08, 0.35, 0]} scale={[38, 0.1, 75]} raycast={() => null}>
          <sphereGeometry args={[1, 32, 16]} />
          <meshPhysicalMaterial
            color="#bae6fd"
            transparent
            opacity={0.05}
            roughness={0.1}
            transmission={0.95}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        {[
          { s: [0, 0, 0], m: [-18, 0, -22], e: [-36, 0, -58] },
          { s: [0, 0, 0], m: [-14, 0, -15], e: [-32, 0, -42] },
          { s: [0, 0, 0], m: [-9, 0, -10], e: [-22, 0, -26] },
        ].map((v, i) => (
          <QuadraticBezierLine key={`lv-${i}`} start={v.s} mid={v.m} end={v.e} color="#38bdf8" lineWidth={0.8} transparent opacity={0.2} />
        ))}
      </group>

      <group position={[11, 14, -24]} ref={rightWingRef} raycast={() => null}>
        <mesh position={[25, 0, -35]} rotation={[0.08, -0.35, 0]} scale={[38, 0.1, 75]} raycast={() => null}>
          <sphereGeometry args={[1, 32, 16]} />
          <meshPhysicalMaterial
            color="#bae6fd"
            transparent
            opacity={0.05}
            roughness={0.1}
            transmission={0.95}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        {[
          { s: [0, 0, 0], m: [18, 0, -22], e: [36, 0, -58] },
          { s: [0, 0, 0], m: [14, 0, -15], e: [32, 0, -42] },
          { s: [0, 0, 0], m: [9, 0, -10], e: [22, 0, -26] },
        ].map((v, i) => (
          <QuadraticBezierLine key={`rv-${i}`} start={v.s} mid={v.m} end={v.e} color="#38bdf8" lineWidth={0.8} transparent opacity={0.2} />
        ))}
      </group>
    </group>
  );
});

RealisticFly.displayName = 'RealisticFly';
export default RealisticFly;
