import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ParticleField = ({ count = 300, color = '#06b6d4' }) => {
  const pointsRef = useRef();

  const { positions, randoms } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const randoms = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // random point in sphere of radius 12
      const r = 12 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      randoms[i * 3] = Math.random();
      randoms[i * 3 + 1] = Math.random();
      randoms[i * 3 + 2] = Math.random();
    }
    return { positions, randoms };
  }, [count]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const pos = pointsRef.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      // Small gentle drifts
      pos[ix] += Math.sin(time * 0.5 + randoms[ix] * Math.PI * 2) * 0.01;
      pos[iy] += Math.sin(time * 0.5 + randoms[iy] * Math.PI * 2) * 0.01;
      pos[iz] += Math.sin(time * 0.5 + randoms[iz] * Math.PI * 2) * 0.01;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color={color}
        transparent
        opacity={0.6}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default ParticleField;
