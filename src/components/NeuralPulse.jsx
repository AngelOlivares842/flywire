import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const NeuralPulse = ({ id, start, end, duration = 0.8, color = '#06b6d4', onComplete }) => {
  const timeRef = useRef(0);
  const completedRef = useRef(false);
  
  const startVec = useMemo(() => new THREE.Vector3(...start), [start]);
  const endVec = useMemo(() => new THREE.Vector3(...end), [end]);
  
  const trailCount = 4;
  
  // Use separate refs for each mesh to avoid createRef within render
  const mainRef = useRef();
  const trailRefs = [
    useRef(), useRef(), useRef(), useRef()
  ];

  // Use pre-allocated vectors to avoid garbage collection in useFrame
  const currentPos = useRef(new THREE.Vector3());
  const trailCurrentPos = useRef(new THREE.Vector3());
  
  useFrame((state, delta) => {
    timeRef.current += delta;
    let progress = timeRef.current / duration;
    
    if (progress >= 1) {
      if (onComplete && !completedRef.current) {
        completedRef.current = true;
        onComplete(id);
      }
      progress = 1; // clamp
    }

    if (mainRef.current) {
      currentPos.current.lerpVectors(startVec, endVec, progress);
      mainRef.current.position.copy(currentPos.current);
      const pulseScale = 1 + Math.sin(progress * Math.PI * 4) * 0.2;
      mainRef.current.scale.setScalar(pulseScale);
    }
    
    for (let i = 0; i < trailCount; i++) {
      const trailProgress = Math.max(0, progress - ((i + 1) * 0.05));
      if (trailRefs[i].current) {
        trailCurrentPos.current.lerpVectors(startVec, endVec, trailProgress);
        trailRefs[i].current.position.copy(trailCurrentPos.current);
      }
    }
  });

  return (
    <group>
      {/* Main pulse */}
      <mesh ref={mainRef}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} depthWrite={false} />
      </mesh>
      
      {/* Trail */}
      {trailRefs.map((ref, i) => (
        <mesh key={i} ref={ref}>
          <sphereGeometry args={[0.08 * (1 - (i + 1) * 0.2), 6, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0.5 * (1 - (i + 1) * 0.2)} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
};

export default NeuralPulse;
