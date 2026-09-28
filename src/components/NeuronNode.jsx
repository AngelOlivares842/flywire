import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { NEURON_TYPE_COLORS } from '../data/neurons.js';

/**
 * A single neuron rendered as a sphere with hover and selection effects.
 * @param {Object} props
 * @param {Object} props.neuron
 * @param {boolean} props.isSelected
 * @param {Function} props.onSelect
 */
export default function NeuronNode({ neuron, isSelected, onSelect }) {
  const meshRef = useRef();
  const ringRef = useRef();
  const materialRef = useRef();
  const [hovered, setHovered] = useState(false);

  const baseColor = NEURON_TYPE_COLORS[neuron.type] || '#ffffff';
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Idle animation: pulsing
    const time = state.clock.getElapsedTime();
    const pulseScale = 1 + Math.sin(time * 2 + neuron.id.charCodeAt(0)) * 0.05;
    
    // Target scale calculation
    let targetScale = pulseScale;
    if (hovered) targetScale = 1.3;
    if (isSelected) targetScale = 1.2;
    
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    
    // Ring rotation for selected
    if (isSelected && ringRef.current) {
      ringRef.current.rotation.z += delta * 0.5;
      ringRef.current.rotation.x += delta * 0.3;
    }
    
    // Emissive intensity lerp
    if (materialRef.current) {
      const targetEmissive = isSelected ? 0.8 : (hovered ? 0.4 : 0.0);
      materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        materialRef.current.emissiveIntensity, 
        targetEmissive, 
        0.1
      );
    }
  });

  // Cursor handling
  const handlePointerOver = (e) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onSelect(neuron);
  };

  return (
    <group position={neuron.position}>
      <Sphere 
        ref={meshRef} 
        args={[0.18, 32, 32]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <meshStandardMaterial 
          ref={materialRef}
          color={baseColor} 
          emissive={baseColor}
          emissiveIntensity={0}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>

      {isSelected && (
        <mesh ref={ringRef}>
          <torusGeometry args={[0.3, 0.02, 16, 100]} />
          <meshBasicMaterial color={baseColor} transparent opacity={0.6} />
        </mesh>
      )}

      {hovered && !isSelected && (
        <Billboard position={[0, 0.3, 0]}>
          <Text fontSize={0.15} color="white" outlineWidth={0.02} outlineColor="black">
            {neuron.type}
          </Text>
        </Billboard>
      )}
    </group>
  );
}
