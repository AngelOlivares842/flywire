import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getRegionOffset } from '../utils/layout.js';

export default function SynapticLink({ 
  sourceNode, 
  targetNode, 
  isActive, 
  isHighlighted, 
  weight = 1, 
  visible = true,
  isExploded = false
}) {
  const lineRef = useRef();
  const materialRef = useRef();
  
  const baseStart = useMemo(() => new THREE.Vector3(...sourceNode.position), [sourceNode]);
  const baseEnd = useMemo(() => new THREE.Vector3(...targetNode.position), [targetNode]);
  
  const offsetStart = useMemo(() => getRegionOffset(sourceNode.region), [sourceNode.region]);
  const offsetEnd = useMemo(() => getRegionOffset(targetNode.region), [targetNode.region]);

  const currentStart = useRef(baseStart.clone());
  const currentEnd = useRef(baseEnd.clone());

  // Create a stable buffer geometry with 20 points for a curve
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(20 * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  const curveRef = useRef(new THREE.QuadraticBezierCurve3());
  const midRef = useRef(new THREE.Vector3());
  const needsGeomUpdate = useRef(true);

  const targetSRef = useRef(new THREE.Vector3());
  const targetERef = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    if (!lineRef.current) return;
    
    // Animate positions for explode view
    if (isExploded) {
      targetSRef.current.copy(baseStart).add(offsetStart);
      targetERef.current.copy(baseEnd).add(offsetEnd);
    } else {
      targetSRef.current.copy(baseStart);
      targetERef.current.copy(baseEnd);
    }
    
    const targetS = targetSRef.current;
    const targetE = targetERef.current;
    
    const distS = currentStart.current.distanceToSquared(targetS);
    const distE = currentEnd.current.distanceToSquared(targetE);

    if (distS > 0.001 || distE > 0.001) {
      currentStart.current.lerp(targetS, 0.08);
      currentEnd.current.lerp(targetE, 0.08);
      needsGeomUpdate.current = true;
    } else if (needsGeomUpdate.current) {
      currentStart.current.copy(targetS);
      currentEnd.current.copy(targetE);
      needsGeomUpdate.current = true;
    }

    if (needsGeomUpdate.current) {
      // Build curve without allocating new objects if possible
      midRef.current.copy(currentStart.current).lerp(currentEnd.current, 0.5);
      const dist = currentStart.current.distanceTo(currentEnd.current);
      midRef.current.y += dist * 0.25;
      
      curveRef.current.v0.copy(currentStart.current);
      curveRef.current.v1.copy(midRef.current);
      curveRef.current.v2.copy(currentEnd.current);
      
      const points = curveRef.current.getPoints(19);
      const positions = lineRef.current.geometry.attributes.position.array;
      for (let i = 0; i < 20; i++) {
        positions[i * 3] = points[i].x;
        positions[i * 3 + 1] = points[i].y;
        positions[i * 3 + 2] = points[i].z;
      }
      lineRef.current.geometry.attributes.position.needsUpdate = true;
      
      if (distS <= 0.001 && distE <= 0.001) {
        needsGeomUpdate.current = false;
      }
    }
    
    // Animate opacity based on active state
    if (materialRef.current) {
      if (isActive || isHighlighted) {
        materialRef.current.opacity = 1;
      } else {
        materialRef.current.opacity = 0.15;
      }
    }
  });

  if (!visible) return null;

  const color = isHighlighted ? '#22d3ee' : (isActive ? '#f472b6' : '#3b82f6');

  return (
    <line ref={lineRef} geometry={geometry}>
      <lineBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={0.15}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </line>
  );
}
