import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { NT_COLORS } from '../utils/neuronColors.js';

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

export default function NeuronCloud({
  neurons = [],
  morphologyIds = new Set(),
  selectedNeuronId = null,
  activatedNeurons = new Set(),
  visibleTypes = new Set(),
  isExploded = false,
  neuronScale = 1.0,
  onSelectNeuron,
  onFocusNeuron,
}) {
  const meshRef = useRef();
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Filter only visible neurons
  const visible = useMemo(() => {
    if (!visibleTypes || visibleTypes.size === 0) return neurons;
    return neurons.filter(n => visibleTypes.has(n.type));
  }, [neurons, visibleTypes]);

  const count = visible.length;

  // Region offsets for exploded view
  const regionOffsets = useMemo(() => ({
    'Cuerpo Pedunculado': [0, 25, 0],
    'Protocerebro': [0, 12, 0],
    'Cuerpo Central': [0, 0, 0],
    'Lóbulo Óptico': [0, 0, 0],
    'Lóbulo Antenal': [0, -12, 0],
    'Ganglio Subesofágico': [0, -25, 0],
    'Centro Mecanosensorial': [0, -18, 10],
  }), []);

  // Update all instances when dataset, visibility, or exploded state changes
  const updateAllInstances = useCallback(() => {
    if (!meshRef.current || count === 0) return;

    for (let i = 0; i < count; i++) {
      const n = visible[i];
      let px = n.position[0], py = n.position[1], pz = n.position[2];
      if (isExploded) {
        const off = regionOffsets[n.region] || [0, 0, 0];
        px += off[0]; py += off[1]; pz += off[2];
      }
      _dummy.position.set(px, py, pz);

      const hasMorph = morphologyIds.has(n.id);
      const isSelected = n.id === selectedNeuronId;
      const isActivated = activatedNeurons.has(n.id);
      const isHovered = i === hoveredIdx;

      let baseSize = hasMorph ? 0.32 : 0.22;
      let scale = baseSize * neuronScale;
      if (isSelected) scale = 0.48 * neuronScale;
      else if (isActivated) scale = 0.38 * neuronScale;
      else if (isHovered) scale = 0.35 * neuronScale;

      _dummy.scale.setScalar(scale);
      _dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, _dummy.matrix);

      if (isSelected) {
        _color.set('#ffffff');
      } else if (isActivated) {
        _color.set('#22d3ee');
      } else if (hasMorph) {
        _color.set('#38bdf8'); // High-detail morphology soma highlight
      } else {
        _color.set(NT_COLORS[n.type] || '#64748b');
      }
      meshRef.current.setColorAt(i, _color);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [visible, count, isExploded, regionOffsets, morphologyIds, selectedNeuronId, activatedNeurons, hoveredIdx]);

  useEffect(() => {
    updateAllInstances();
  }, [updateAllInstances]);

  // Dynamic animation loop: gently pulse selected and activated neurons
  useFrame((state) => {
    if (!meshRef.current || count === 0) return;
    const t = state.clock.getElapsedTime();

    let needsMatrixUpdate = false;

    // Pulse selected neuron
    if (selectedNeuronId) {
      const selIdx = visible.findIndex(n => n.id === selectedNeuronId);
      if (selIdx !== -1) {
        const n = visible[selIdx];
        let px = n.position[0], py = n.position[1], pz = n.position[2];
        if (isExploded) {
          const off = regionOffsets[n.region] || [0, 0, 0];
          px += off[0]; py += off[1]; pz += off[2];
        }
        _dummy.position.set(px, py, pz);
        const pulseScale = 0.45 + Math.sin(t * 5) * 0.08;
        _dummy.scale.setScalar(pulseScale);
        _dummy.updateMatrix();
        meshRef.current.setMatrixAt(selIdx, _dummy.matrix);
        needsMatrixUpdate = true;
      }
    }

    if (needsMatrixUpdate) {
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (e.instanceId !== undefined && visible[e.instanceId]) {
      onSelectNeuron?.(visible[e.instanceId]);
    }
  }, [visible, onSelectNeuron]);

  const handleDblClick = useCallback((e) => {
    e.stopPropagation();
    if (e.instanceId !== undefined && visible[e.instanceId]) {
      onFocusNeuron?.(visible[e.instanceId]);
    }
  }, [visible, onFocusNeuron]);

  const handlePointerMove = useCallback((e) => {
    e.stopPropagation();
    if (e.instanceId !== undefined && e.instanceId !== hoveredIdx) {
      setHoveredIdx(e.instanceId);
      document.body.style.cursor = 'pointer';
    }
  }, [hoveredIdx]);

  const handlePointerOut = useCallback(() => {
    setHoveredIdx(null);
    document.body.style.cursor = 'default';
  }, []);

  const hoveredNeuron = hoveredIdx !== null && visible[hoveredIdx] ? visible[hoveredIdx] : null;

  if (count === 0) return null;

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, count]}
        onClick={handleClick}
        onDoubleClick={handleDblClick}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial toneMapped={false} transparent opacity={0.95} />
      </instancedMesh>

      {hoveredNeuron && (
        <Html
          position={hoveredNeuron.position}
          center
          distanceFactor={18}
          zIndexRange={[100, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.4)] text-center pointer-events-none animate-fade-in w-max">
            <div className="flex items-center justify-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: NT_COLORS[hoveredNeuron.type] || '#38bdf8' }}></span>
              <p className="text-white font-bold text-sm tracking-wide">
                {hoveredNeuron.label || hoveredNeuron.cellType || `Neurona #${hoveredNeuron.id.slice(-6)}`}
              </p>
            </div>
            <p className="text-cyan-300 text-xs mt-1 font-medium">{hoveredNeuron.region}</p>
            <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-400 mt-1">
              <span>{hoveredNeuron.neurotransmitter}</span>
              {morphologyIds.has(hoveredNeuron.id) && (
                <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50 font-semibold text-[10px]">
                  ⭐ SWC 3D
                </span>
              )}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
