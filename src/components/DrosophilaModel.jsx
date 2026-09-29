import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';

const DrosophilaModel = React.memo(({ opacity = 1, activityLevel = 0 }) => {
  const abdomenRef = useRef();
  const leftWingRef = useRef();
  const rightWingRef = useRef();
  const groupRef = useRef();
  
  const excitation = useRef(0);
  
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    
    // Target excitation: 0 when no activity, up to 1.0 when many neurons are firing
    const targetExcitation = activityLevel > 0 ? Math.min(activityLevel / 10, 1.0) : 0;
    excitation.current += (targetExcitation - excitation.current) * delta * 3.0;
    
    if (groupRef.current) {
      // Gentle idle float
      groupRef.current.position.y = Math.sin(t * 0.5) * 0.2;
    }

    if (leftWingRef.current && rightWingRef.current) {
      if (excitation.current > 0.05) {
        // Speed and amplitude scale with neural activity
        const flutter = Math.sin(t * Math.PI * (20 + 20 * excitation.current)) * (0.4 * excitation.current);
        leftWingRef.current.rotation.z = 0.2 + flutter;
        rightWingRef.current.rotation.z = -0.2 - flutter;
      } else {
        leftWingRef.current.rotation.z = 0.1;
        rightWingRef.current.rotation.z = -0.1;
      }
    }
    
    if (abdomenRef.current) {
      // Breathing accelerates with neural activity
      const breathingSpeed = 2 + (excitation.current * 8);
      const scale = 1.0 + Math.sin(t * breathingSpeed) * (0.015 + 0.02 * excitation.current);
      abdomenRef.current.scale.set(15 * scale, 12 * scale, 25 * scale);
    }
  });

  // A very subtle, faint rim-lit silhouette material
  const FlyMaterial = ({ color, opac = 0.1 }) => (
    <meshPhysicalMaterial 
      color={color}
      transparent 
      opacity={opac * opacity}
      depthWrite={false} 
      side={THREE.DoubleSide}
      roughness={0.8}
      transmission={0.9}
      thickness={1.0}
      envMapIntensity={0.5}
    />
  );

  return (
    // The brain is at [0,0,0] with a span of roughly [-15, 15] on X and Z.
    // The fly is scaled and positioned so the brain sits exactly inside its head.
    <group ref={groupRef} raycast={() => null}>
      
      {/* Head - Exactly enveloping the brain at [0,0,0] */}
      <mesh position={[0, -2, 0]} scale={[1.8, 1.2, 1.2]} raycast={() => null}>
        <sphereGeometry args={[12, 32, 32]} />
        <FlyMaterial color="#0f172a" opac={0.15} />
      </mesh>

      {/* Eyes - Large compound eyes on the sides of the head */}
      <mesh position={[-14, 0, 2]} scale={[0.4, 1.2, 1.0]} rotation={[0, -0.2, -0.2]} raycast={() => null}>
        <sphereGeometry args={[10, 32, 32]} />
        <FlyMaterial color="#4a0404" opac={0.2} />
      </mesh>
      <mesh position={[14, 0, 2]} scale={[0.4, 1.2, 1.0]} rotation={[0, 0.2, 0.2]} raycast={() => null}>
        <sphereGeometry args={[10, 32, 32]} />
        <FlyMaterial color="#4a0404" opac={0.2} />
      </mesh>

      {/* Thorax - Directly behind the head */}
      <mesh position={[0, -4, -22]} scale={[14, 16, 18]} rotation={[0.1, 0, 0]} raycast={() => null}>
        <sphereGeometry args={[1, 32, 32]} />
        <FlyMaterial color="#020617" opac={0.2} />
      </mesh>

      {/* Abdomen - Long, extending far back */}
      <mesh ref={abdomenRef} position={[0, -8, -55]} scale={[15, 12, 25]} rotation={[-0.1, 0, 0]} raycast={() => null}>
        <sphereGeometry args={[1, 32, 32]} />
        <FlyMaterial color="#020617" opac={0.2} />
      </mesh>

      {/* Wings - Spanning out from the thorax */}
      <group position={[-8, 12, -20]} ref={leftWingRef} raycast={() => null}>
        <mesh position={[-20, 0, -20]} rotation={[0.1, 0.4, 0]} scale={[25, 0.1, 55]} raycast={() => null}>
          <sphereGeometry args={[1, 32, 16]} />
          <FlyMaterial color="#ffffff" opac={0.05} />
        </mesh>
      </group>
      <group position={[8, 12, -20]} ref={rightWingRef} raycast={() => null}>
        <mesh position={[20, 0, -20]} rotation={[0.1, -0.4, 0]} scale={[25, 0.1, 55]} raycast={() => null}>
          <sphereGeometry args={[1, 32, 16]} />
          <FlyMaterial color="#ffffff" opac={0.05} />
        </mesh>
      </group>

      {/* Legs - Angling down from the thorax */}
      {[
        { start: [-10, -15, -15], mid: [-25, -30, -15], end: [-35, -50, -10] },
        { start: [10, -15, -15], mid: [25, -30, -15], end: [35, -50, -10] },
        { start: [-12, -18, -25], mid: [-30, -35, -20], end: [-40, -55, -15] },
        { start: [12, -18, -25], mid: [30, -35, -20], end: [40, -55, -15] },
        { start: [-10, -18, -35], mid: [-25, -35, -40], end: [-30, -55, -45] },
        { start: [10, -18, -35], mid: [25, -35, -40], end: [30, -55, -45] }
      ].map((leg, i) => (
        <QuadraticBezierLine
          key={i}
          start={leg.start}
          mid={leg.mid}
          end={leg.end}
          color="#0f172a"
          lineWidth={2}
          transparent
          opacity={0.3 * opacity}
        />
      ))}

      {/* Antennae - Front of the head */}
      <QuadraticBezierLine start={[4, 4, 10]} mid={[6, 10, 18]} end={[5, 15, 20]} color="#0f172a" lineWidth={1.5} transparent opacity={0.4 * opacity} />
      <QuadraticBezierLine start={[-4, 4, 10]} mid={[-6, 10, 18]} end={[-5, 15, 20]} color="#0f172a" lineWidth={1.5} transparent opacity={0.4 * opacity} />
    </group>
  );
});

DrosophilaModel.displayName = 'DrosophilaModel';

export default DrosophilaModel;
