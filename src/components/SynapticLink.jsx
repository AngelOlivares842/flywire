import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const getRegionOffset = (region) => {
  switch (region) {
    case 'Lóbulo Óptico Izquierdo': return new THREE.Vector3(-15, 0, 0);
    case 'Lóbulo Óptico Derecho': return new THREE.Vector3(15, 0, 0);
    case 'Lóbulo Antenal': return new THREE.Vector3(0, -5, 10);
    case 'Cuerpo Central': return new THREE.Vector3(0, 10, 0);
    case 'Cuerpo Pedunculado': return new THREE.Vector3(0, 12, -8);
    case 'Protocerebro': return new THREE.Vector3(0, 8, -12);
    case 'Ganglio Subesofágico': return new THREE.Vector3(0, -10, 0);
    default: return new THREE.Vector3(0, 0, 0);
  }
};

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

  useFrame((state, delta) => {
    if (!lineRef.current) return;
    
    // Animate positions for explode view
    const targetS = isExploded ? baseStart.clone().add(offsetStart) : baseStart;
    const targetE = isExploded ? baseEnd.clone().add(offsetEnd) : baseEnd;
    
    currentStart.current.lerp(targetS, 0.05);
    currentEnd.current.lerp(targetE, 0.05);

    // Build curve
    const mid = currentStart.current.clone().lerp(currentEnd.current, 0.5);
    const dist = currentStart.current.distanceTo(currentEnd.current);
    mid.y += dist * 0.25;
    
    const curve = new THREE.QuadraticBezierCurve3(
      currentStart.current,
      mid,
      currentEnd.current
    );
    
    const points = curve.getPoints(19);
    const positions = lineRef.current.geometry.attributes.position.array;
    for (let i = 0; i < 20; i++) {
      positions[i * 3] = points[i].x;
      positions[i * 3 + 1] = points[i].y;
      positions[i * 3 + 2] = points[i].z;
    }
    lineRef.current.geometry.attributes.position.needsUpdate = true;
    
    // Animate dash
    if (materialRef.current) {
      if (isActive || isHighlighted) {
        materialRef.current.dashOffset -= delta * (isActive ? 4.0 : 1.5);
      } else {
        materialRef.current.dashOffset -= delta * 0.2;
      }
    }
  });

  if (!visible) return null;

  const color = isHighlighted ? '#22d3ee' : (isActive ? '#f472b6' : '#3b82f6');
  const opacity = isHighlighted ? 1 : (isActive ? 0.9 : 0.15);

  return (
    <line ref={lineRef} geometry={geometry}>
      <lineDashedMaterial
        ref={materialRef}
        color={color}
        linewidth={1}
        transparent
        opacity={opacity}
        dashSize={0.5}
        gapSize={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </line>
  );
}
