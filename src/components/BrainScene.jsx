import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

import RealisticFly from './RealisticFly.jsx';
import NeuronCloud from './NeuronCloud.jsx';
import NeuronMorphology from './NeuronMorphology.jsx';
import SynapseNetwork from './SynapseNetwork.jsx';
import ParticleField from './ParticleField.jsx';
import NeuralPulse from './NeuralPulse.jsx';

export default function BrainScene({
  neurons = [],
  synapses = [],
  morphologies = {},
  selectedNeuron = null,
  onSelectNeuron,
  onFocusNeuron,
  activatedNeurons = new Set(),
  signalPulses = [],
  onPulseComplete,
  activeStimulus = null,
  visibleTypes = new Set(),
  cameraTarget = null,
  bodyMode = 'silhouette', // 'silhouette' | 'translucent' | 'none'
  neuronScale = 1.0,
  isExploded = false,
}) {
  const controlsRef = useRef();
  const { camera } = useThree();

  const introPlayed = useRef(false);
  const introTime = useRef(0);
  const activeCameraTarget = useRef(null);

  // Set of neuron IDs that have full SWC morphology data
  const morphologyIds = useMemo(() => {
    return new Set(Object.keys(morphologies));
  }, [morphologies]);

  const neuronLookup = useMemo(() => {
    const map = new Map();
    neurons.forEach(n => {
      map.set(n.id, { position: n.position, type: n.type, region: n.region });
    });
    return map;
  }, [neurons]);

  // Update target when cameraTarget prop changes
  useEffect(() => {
    if (cameraTarget) {
      activeCameraTarget.current = new THREE.Vector3(...cameraTarget);
    }
  }, [cameraTarget]);

  useFrame((state, delta) => {
    // Cinematic intro fly-in tailored for 54-unit real connectome
    if (!introPlayed.current) {
      introTime.current += delta;
      const progress = Math.min(introTime.current / 2.0, 1.0);
      const ease = 1 - Math.pow(1 - progress, 3);
      camera.position.lerpVectors(
        new THREE.Vector3(0, 20, 75),
        new THREE.Vector3(0, 10, 46),
        ease
      );
      if (progress >= 1.0) {
        introPlayed.current = true;
      }
    }

    // Smoothly focus on camera target without fighting manual OrbitControls
    if (controlsRef.current && activeCameraTarget.current) {
      controlsRef.current.target.lerp(activeCameraTarget.current, 0.08);
      controlsRef.current.update();

      if (controlsRef.current.target.distanceTo(activeCameraTarget.current) < 0.1) {
        activeCameraTarget.current = null;
      }
    }
  });

  return (
    <>
      <color attach="background" args={['#020617']} />
      <ambientLight intensity={0.6} />
      <pointLight position={[20, 30, 30]} intensity={1.2} />
      <pointLight position={[-20, -20, -20]} intensity={0.6} color="#0284c7" />

      <Stars radius={90} depth={90} count={3500} factor={3} saturation={0} fade speed={0.6} />

      {/* Elegant Drosophila Anatomical Silhouette / Frame */}
      <RealisticFly
        activityLevel={activatedNeurons.size}
        stimulus={activeStimulus}
        bodyMode={bodyMode}
      />

      {/* Real Synaptic Connectome Network (5,045 Princeton connections, ZERO fake threads) */}
      <SynapseNetwork
        synapses={synapses}
        neurons={neurons}
        selectedNeuron={selectedNeuron}
        visibleTypes={visibleTypes}
        isExploded={isExploded}
      />

      {/* Real Neurons GPU Instanced (2,002 FlyWire somas with spatial breathing room) */}
      <NeuronCloud
        neurons={neurons}
        morphologyIds={morphologyIds}
        selectedNeuronId={selectedNeuron?.id}
        activatedNeurons={activatedNeurons}
        visibleTypes={visibleTypes}
        isExploded={isExploded}
        neuronScale={neuronScale}
        onSelectNeuron={onSelectNeuron}
        onFocusNeuron={onFocusNeuron}
      />

      {/* Real SWC 3D Morphology (Electron-microscopy reconstructed dendritic arbor) */}
      {selectedNeuron && morphologies[selectedNeuron.id] && (
        <NeuronMorphology
          morphologyData={morphologies[selectedNeuron.id]}
          color="#38bdf8"
        />
      )}

      {/* Subtle ambient bio-luminescent dust */}
      <ParticleField count={180} />

      {/* Synaptic Pulses (Stimulus & electric cascades travelling along real connections) */}
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
            duration={pulse.duration || 0.8}
            color={pulse.color || '#22d3ee'}
            onComplete={() => onPulseComplete?.(pulse.id)}
          />
        );
      })}

      {/* Crisp Sci-Fi Post-Processing (Bloom + Vignette) */}
      <EffectComposer disableNormalPass>
        <Bloom
          mipmapBlur
          luminanceThreshold={0.3}
          luminanceSmoothing={0.8}
          intensity={0.6}
        />
        <Vignette eskil={false} offset={0.15} darkness={1.05} />
      </EffectComposer>

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.06}
        minDistance={5}
        maxDistance={120}
        autoRotate={false}
      />
    </>
  );
}
