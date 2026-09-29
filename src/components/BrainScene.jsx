import React, { useRef, useMemo, useEffect, useState } from 'react';
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
import ArenaBox from './ArenaBox.jsx';

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
  bodyMode = 'silhouette',
  neuronScale = 1.0,
  isExploded = false,
  viewMode = 'microscope', // 'microscope' | 'arena'
  connectomeEngine = null,
  flyPhysics = null,
  onTelemetry = null,
}) {
  const controlsRef = useRef();
  const flyGroupRef = useRef();
  const { camera } = useThree();

  const introPlayed = useRef(false);
  const introTime = useRef(0);
  const activeCameraTarget = useRef(null);

  // Flight trajectory trail for Arena Mode
  const [flyTrail, setFlyTrail] = useState([]);
  const trailInterval = useRef(0);

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

  // Adjust camera distance when switching between Microscope and Arena mode
  useEffect(() => {
    if (controlsRef.current) {
      if (viewMode === 'arena') {
        camera.position.set(0, 55, 115);
        controlsRef.current.target.set(0, 0, 0);
      } else {
        camera.position.set(0, 10, 46);
        controlsRef.current.target.set(0, 0, 0);
      }
      controlsRef.current.update();
    }
  }, [viewMode, camera]);

  useFrame((state, delta) => {
    const dt = Math.min(0.04, delta);

    // ── ARENA FLIGHT SIMULATION LOOP (Driven by Real Connectome) ──
    if (viewMode === 'arena' && connectomeEngine && flyPhysics) {
      // 1. Compute bilateral photon flux / odor reaching the eyes & antennae
      const sensory = flyPhysics.computeSensoryFlux();

      // 2. Inject sensory currents into real FlyWire sensory neurons
      connectomeEngine.injectSensoryInputs(sensory);

      // 3. Integrate 2,002 neurons over 5,045 real synapses (biophysical step)
      const motor = connectomeEngine.step(dt);

      // 4. Kinematics: FlyPhysics updates position and heading based on motor outputs
      flyPhysics.update(motor, dt);

      // 5. Update 3D Fly Entity Transform
      if (flyGroupRef.current) {
        flyGroupRef.current.position.set(...flyPhysics.position);
        flyGroupRef.current.rotation.set(flyPhysics.pitch, flyPhysics.yaw, flyPhysics.roll);
      }

      // Record trajectory trail every 6 frames
      trailInterval.current++;
      if (trailInterval.current % 5 === 0) {
        setFlyTrail(prev => {
          const next = [...prev, [...flyPhysics.position]];
          return next.slice(-60); // Keep last 60 trajectory points
        });
      }

      // Stream real-time telemetry to HUD
      if (onTelemetry) {
        onTelemetry({
          speed: flyPhysics.speed.toFixed(1),
          heading: ((flyPhysics.yaw * 180 / Math.PI) % 360 + 360) % 360,
          activeNeurons: motor.activeNeuronCount,
          wingHz: Math.round(motor.wingFrequency),
          leftMotor: (motor.avgLeftMotor * 100).toFixed(0),
          rightMotor: (motor.avgRightMotor * 100).toFixed(0),
        });
      }
    } else {
      // Reset position in microscope mode
      if (flyGroupRef.current) {
        flyGroupRef.current.position.set(0, 0, 0);
        flyGroupRef.current.rotation.set(0, 0, 0);
      }
    }

    // Cinematic intro fly-in for initial load
    if (!introPlayed.current) {
      introTime.current += delta;
      const progress = Math.min(introTime.current / 2.0, 1.0);
      const ease = 1 - Math.pow(1 - progress, 3);
      camera.position.lerpVectors(
        new THREE.Vector3(0, 25, 80),
        new THREE.Vector3(0, 10, 46),
        ease
      );
      if (progress >= 1.0) {
        introPlayed.current = true;
      }
    }

    // Camera target smooth panning
    if (controlsRef.current && activeCameraTarget.current) {
      controlsRef.current.target.lerp(activeCameraTarget.current, 0.08);
      controlsRef.current.update();

      if (controlsRef.current.target.distanceTo(activeCameraTarget.current) < 0.1) {
        activeCameraTarget.current = null;
      }
    }
  });

  // Scale fly entity to fit naturally inside the arena box during flight mode
  const flyEntityScale = viewMode === 'arena' ? [0.28, 0.28, 0.28] : [1, 1, 1];

  return (
    <>
      <color attach="background" args={['#020617']} />
      <ambientLight intensity={0.65} />
      <pointLight position={[30, 40, 40]} intensity={1.2} />
      <pointLight position={[-30, -20, -30]} intensity={0.5} color="#0284c7" />

      <Stars radius={140} depth={100} count={3500} factor={3} saturation={0} fade speed={0.5} />

      {/* ── 3D Bounded Arena Box (Active in Arena Flight Mode) ── */}
      <ArenaBox
        bounds={flyPhysics ? flyPhysics.bounds : { x: 80, y: 45, z: 80 }}
        stimulus={flyPhysics ? flyPhysics.stimulus : null}
        isVisible={viewMode === 'arena'}
        flyTrail={flyTrail}
      />

      {/* ── Fly Entity (Houses both the anatomical body and the real brain) ── */}
      <group ref={flyGroupRef} scale={flyEntityScale}>
        {/* Anatomical Fly Silhouette / Framework */}
        <RealisticFly
          activityLevel={activatedNeurons.size}
          stimulus={activeStimulus}
          bodyMode={bodyMode}
        />

        {/* Real Synaptic Connectome Network (5,045 Princeton synapses) */}
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

        {/* Real SWC 3D Morphology (Tree arborization rendered for selected neuron) */}
        {selectedNeuron && morphologies[selectedNeuron.id] && (
          <NeuronMorphology
            morphologyData={morphologies[selectedNeuron.id]}
            color="#38bdf8"
          />
        )}

        {/* Synaptic Pulses (Stimulus / electric cascades along real synapses) */}
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
      </group>

      {/* Ambient neural dust */}
      <ParticleField count={150} />

      {/* Post-Processing */}
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
        maxDistance={viewMode === 'arena' ? 260 : 120}
        autoRotate={false}
      />
    </>
  );
}
