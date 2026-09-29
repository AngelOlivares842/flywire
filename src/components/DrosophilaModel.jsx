import React, { useRef } from 'react';
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
    
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 0.5) * 0.1;
    }

    if (leftWingRef.current && rightWingRef.current) {
      const isFlying = Math.sin(t * 0.5) > 0;
      if (isFlying) {
        const flutter = Math.sin(t * Math.PI * 25) * 0.2;
        leftWingRef.current.rotation.z = 0.4 + flutter;
        rightWingRef.current.rotation.z = -0.4 - flutter;
      } else {
        leftWingRef.current.rotation.z = 0.1;
        rightWingRef.current.rotation.z = -0.1;
      }
    }
    
    if (abdomenRef.current) {
      const scale = 1.0 + Math.sin(t * 3) * 0.015;
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
