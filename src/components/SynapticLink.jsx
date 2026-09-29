import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';

export default function SynapticLink({ 
  start, 
  end, 
  isActive, 
  isHighlighted, 
  weight = 1, 
  visible = true 
}) {
  const lineRef = useRef();
  
  const { vStart, vEnd, vMid, distance } = useMemo(() => {
    const s = new THREE.Vector3(start[0], start[1], start[2]);
    const e = new THREE.Vector3(end[0], end[1], end[2]);
    
    // Calculate a control point to create a biological, curved web look
    const m = s.clone().lerp(e, 0.5);
    const dist = s.distanceTo(e);
    
    // Arch the curve outward relative to the distance
    m.y += dist * 0.25;
    m.x += (Math.random() - 0.5) * dist * 0.2;
    m.z += (Math.random() - 0.5) * dist * 0.2;
    
    return { vStart: s, vEnd: e, vMid: m, distance: dist };
  }, [start, end]);

  useFrame((state, delta) => {
    if (!lineRef.current) return;
    
    if (isActive || isHighlighted) {
      if (lineRef.current.material.dashOffset !== undefined) {
        // Fast electric flow when active
        lineRef.current.material.dashOffset -= delta * (isActive ? 3.0 : 1.0);
      }
    } else {
      // Subtle idle flow
      if (lineRef.current.material.dashOffset !== undefined) {
        lineRef.current.material.dashOffset -= delta * 0.1;
      }
    }
  });

  if (!visible) return null;

  const color = isHighlighted ? '#22d3ee' : (isActive ? '#f472b6' : '#3b82f6');
  const lineWidth = isHighlighted ? 4 : (isActive ? 3 : Math.max(1.2, weight * 2.0));
  const opacity = isHighlighted ? 1 : (isActive ? 0.9 : 0.25);

  return (
    <QuadraticBezierLine
      ref={lineRef}
      start={vStart}
      end={vEnd}
      mid={vMid}
      color={color}
      lineWidth={lineWidth}
      transparent
      opacity={opacity}
      dashed={true}
      dashScale={distance * 1.5}
      dashSize={0.5}
      dashOffset={0}
      toneMapped={false}
      blending={THREE.AdditiveBlending}
      depthWrite={false}
    />
  );
}
