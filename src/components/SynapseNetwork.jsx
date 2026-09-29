import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NT_COLORS } from '../utils/neuronColors.js';

/**
 * Renders all real connectome synapses using a single, ultra-performant THREE.LineSegments.
 * Highlights synapses connected to the selected neuron.
 */
export default function SynapseNetwork({
  synapses = [],
  neurons = [],
  selectedNeuron = null,
  visibleTypes = new Set(),
  isExploded = false,
}) {
  const linesRef = useRef();
  const highlightRef = useRef();

  // Fast map of neuron ID to position and type
  const neuronMap = useMemo(() => {
    const map = new Map();
    neurons.forEach(n => {
      map.set(n.id, n);
    });
    return map;
  }, [neurons]);

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

  // Build base synapse geometry (all visible synapses)
  const { baseGeometry, baseCount } = useMemo(() => {
    if (!synapses.length || !neuronMap.size) return { baseGeometry: null, baseCount: 0 };

    const positions = [];
    const colors = [];
    const _c1 = new THREE.Color();
    const _c2 = new THREE.Color();

    for (let i = 0; i < synapses.length; i++) {
      const syn = synapses[i];
      const fromNode = neuronMap.get(syn.from);
      const toNode = neuronMap.get(syn.to);

      if (!fromNode || !toNode) continue;
      if (visibleTypes.size > 0 && (!visibleTypes.has(fromNode.type) || !visibleTypes.has(toNode.type))) {
        continue;
      }

      let fx = fromNode.position[0], fy = fromNode.position[1], fz = fromNode.position[2];
      let tx = toNode.position[0], ty = toNode.position[1], tz = toNode.position[2];

      if (isExploded) {
        const offFrom = regionOffsets[fromNode.region] || [0, 0, 0];
        const offTo = regionOffsets[toNode.region] || [0, 0, 0];
        fx += offFrom[0]; fy += offFrom[1]; fz += offFrom[2];
        tx += offTo[0]; ty += offTo[1]; tz += offTo[2];
      }

      positions.push(fx, fy, fz, tx, ty, tz);

      _c1.set(NT_COLORS[fromNode.type] || '#38bdf8');
      _c2.set(NT_COLORS[toNode.type] || '#818cf8');

      colors.push(_c1.r, _c1.g, _c1.b, _c2.r, _c2.g, _c2.b);
    }

    if (positions.length === 0) return { baseGeometry: null, baseCount: 0 };

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    return { baseGeometry: geo, baseCount: positions.length / 6 };
  }, [synapses, neuronMap, visibleTypes, isExploded, regionOffsets]);

  // Build highlighted geometry for connections of selected neuron
  const highlightGeometry = useMemo(() => {
    if (!selectedNeuron || !synapses.length) return null;

    const selId = selectedNeuron.id;
    const positions = [];
    const colors = [];
    const _c = new THREE.Color();

    for (let i = 0; i < synapses.length; i++) {
      const syn = synapses[i];
      if (syn.from !== selId && syn.to !== selId) continue;

      const fromNode = neuronMap.get(syn.from);
      const toNode = neuronMap.get(syn.to);
      if (!fromNode || !toNode) continue;

      let fx = fromNode.position[0], fy = fromNode.position[1], fz = fromNode.position[2];
      let tx = toNode.position[0], ty = toNode.position[1], tz = toNode.position[2];

      if (isExploded) {
        const offFrom = regionOffsets[fromNode.region] || [0, 0, 0];
        const offTo = regionOffsets[toNode.region] || [0, 0, 0];
        fx += offFrom[0]; fy += offFrom[1]; fz += offFrom[2];
        tx += offTo[0]; ty += offTo[1]; tz += offTo[2];
      }

      positions.push(fx, fy, fz, tx, ty, tz);

      // Outgoing: Cyan -> target NT color; Incoming: Amber -> selected
      if (syn.from === selId) {
        _c.set('#22d3ee');
        colors.push(_c.r, _c.g, _c.b);
        _c.set(NT_COLORS[toNode.type] || '#38bdf8');
        colors.push(_c.r, _c.g, _c.b);
      } else {
        _c.set('#f59e0b');
        colors.push(_c.r, _c.g, _c.b);
        _c.set('#22d3ee');
        colors.push(_c.r, _c.g, _c.b);
      }
    }

    if (positions.length === 0) return null;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, [selectedNeuron, synapses, neuronMap, isExploded, regionOffsets]);

  // Subtle breathing pulse for highlighted lines
  useFrame((state) => {
    if (highlightRef.current) {
      const t = state.clock.getElapsedTime();
      highlightRef.current.material.opacity = 0.7 + Math.sin(t * 4) * 0.25;
    }
  });

  return (
    <group>
      {/* Background Synaptic Network (faint, subtle, non-intrusive) */}
      {baseGeometry && (
        <lineSegments ref={linesRef} geometry={baseGeometry}>
          <lineBasicMaterial
            vertexColors
            transparent
            opacity={selectedNeuron ? 0.08 : 0.16}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </lineSegments>
      )}

      {/* Highlighted Synaptic Pathways for Selected Neuron */}
      {highlightGeometry && (
        <group>
          <lineSegments ref={highlightRef} geometry={highlightGeometry}>
            <lineBasicMaterial
              vertexColors
              transparent
              opacity={0.85}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </lineSegments>
          {/* Subtle outer glow layer */}
          <lineSegments geometry={highlightGeometry}>
            <lineBasicMaterial
              vertexColors
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </lineSegments>
        </group>
      )}
    </group>
  );
}
