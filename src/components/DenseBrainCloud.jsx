import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getRegionOffset } from '../utils/layout.js';

export default function DenseBrainCloud({ isVisible, isExploded }) {
  const meshRef = useRef();
  const explodeProgress = useRef(0);

  const { geometry, material } = useMemo(() => {
    const numLines = 65000; // 130,000 vertices, creating a massive web
    const geo = new THREE.BufferGeometry();
    
    const positions = new Float32Array(numLines * 2 * 3);
    const colors = new Float32Array(numLines * 2 * 3);
    const offsets = new Float32Array(numLines * 2 * 3);
    
    const regions = [
      { name: 'Cuerpo Pedunculado', center: [0, 6, -3], radius: 4, color: new THREE.Color('#3b82f6') },
      { name: 'Protocerebro', center: [0, 4, -5], radius: 6, color: new THREE.Color('#06b6d4') },
      { name: 'Cuerpo Central', center: [0, 0, 0], radius: 3, color: new THREE.Color('#2dd4bf') },
      { name: 'Lóbulo Óptico Izquierdo', center: [-10, 0, 0], radius: 7, color: new THREE.Color('#0ea5e9') },
      { name: 'Lóbulo Óptico Derecho', center: [10, 0, 0], radius: 7, color: new THREE.Color('#0ea5e9') },
      { name: 'Lóbulo Antenal', center: [0, -4, 5], radius: 3, color: new THREE.Color('#6366f1') },
      { name: 'Ganglio Subesofágico', center: [0, -8, 0], radius: 4, color: new THREE.Color('#8b5cf6') }
    ];

    let idx = 0;
    for (let i = 0; i < numLines; i++) {
      // Pick region
      const r = Math.random();
      let regionIdx;
      if (r < 0.3) regionIdx = 3; 
      else if (r < 0.6) regionIdx = 4; 
      else if (r < 0.7) regionIdx = 1; 
      else if (r < 0.8) regionIdx = 0; 
      else if (r < 0.85) regionIdx = 2; 
      else if (r < 0.92) regionIdx = 5; 
      else regionIdx = 6; 
      
      const region = regions[regionIdx];
      
      // Node A
      const u1 = Math.random(), v1 = Math.random();
      const phi1 = Math.acos(2.0 * v1 - 1.0);
      const theta1 = u1 * 2.0 * Math.PI;
      const rad1 = Math.cbrt(Math.random()) * region.radius;
      const ax = region.center[0] + rad1 * Math.sin(phi1) * Math.cos(theta1);
      const ay = region.center[1] + rad1 * Math.sin(phi1) * Math.sin(theta1);
      const az = region.center[2] + rad1 * Math.cos(phi1);

      // Node B (nearby to form a web, or spanning to center)
      const ax2 = ax + (Math.random() - 0.5) * 3.0;
      const ay2 = ay + (Math.random() - 0.5) * 3.0;
      const az2 = az + (Math.random() - 0.5) * 3.0;

      const offset = getRegionOffset(region.name);

      positions[idx * 3] = ax;
      positions[idx * 3 + 1] = ay;
      positions[idx * 3 + 2] = az;
      offsets[idx * 3] = offset.x;
      offsets[idx * 3 + 1] = offset.y;
      offsets[idx * 3 + 2] = offset.z;
      
      colors[idx * 3] = region.color.r;
      colors[idx * 3 + 1] = region.color.g;
      colors[idx * 3 + 2] = region.color.b;
      idx++;

      positions[idx * 3] = ax2;
      positions[idx * 3 + 1] = ay2;
      positions[idx * 3 + 2] = az2;
      offsets[idx * 3] = offset.x;
      offsets[idx * 3 + 1] = offset.y;
      offsets[idx * 3 + 2] = offset.z;

      colors[idx * 3] = region.color.r * 0.5;
      colors[idx * 3 + 1] = region.color.g * 0.5;
      colors[idx * 3 + 2] = region.color.b * 0.5;
      idx++;
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const mat = new THREE.ShaderMaterial({
      vertexShader: `
        uniform float uExplodeProgress;
        attribute vec3 aOffset;
        attribute vec3 color;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec3 targetPos = position + aOffset;
          vec3 finalPos = mix(position, targetPos, uExplodeProgress);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          gl_FragColor = vec4(vColor, 0.08); // Very faint delicate web
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    return { geometry: geo, material: mat };
  }, []);

  useFrame((state, delta) => {
    if (!isVisible || !meshRef.current) return;
    
    const targetProgress = isExploded ? 1 : 0;
    explodeProgress.current += (targetProgress - explodeProgress.current) * (delta * 5.0);
    meshRef.current.material.uniforms = { uExplodeProgress: { value: explodeProgress.current } };
    
    // Slow majestic rotation of the entire web
    meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
  });

  if (!isVisible) return null;

  return (
    <lineSegments ref={meshRef} geometry={geometry} material={material} />
  );
}
