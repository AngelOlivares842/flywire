import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';

const DrosophilaModel = React.memo(({ opacity = 1, activityLevel = 0 }) => {
  const abdomenRef = useRef();
  const leftWingRef = useRef();
  const rightWingRef = useRef();
  const groupRef = useRef();
  
  // Smoothly interpolate excitation level
  const excitation = useRef(0);
  
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    
    // Target excitation: 0 when no activity, up to 1.0 when many neurons are firing
    const targetExcitation = activityLevel > 0 ? Math.min(activityLevel / 10, 1.0) : 0;
    excitation.current += (targetExcitation - excitation.current) * delta * 3.0;
    
    if (groupRef.current) {
      // Gentle idle float
      groupRef.current.position.y = Math.sin(t * 0.5) * 0.1;
    }

    if (leftWingRef.current && rightWingRef.current) {
      // Flap wings ONLY if there is neural excitation
      if (excitation.current > 0.05) {
        // Speed and amplitude scale with neural activity
        const flutter = Math.sin(t * Math.PI * (20 + 20 * excitation.current)) * (0.4 * excitation.current);
        leftWingRef.current.rotation.z = 0.2 + flutter;
        rightWingRef.current.rotation.z = -0.2 - flutter;
      } else {
        // Idle resting position
        leftWingRef.current.rotation.z = 0.1;
        rightWingRef.current.rotation.z = -0.1;
      }
    }
    
    if (abdomenRef.current) {
      // Breathing accelerates with neural activity
      const breathingSpeed = 2 + (excitation.current * 8);
      const scale = 1.0 + Math.sin(t * breathingSpeed) * (0.015 + 0.02 * excitation.current);
      abdomenRef.current.scale.set(3.5 * scale, 3.5 * scale, 8.0 * scale);
    }
  });

  const ChitinMaterial = () => (
    <meshPhysicalMaterial 
      color="#1f1412"
      roughness={0.6}
      metalness={0.1}
      clearcoat={0.3}
      clearcoatRoughness={0.5}
      transparent 
      opacity={0.35 * opacity}
      depthWrite={false} 
      side={THREE.DoubleSide}
    />
  );

  const EyeMaterial = () => (
    <meshPhysicalMaterial 
      color="#4a0404"
      emissive="#2a0000"
      roughness={0.2}
      metalness={0.8}
      clearcoat={1.0}
      transparent 
      opacity={0.45 * opacity} 
      depthWrite={false} 
    />
  );

  return (
    <group ref={groupRef} scale={[1.8, 1.8, 1.8]} raycast={() => null}>
      {/* Head */}
      <mesh position={[0, 1.5, 0]} scale={[2.0, 1.5, 1.5]} raycast={() => null}>
        <sphereGeometry args={[2.5, 32, 32]} />
        <ChitinMaterial />
      </mesh>

      {/* Eyes */}
      <mesh position={[-2.8, 2.0, 0.5]} scale={[0.6, 1.2, 1.0]} rotation={[0, -0.4, -0.3]} raycast={() => null}>
        <sphereGeometry args={[2.0, 32, 32]} />
        <EyeMaterial />
      </mesh>
      <mesh position={[2.8, 2.0, 0.5]} scale={[0.6, 1.2, 1.0]} rotation={[0, 0.4, 0.3]} raycast={() => null}>
        <sphereGeometry args={[2.0, 32, 32]} />
        <EyeMaterial />
      </mesh>

      {/* Thorax */}
      <mesh position={[0, 0.5, -4.5]} scale={[2.5, 2.8, 3.2]} rotation={[0.2, 0, 0]} raycast={() => null}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <ChitinMaterial />
      </mesh>

      {/* Abdomen */}
      <mesh ref={abdomenRef} position={[0, -1.5, -11.0]} scale={[3.5, 3.5, 8.0]} rotation={[-0.1, 0, 0]} raycast={() => null}>
        <sphereGeometry args={[1, 32, 32]} />
        <ChitinMaterial />
      </mesh>

      {/* Wings */}
      <group position={[-1.5, 4.0, -3.5]} ref={leftWingRef} raycast={() => null}>
        <mesh position={[-2.5, 0, -4]} rotation={[0.1, 0.5, 0]} scale={[2.5, 0.01, 7]} raycast={() => null}>
          <sphereGeometry args={[1, 32, 16]} />
          <meshStandardMaterial 
            color="#ffffff" 
            transparent 
            opacity={0.15 * opacity} 
            depthWrite={false} 
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      <group position={[1.5, 4.0, -3.5]} ref={rightWingRef} raycast={() => null}>
        <mesh position={[2.5, 0, -4]} rotation={[0.1, -0.5, 0]} scale={[2.5, 0.01, 7]} raycast={() => null}>
          <sphereGeometry args={[1, 32, 16]} />
          <meshStandardMaterial 
            color="#ffffff" 
            transparent 
            opacity={0.15 * opacity} 
            depthWrite={false} 
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Legs */}
      {[
        { start: [-2.0, -1.0, -3], mid: [-4, -4, -3], end: [-5, -8, -1] },
        { start: [2.0, -1.0, -3], mid: [4, -4, -3], end: [5, -8, -1] },
        { start: [-2.5, -1.5, -5], mid: [-5, -5, -4], end: [-6, -9, -2] },
        { start: [2.5, -1.5, -5], mid: [5, -5, -4], end: [6, -9, -2] },
        { start: [-2.0, -1.5, -7], mid: [-4.5, -4, -8], end: [-5, -8, -9] },
        { start: [2.0, -1.5, -7], mid: [4.5, -4, -8], end: [5, -8, -9] }
      ].map((leg, i) => (
        <QuadraticBezierLine
          key={i}
          start={leg.start}
          mid={leg.mid}
          end={leg.end}
          color="#1f1412"
          lineWidth={2.5}
          transparent
          opacity={0.5 * opacity}
        />
      ))}

      {/* Antennae */}
      <QuadraticBezierLine start={[1.0, 2.5, 3.0]} mid={[1.5, 3.5, 4.5]} end={[1.2, 4.0, 5.0]} color="#1f1412" lineWidth={3} transparent opacity={0.6 * opacity} />
      <QuadraticBezierLine start={[-1.0, 2.5, 3.0]} mid={[-1.5, 3.5, 4.5]} end={[-1.2, 4.0, 5.0]} color="#1f1412" lineWidth={3} transparent opacity={0.6 * opacity} />
    </group>
  );
});

DrosophilaModel.displayName = 'DrosophilaModel';

export default DrosophilaModel;
