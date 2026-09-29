import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';

const DrosophilaModel = React.memo(({ opacity = 1 }) => {
  const abdomenRef = useRef();
  const leftWingRef = useRef();
  const rightWingRef = useRef();
  const groupRef = useRef();
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // Smooth, eerie floating of the entire fly
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 0.5) * 0.1;
      groupRef.current.rotation.x = Math.sin(t * 0.3) * 0.02;
    }

    // Wing flutter (approx 6Hz, very fast for flies)
    if (leftWingRef.current && rightWingRef.current) {
      const flutter = Math.sin(t * Math.PI * 12) * 0.15;
      leftWingRef.current.rotation.z = 0.2 + flutter;
      rightWingRef.current.rotation.z = -0.2 - flutter;
    }
    
    // Abdomen breathing (2 second cycle)
    if (abdomenRef.current) {
      const scale = 1.0 + Math.sin(t * Math.PI) * 0.03;
      abdomenRef.current.scale.set(1.8 * scale, 1.8 * scale, 4.5 * scale);
    }
  });

  // Holographic Material for the exoskeleton
  const holoMaterial = (
    <meshPhysicalMaterial 
      color="#0ea5e9" 
      emissive="#0284c7"
      emissiveIntensity={0.2}
      transparent 
      opacity={0.08 * opacity} 
      depthWrite={false} 
      roughness={0.2}
      metalness={1}
      clearcoat={1}
      side={THREE.DoubleSide}
      blending={THREE.AdditiveBlending}
    />
  );

  // Red glowing material for the compound eyes
  const eyeMaterial = (
    <meshPhysicalMaterial 
      color="#ef4444" 
      emissive="#991b1b"
      emissiveIntensity={0.5}
      transparent 
      opacity={0.2 * opacity} 
      depthWrite={false} 
      blending={THREE.AdditiveBlending}
    />
  );

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh position={[0, 0.3, 0]} scale={[1.2, 0.9, 0.8]}>
        <sphereGeometry args={[4.2, 32, 32]} />
        {holoMaterial}
      </mesh>

      {/* Eyes (Compound, Large) */}
      <mesh position={[-4.0, 0.8, 1.2]} scale={[0.5, 0.9, 0.8]} rotation={[0, -0.3, 0]}>
        <sphereGeometry args={[2.5, 32, 32]} />
        {eyeMaterial}
      </mesh>
      <mesh position={[4.0, 0.8, 1.2]} scale={[0.5, 0.9, 0.8]} rotation={[0, 0.3, 0]}>
        <sphereGeometry args={[2.5, 32, 32]} />
        {eyeMaterial}
      </mesh>

      {/* Thorax */}
      <mesh position={[0, -0.5, -4.5]} scale={[2.2, 2.0, 2.8]}>
        <sphereGeometry args={[1.5, 32, 32]} />
        {holoMaterial}
      </mesh>

      {/* Abdomen */}
      <mesh ref={abdomenRef} position={[0, -1.0, -9.5]} scale={[1.8, 1.8, 4.5]}>
        <sphereGeometry args={[1, 32, 32]} />
        {holoMaterial}
      </mesh>

      {/* Wings - Elegant long ellipses */}
      <group position={[-2.0, 1.5, -4.5]} ref={leftWingRef}>
        <mesh position={[-2.5, 0, -2]} rotation={[0.2, 0.5, 0]} scale={[2.5, 0.05, 5]}>
          <sphereGeometry args={[1, 32, 16]} />
          <meshPhysicalMaterial 
            color="#e0e7ff" 
            emissive="#a5b4fc"
            emissiveIntensity={0.2}
            transparent 
            opacity={0.15 * opacity} 
            depthWrite={false} 
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
      <group position={[2.0, 1.5, -4.5]} ref={rightWingRef}>
        <mesh position={[2.5, 0, -2]} rotation={[0.2, -0.5, 0]} scale={[2.5, 0.05, 5]}>
          <sphereGeometry args={[1, 32, 16]} />
          <meshPhysicalMaterial 
            color="#e0e7ff" 
            emissive="#a5b4fc"
            emissiveIntensity={0.2}
            transparent 
            opacity={0.15 * opacity} 
            depthWrite={false} 
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Legs - Bio-organic curves */}
      {[
        { start: [-1.8, -1.5, -3], mid: [-3, -4, -3], end: [-4, -6, -2] },
        { start: [1.8, -1.5, -3], mid: [3, -4, -3], end: [4, -6, -2] },
        { start: [-2.2, -1.8, -4.5], mid: [-4, -4.5, -4], end: [-5, -6.5, -3] },
        { start: [2.2, -1.8, -4.5], mid: [4, -4.5, -4], end: [5, -6.5, -3] },
        { start: [-2.0, -1.8, -6], mid: [-3.5, -4, -7], end: [-4.5, -6, -8] },
        { start: [2.0, -1.8, -6], mid: [3.5, -4, -7], end: [4.5, -6, -8] }
      ].map((leg, i) => (
        <QuadraticBezierLine
          key={i}
          start={leg.start}
          mid={leg.mid}
          end={leg.end}
          color="#0ea5e9"
          lineWidth={1.5}
          transparent
          opacity={0.2 * opacity}
          blending={THREE.AdditiveBlending}
        />
      ))}

      {/* Antennae */}
      <QuadraticBezierLine start={[0.8, 1.5, 2.8]} mid={[1.5, 3.5, 4]} end={[1.0, 4.5, 5.5]} color="#38bdf8" lineWidth={2} transparent opacity={0.3 * opacity} blending={THREE.AdditiveBlending} />
      <QuadraticBezierLine start={[-0.8, 1.5, 2.8]} mid={[-1.5, 3.5, 4]} end={[-1.0, 4.5, 5.5]} color="#38bdf8" lineWidth={2} transparent opacity={0.3 * opacity} blending={THREE.AdditiveBlending} />
    </group>
  );
});

DrosophilaModel.displayName = 'DrosophilaModel';

export default DrosophilaModel;
