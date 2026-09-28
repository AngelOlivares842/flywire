import React, { useMemo } from 'react';
import { OrbitControls, Stars, Sphere } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import NeuronNode from './NeuronNode.jsx';
import SynapticLink from './SynapticLink.jsx';
import { getNeuronById } from '../data/neurons.js';

/**
 * Complete 3D brain scene composition.
 * @param {Object} props
 * @param {Array} props.neurons - list of neurons
 * @param {Array} props.synapses - list of synapses
 * @param {Object|null} props.selectedNeuron - currently selected neuron
 * @param {Function} props.onSelectNeuron - callback when a neuron is selected
 */
export default function BrainScene({ neurons, synapses, selectedNeuron, onSelectNeuron }) {
  // Compute positions lookup for fast synapse rendering
  const neuronPositions = useMemo(() => {
    const lookup = {};
    neurons.forEach(n => {
      lookup[n.id] = n.position;
    });
    return lookup;
  }, [neurons]);

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      
      {selectedNeuron && (
        <pointLight position={selectedNeuron.position} intensity={2} distance={5} color="#ffffff" />
      )}

      <OrbitControls 
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={20}
        autoRotate={!selectedNeuron}
        autoRotateSpeed={0.3}
      />

      <Stars radius={50} depth={50} count={3000} factor={3} fade speed={2} />

      <Sphere args={[1, 32, 32]} scale={[8, 4, 5]} position={[0, 0, 0]}>
        <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.03} />
      </Sphere>

      <group>
        {neurons.map(neuron => (
          <NeuronNode 
            key={neuron.id}
            neuron={neuron}
            isSelected={selectedNeuron?.id === neuron.id}
            onSelect={onSelectNeuron}
          />
        ))}

        {synapses.map((synapse, index) => {
          const start = neuronPositions[synapse.from];
          const end = neuronPositions[synapse.to];
          
          if (!start || !end) return null;

          const isActive = selectedNeuron && (synapse.from === selectedNeuron.id || synapse.to === selectedNeuron.id);

          return (
            <SynapticLink 
              key={`synapse-${index}`}
              start={start}
              end={end}
              isActive={isActive}
              weight={synapse.weight || 0.5}
            />
          );
        })}
      </group>

      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.3} 
          luminanceSmoothing={0.9} 
          intensity={0.5} 
        />
        <Vignette 
          offset={0.5} 
          darkness={0.5} 
        />
      </EffectComposer>
    </>
  );
}
