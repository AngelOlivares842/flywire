import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { NEURON_TYPE_COLORS } from '../data/neurons.js';
import { getRegionOffset } from '../utils/layout.js';

export default function NeuronNode({ 
  neuron, 
  isSelected, 
  isActivated,
  isVisible = true,
  isExploded = false,
  onSelect,
  onFocus
}) {
  const groupRef = useRef();
  const meshRef = useRef();
  const haloRef = useRef();
  const materialRef = useRef();
  const ringRef = useRef();
  
  const [hovered, setHovered] = useState(false);
  const activationTime = useRef(0);
  const wasActivated = useRef(false);

  const baseColor = useMemo(() => new THREE.Color(NEURON_TYPE_COLORS[neuron.type] || '#ffffff'), [neuron.type]);
  const highlightColor = useMemo(() => new THREE.Color('#ffffff'), []);
  
  const basePos = useMemo(() => new THREE.Vector3(...neuron.position), [neuron]);
  const regionOffset = useMemo(() => getRegionOffset(neuron.region), [neuron.region]);
  const currentPos = useRef(basePos.clone());

  if (isActivated && !wasActivated.current) {
    activationTime.current = performance.now() / 1000;
    wasActivated.current = true;
  } else if (!isActivated) {
    wasActivated.current = false;
  }

  useFrame((state) => {
    if (!groupRef.current || !meshRef.current || !materialRef.current) return;

    const t = state.clock.getElapsedTime();
    const timeSinceActivation = t - activationTime.current;

    // Exploded View Position Interpolation
    const targetPos = isExploded ? basePos.clone().add(regionOffset) : basePos;
    currentPos.current.lerp(targetPos, 0.08); // Slightly faster snap
    
    // Apply position WITHOUT organic float so it's easy to click
    groupRef.current.position.copy(currentPos.current);

    // Scale & Glow Effects
    let currentScale = 1;
    let emissiveIntensity = 0.8;
    const pulse = Math.sin(t * 3 + parseInt(neuron.id.slice(-4))) * 0.1;

    if (isActivated && timeSinceActivation < 1.0) {
      const progress = timeSinceActivation / 1.0; 
      emissiveIntensity = THREE.MathUtils.lerp(2.5, 0.8, progress);
      if (progress < 0.2) {
        currentScale = THREE.MathUtils.lerp(1, 1.8, progress / 0.2);
      } else {
        currentScale = THREE.MathUtils.lerp(1.8, 1, (progress - 0.2) / 0.8);
      }
    } else if (isSelected) {
      currentScale = 1.4 + pulse;
      emissiveIntensity = 1.5;
    } else if (hovered) {
      currentScale = 1.3;
      emissiveIntensity = 1.2;
    } else {
      currentScale = 1.0 + pulse * 0.5;
    }

    meshRef.current.scale.setScalar(currentScale);
    if (haloRef.current) {
      haloRef.current.scale.setScalar(currentScale * 1.5 + pulse);
    }
    
    materialRef.current.color.lerp(hovered || isSelected ? highlightColor : baseColor, 0.1);
    materialRef.current.emissive.copy(baseColor);
    materialRef.current.emissiveIntensity = emissiveIntensity;

    if (ringRef.current) {
      ringRef.current.visible = isSelected;
      if (isSelected) {
        ringRef.current.rotation.x = t * 1.5;
        ringRef.current.rotation.y = t * 1.2;
      }
    }
  });

  if (!isVisible) return null;

  return (
    <group ref={groupRef}>
      {/* Invisible Hitbox (Massive click target) */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onSelect(neuron); }}
        onDoubleClick={(e) => { e.stopPropagation(); onFocus(neuron); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'default'; }}
      >
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>

      {/* Halo Effect */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshBasicMaterial 
          color={baseColor} 
          transparent 
          opacity={hovered || isSelected ? 0.3 : 0.1} 
          blending={THREE.AdditiveBlending} 
          depthWrite={false} 
        />
      </mesh>

      {/* Core Node (Realistic Glass Material) */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshPhysicalMaterial
          ref={materialRef}
          transparent
          opacity={1}
          transmission={0.8}
          roughness={0.15}
          metalness={0.1}
          thickness={1.5}
          ior={1.5}
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={0.2}
          clearcoat={1}
          clearcoatRoughness={0.1}
          toneMapped={false}
        />
      </mesh>

      {/* Selection Ring */}
      <mesh ref={ringRef} visible={false}>
        <torusGeometry args={[0.4, 0.02, 16, 64]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.8} toneMapped={false} />
      </mesh>

      {/* High-quality UI Overlay */}
      {(hovered || isSelected) && (
        <Html center distanceFactor={15} zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }} wrapperClass="pointer-events-none">
          <div className="bg-slate-900/85 backdrop-blur-md px-4 py-2 rounded-xl border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.4)] text-center pointer-events-none transform transition-all duration-300 scale-100 animate-fade-in w-max">
            <p className="text-white font-extrabold text-sm drop-shadow-lg tracking-wide">{neuron.type}</p>
            <p className="text-cyan-300 text-xs mt-0.5 font-medium">{neuron.region}</p>
          </div>
        </Html>
      )}
    </group>
  );
}
