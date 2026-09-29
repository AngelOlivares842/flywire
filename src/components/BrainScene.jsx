import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Sphere } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

import NeuronNode from './NeuronNode.jsx';
import SynapticLink from './SynapticLink.jsx';
import DrosophilaModel from './DrosophilaModel.jsx';
import ParticleField from './ParticleField.jsx';
import NeuralPulse from './NeuralPulse.jsx';

export default function BrainScene({
  neurons = [],
  synapses = [],
  selectedNeuron = null,
  onSelectNeuron,
  onFocusNeuron,
  activatedNeurons = new Set(),
  signalPulses = [],
  onPulseComplete,
  visibleTypes = new Set(),
  cameraTarget = null,
  highlightedSynapses = new Set(),
  isXRay = false
}) {
  const controlsRef = useRef();
  const { camera } = useThree();
  
  const introPlayed = useRef(false);
  const introTime = useRef(0);

  useEffect(() => {
    if (!introPlayed.current) {
      camera.position.set(0, 8, 25);
    }
  }, [camera]);

  const neuronLookup = useMemo(() => {
    const map = new Map();
    neurons.forEach(n => {
      map.set(n.id, { position: n.position, type: n.type });
    });
    return map;
  }, [neurons]);

  useFrame((state, delta) => {
    if (!introPlayed.current) {
      introTime.current += delta;
      const progress = Math.min(introTime.current / 2.0, 1.0);
      
      const ease = 1 - Math.pow(1 - progress, 3);
      
      camera.position.lerpVectors(
        new THREE.Vector3(0, 8, 25),
        new THREE.Vector3(0, 2, 10),
        ease
      );
      
      if (progress >= 1.0) {
        introPlayed.current = true;
      }
    }

    if (controlsRef.current) {
      if (cameraTarget) {
        controlsRef.current.target.lerp(new THREE.Vector3(...cameraTarget), 0.05);
      } else {
        controlsRef.current.target.lerp(new THREE.Vector3(0, 0, 0), 0.02);
      }
      controlsRef.current.update();
    }
  });

  return (
    <>
      <color attach="background" args={['#020617']} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      
      <Stars radius={50} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <DrosophilaModel opacity={isXRay ? 0.05 : 1} />
      <ParticleField count={250} />

      <Sphere args={[5, 32, 32]} visible={false}>
        <meshBasicMaterial wireframe color="#1e293b" transparent opacity={0.1} />
      </Sphere>

      {synapses.map((synapse, idx) => {
        const sourceNode = neuronLookup.get(synapse.from);
        const targetNode = neuronLookup.get(synapse.to);
        
        if (!sourceNode || !targetNode) return null;
        
        const isVisible = visibleTypes ? (visibleTypes.has(sourceNode.type) && visibleTypes.has(targetNode.type)) : true;
        const isHighlighted = highlightedSynapses.has(idx);
        const isActive = false; 

        return (
          <SynapticLink
            key={`synapse-${idx}`}
            start={sourceNode.position}
            end={targetNode.position}
            isActive={isActive}
            isHighlighted={isHighlighted}
            weight={synapse.weight}
            visible={isVisible}
          />
        );
      })}

      {neurons.map((neuron) => (
        <NeuronNode
          key={`neuron-${neuron.id}`}
          neuron={neuron}
          isSelected={selectedNeuron && selectedNeuron.id === neuron.id}
          isActivated={activatedNeurons.has(neuron.id)}
          isVisible={visibleTypes ? visibleTypes.has(neuron.type) : true}
          onSelect={onSelectNeuron}
          onFocus={onFocusNeuron}
        />
      ))}

      {signalPulses.map(pulse => {
        const fromNode = neuronLookup.get(pulse.fromId);
        const toNode = neuronLookup.get(pulse.toId);
        
        if (!fromNode || !toNode) return null;
        
        return (
          <NeuralPulse
            key={pulse.id}
            id={pulse.id}
            start={fromNode.position}
            end={toNode.position}
            duration={pulse.duration || 1}
            color={pulse.color || '#22d3ee'}
            onComplete={() => onPulseComplete && onPulseComplete(pulse.id)}
          />
        );
      })}

      <EffectComposer disableNormalPass>
        <Bloom mipmapBlur luminanceThreshold={0.15} luminanceSmoothing={0.8} intensity={2.0} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        autoRotate={!selectedNeuron && introPlayed.current}
        autoRotateSpeed={0.5}
      />
    </>
  );
}
