import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function NeuronMorphology({ morphologyData, color = '#06b6d4', isVisible = true }) {
  const groupRef = useRef();
  const progressRef = useRef(0);

  // Build line segments from morphology data
  const { geometry, totalSegments } = useMemo(() => {
    if (!morphologyData || !Array.isArray(morphologyData.points) || !Array.isArray(morphologyData.parents)) {
      return { geometry: null, totalSegments: 0 };
    }

    const { points, parents } = morphologyData;
    const segments = [];

    for (let i = 0; i < points.length; i++) {
      const pIdx = parents[i];
      if (pIdx < 0 || pIdx >= points.length) continue;
      
      const p1 = points[pIdx];
      const p2 = points[i];
      
      if (!p1 || !p2 || p1.length < 3 || p2.length < 3) continue;

      segments.push({
        start: [p1[0], p1[1], p1[2]],
        end: [p2[0], p2[1], p2[2]],
      });
    }

    if (segments.length === 0) return { geometry: null, totalSegments: 0 };

    const positions = new Float32Array(segments.length * 2 * 3);
    for (let i = 0; i < segments.length; i++) {
      const s = segments[i];
      positions[i * 6 + 0] = s.start[0];
      positions[i * 6 + 1] = s.start[1];
      positions[i * 6 + 2] = s.start[2];
      positions[i * 6 + 3] = s.end[0];
      positions[i * 6 + 4] = s.end[1];
      positions[i * 6 + 5] = s.end[2];
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return { geometry: geo, totalSegments: segments.length };
  }, [morphologyData]);

  // Animate growth
  useFrame((state, delta) => {
    if (!groupRef.current || !geometry) return;

    if (progressRef.current < 1) {
      progressRef.current = Math.min(1, progressRef.current + delta * 0.8);
      const visibleCount = Math.floor(progressRef.current * totalSegments) * 2;
      geometry.setDrawRange(0, visibleCount);
    }
  });

  // Reset progress when morphology changes
  useEffect(() => {
    progressRef.current = 0;
  }, [morphologyData]);

  if (!isVisible || !geometry) return null;

  return (
    <group ref={groupRef}>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.7}
          linewidth={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>

      {/* Glow layer */}
      <lineSegments geometry={geometry}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.2}
          linewidth={3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}
