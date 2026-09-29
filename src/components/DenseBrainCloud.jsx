import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getRegionOffset } from '../utils/layout.js';

const vertexShader = `
  uniform float uTime;
  uniform float uExplodeProgress;
  attribute vec3 aOffset;
  attribute float aSize;
  attribute vec3 aColor;
  varying vec3 vColor;

  void main() {
    vColor = aColor;
    
    // Apply explode offset
    vec3 targetPos = position + aOffset;
    vec3 finalPos = mix(position, targetPos, uExplodeProgress);
    
    // Add a tiny bit of breathing/wobble
    finalPos.x += sin(uTime * 0.5 + position.y) * 0.2;
    finalPos.y += cos(uTime * 0.3 + position.x) * 0.2;
    
    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    
    // Perspective sizing - much smaller points
    gl_PointSize = aSize * (5.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  
  void main() {
    // Soft circular particle
    vec2 xy = gl_PointCoord.xy - vec2(0.5);
    float ll = length(xy);
    if(ll > 0.5) discard;
    
    // Glow effect (brighter in center, fades out)
    float alpha = pow((0.5 - ll) * 2.0, 1.5);
    
    // Extremely faint, ghostly x-ray look
    gl_FragColor = vec4(vColor * 0.5, alpha * 0.08);
  }
`;

export default function DenseBrainCloud({ isVisible, isExploded }) {
  const shaderRef = useRef();
  const explodeProgress = useRef(0);

  const { geometry, uniforms } = useMemo(() => {
    const numPoints = 130000;
    const geo = new THREE.BufferGeometry();
    
    const positions = new Float32Array(numPoints * 3);
    const offsets = new Float32Array(numPoints * 3);
    const colors = new Float32Array(numPoints * 3);
    const sizes = new Float32Array(numPoints);
    
    const regions = [
      { name: 'Cuerpo Pedunculado', center: [0, 6, -3], radius: 4, color: new THREE.Color('#3b82f6') }, // faint blue
      { name: 'Protocerebro', center: [0, 4, -5], radius: 6, color: new THREE.Color('#06b6d4') }, // cyan
      { name: 'Cuerpo Central', center: [0, 0, 0], radius: 3, color: new THREE.Color('#2dd4bf') }, // teal
      { name: 'Lóbulo Óptico Izquierdo', center: [-10, 0, 0], radius: 7, color: new THREE.Color('#0ea5e9') }, // sky blue
      { name: 'Lóbulo Óptico Derecho', center: [10, 0, 0], radius: 7, color: new THREE.Color('#0ea5e9') }, // sky blue
      { name: 'Lóbulo Antenal', center: [0, -4, 5], radius: 3, color: new THREE.Color('#6366f1') }, // indigo
      { name: 'Ganglio Subesofágico', center: [0, -8, 0], radius: 4, color: new THREE.Color('#8b5cf6') } // violet
    ];

    for (let i = 0; i < numPoints; i++) {
      // Pick a random region based roughly on volume/density
      const r = Math.random();
      let regionIdx;
      if (r < 0.3) regionIdx = 3; // left optic
      else if (r < 0.6) regionIdx = 4; // right optic
      else if (r < 0.7) regionIdx = 1; // protocerebro
      else if (r < 0.8) regionIdx = 0; // mushroom body
      else if (r < 0.85) regionIdx = 2; // central complex
      else if (r < 0.92) regionIdx = 5; // antennal lobe
      else regionIdx = 6; // subesophageal
      
      const region = regions[regionIdx];
      
      // Random point in sphere
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const radius = Math.cbrt(Math.random()) * region.radius;
      
      const px = region.center[0] + radius * Math.sin(phi) * Math.cos(theta);
      const py = region.center[1] + radius * Math.sin(phi) * Math.sin(theta);
      const pz = region.center[2] + radius * Math.cos(phi);
      
      positions[i * 3] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = pz;
      
      const offset = getRegionOffset(region.name);
      offsets[i * 3] = offset.x;
      offsets[i * 3 + 1] = offset.y;
      offsets[i * 3 + 2] = offset.z;
      
      // Add slight color variation
      const c = region.color.clone();
      c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.2);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      
      sizes[i] = Math.random() * 0.8 + 0.2;
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    
    const unifs = {
      uTime: { value: 0 },
      uExplodeProgress: { value: 0 }
    };

    return { geometry: geo, uniforms: unifs };
  }, []);

  useFrame((state, delta) => {
    if (!isVisible || !shaderRef.current) return;
    
    shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    
    // Smooth transition for explode progress
    const targetProgress = isExploded ? 1 : 0;
    explodeProgress.current += (targetProgress - explodeProgress.current) * (delta * 5.0);
    shaderRef.current.uniforms.uExplodeProgress.value = explodeProgress.current;
  });

  if (!isVisible) return null;

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={shaderRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
