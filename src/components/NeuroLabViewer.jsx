import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { NEURON_TYPE_COLORS, BRAIN_REGIONS } from '../data/neurons.js';
import { useAIAnalysis } from '../hooks/useAIAnalysis.js';
import { useStimulusSimulation } from '../hooks/useStimulusSimulation.js';
import BrainScene from './BrainScene.jsx';
import HudPanel from './HudPanel.jsx';

export default function NeuroLabViewer() {
  const [neuronsData, setNeuronsData] = useState([]);
  const [synapsesData, setSynapsesData] = useState([]);
  const [morphologiesData, setMorphologiesData] = useState({});
  const [statsData, setStatsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedNeuron, setSelectedNeuron] = useState(null);
  const [hudOpen, setHudOpen] = useState(true);

  const { status: aiStatus, progressText, analysisText } = useAIAnalysis(selectedNeuron);

  const [visibleTypes, setVisibleTypes] = useState(new Set(Object.keys(NEURON_TYPE_COLORS)));

  const [isTouring, setIsTouring] = useState(false);
  const [tourRegion, setTourRegion] = useState('');
  const [cameraTarget, setCameraTarget] = useState(null);
  const tourTimerRef = useRef(null);

  // Body mode: 'silhouette' (clean high-tech outline) | 'translucent' (smoked glass) | 'none' (brain only)
  const [bodyMode, setBodyMode] = useState('silhouette');
  // Neuron size scale: 0.75 (Fino/Delicado) | 1.0 (Normal) | 1.35 (Prominente)
  const [neuronScale, setNeuronScale] = useState(1.0);
  const [isExploded, setIsExploded] = useState(false);

  // Local electrical cascade state (from selected neuron)
  const [manualActivated, setManualActivated] = useState(new Set());
  const [manualPulses, setManualPulses] = useState([]);
  const [isManualSimulating, setIsManualSimulating] = useState(false);
  const [simulationReach, setSimulationReach] = useState(0);

  // Sensory circuit simulation (odor, light, danger, food)
  const {
    activeStimulus,
    stimulusActivated,
    stimulusPulses,
    isSimulatingStimulus,
    activateStimulus,
    clearStimulus,
  } = useStimulusSimulation(neuronsData, synapsesData);

  // Combined activated neurons & pulses
  const allActivatedNeurons = useMemo(() => {
    const combined = new Set([...stimulusActivated, ...manualActivated]);
    if (selectedNeuron) combined.add(selectedNeuron.id);
    return combined;
  }, [stimulusActivated, manualActivated, selectedNeuron]);

  const allPulses = useMemo(() => {
    return [...stimulusPulses, ...manualPulses];
  }, [stimulusPulses, manualPulses]);

  // List of neurons that possess 3D SWC morphology
  const morphologyNeurons = useMemo(() => {
    const ids = new Set(Object.keys(morphologiesData));
    return neuronsData.filter(n => ids.has(n.id));
  }, [neuronsData, morphologiesData]);

  useEffect(() => {
    fetch('/data/brain_data.json')
      .then(res => res.json())
      .then(data => {
        setNeuronsData(data.neurons || []);
        setSynapsesData(data.synapses || []);
        setMorphologiesData(data.morphologies || {});
        setStatsData(data.stats || null);

        const types = new Set();
        (data.neurons || []).forEach(n => types.add(n.type));
        setVisibleTypes(types);

        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error loading brain data:', err);
        setIsLoading(false);
      });
  }, []);

  const handleSelectNeuron = useCallback((neuron) => {
    requestAnimationFrame(() => {
      setSelectedNeuron(neuron);
      setHudOpen(true);
    });
  }, []);

  const handleDeselect = useCallback(() => {
    setSelectedNeuron(null);
  }, []);

  const handleToggleType = useCallback((typeName) => {
    setVisibleTypes(prev => {
      const next = new Set(prev);
      if (next.has(typeName)) next.delete(typeName);
      else next.add(typeName);
      return next;
    });
  }, []);

  const handleFocusNeuron = useCallback((neuron) => {
    setCameraTarget(neuron.position);
  }, []);

  // Simulate electrical signal cascading from selected neuron along real FlyWire synapses
  const handleSimulateSignal = useCallback(() => {
    if (!selectedNeuron || isManualSimulating) return;

    setIsManualSimulating(true);
    setManualActivated(new Set([selectedNeuron.id]));
    setSimulationReach(1);

    const startId = selectedNeuron.id;
    // Step 1: Find direct synaptic targets from Princeton connectome
    const directOutgoing = synapsesData.filter(s => s.from === startId);
    const targetIds = directOutgoing.slice(0, 10).map(s => s.to);

    const pulses1 = directOutgoing.slice(0, 10).map((s, idx) => ({
      id: `sim-pulse-1-${idx}-${Date.now()}`,
      fromId: s.from,
      toId: s.to,
      color: '#22d3ee',
      duration: 0.7,
    }));
    setManualPulses(pulses1);

    // Step 2: Propagate to second-order targets after 700ms
    setTimeout(() => {
      setManualActivated(prev => new Set([...prev, ...targetIds]));
      setSimulationReach(1 + targetIds.length);

      const secondOrderPulses = [];
      const secondOrderTargets = new Set();

      targetIds.forEach(tId => {
        const out2 = synapsesData.filter(s => s.from === tId).slice(0, 3);
        out2.forEach((s, idx) => {
          secondOrderTargets.add(s.to);
          secondOrderPulses.push({
            id: `sim-pulse-2-${idx}-${s.from}-${Date.now()}`,
            fromId: s.from,
            toId: s.to,
            color: '#a855f7',
            duration: 0.8,
          });
        });
      });

      setManualPulses(secondOrderPulses);

      // Step 3: Activate second order
      setTimeout(() => {
        setManualActivated(prev => new Set([...prev, ...secondOrderTargets]));
        setSimulationReach(1 + targetIds.length + secondOrderTargets.size);
        setManualPulses([]);

        // Reset after 3 seconds
        setTimeout(() => {
          setIsManualSimulating(false);
          setManualActivated(new Set());
          setSimulationReach(0);
        }, 3000);
      }, 800);
    }, 700);
  }, [selectedNeuron, isManualSimulating, synapsesData]);

  const handlePulseComplete = useCallback((pulseId) => {
    setManualPulses(prev => prev.filter(p => p.id !== pulseId));
  }, []);

  const handleStartTour = useCallback(() => {
    if (isTouring || neuronsData.length === 0) return;
    setIsTouring(true);
    handleDeselect();
    clearStimulus();

    const regions = BRAIN_REGIONS;
    let index = 0;

    const advanceTour = () => {
      if (index >= regions.length) {
        setIsTouring(false);
        setTourRegion('');
        setCameraTarget(null);
        return;
      }

      const region = regions[index];
      setTourRegion(region);

      const regionNeurons = neuronsData.filter(n => n.region === region);
      if (regionNeurons.length > 0) {
        const centroid = regionNeurons
          .reduce(
            (acc, n) => [acc[0] + n.position[0], acc[1] + n.position[1], acc[2] + n.position[2]],
            [0, 0, 0]
          )
          .map(v => v / regionNeurons.length);
        setCameraTarget(centroid);
      }

      index++;
      tourTimerRef.current = setTimeout(advanceTour, 4000);
    };

    advanceTour();
  }, [isTouring, handleDeselect, neuronsData, clearStimulus]);

  const handleStopTour = useCallback(() => {
    clearTimeout(tourTimerRef.current);
    setIsTouring(false);
    setTourRegion('');
    setCameraTarget(null);
  }, []);

  const handleResetView = useCallback(() => {
    setCameraTarget([0, 0, 0]);
    handleDeselect();
    clearStimulus();
    setManualActivated(new Set());
    setManualPulses([]);
    setIsManualSimulating(false);
    setIsExploded(false);
  }, [handleDeselect, clearStimulus]);

  const handleCycleBodyMode = useCallback(() => {
    setBodyMode(prev => {
      if (prev === 'silhouette') return 'translucent';
      if (prev === 'translucent') return 'none';
      return 'silhouette';
    });
  }, []);

  const handleCycleNeuronScale = useCallback(() => {
    setNeuronScale(prev => {
      if (prev <= 0.8) return 1.0;
      if (prev <= 1.05) return 1.35;
      return 0.75;
    });
  }, []);

  const handleToggleExplode = useCallback(() => setIsExploded(prev => !prev), []);

  const handleJumpToRegion = useCallback(
    (regionName) => {
      const regionNeurons = neuronsData.filter(n => n.region === regionName);
      if (regionNeurons.length > 0) {
        const centroid = regionNeurons
          .reduce(
            (acc, n) => [acc[0] + n.position[0], acc[1] + n.position[1], acc[2] + n.position[2]],
            [0, 0, 0]
          )
          .map(v => v / regionNeurons.length);
        setCameraTarget(centroid);
      }
    },
    [neuronsData]
  );

  useEffect(() => {
    return () => clearTimeout(tourTimerRef.current);
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-[#020617] text-cyan-400">
        <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold tracking-widest animate-pulse">Iniciando NeuroLab 3D...</h2>
        <p className="text-slate-500 text-sm mt-2">Cargando 2,002 neuronas, 5,045 sinapsis reales y 30 morfologías SWC...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[#020617]">
      <div className="flex-1 h-full relative">
        <Canvas
          camera={{ position: [0, 10, 46], fov: 45 }}
          dpr={[1, 2]}
          onPointerMissed={handleDeselect}
        >
          <BrainScene
            neurons={neuronsData}
            synapses={synapsesData}
            morphologies={morphologiesData}
            selectedNeuron={selectedNeuron}
            onSelectNeuron={handleSelectNeuron}
            onFocusNeuron={handleFocusNeuron}
            activatedNeurons={allActivatedNeurons}
            signalPulses={allPulses}
            onPulseComplete={handlePulseComplete}
            activeStimulus={activeStimulus}
            visibleTypes={visibleTypes}
            cameraTarget={cameraTarget}
            bodyMode={bodyMode}
            neuronScale={neuronScale}
            isExploded={isExploded}
          />
        </Canvas>

        {isTouring && tourRegion && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="bg-slate-900/90 backdrop-blur-md px-10 py-5 rounded-2xl border border-cyan-500/50 shadow-[0_0_35px_rgba(6,182,212,0.4)]">
              <p className="text-cyan-400 text-3xl font-extrabold text-center drop-shadow-md">{tourRegion}</p>
              <p className="text-slate-400 text-sm text-center mt-2 tracking-widest uppercase">Explorando región</p>
            </div>
          </div>
        )}

        {/* Shortcuts */}
        <div className="absolute bottom-4 left-4 text-xs text-slate-500 space-y-1 pointer-events-none hidden md:block bg-slate-900/70 p-3 rounded-xl backdrop-blur-md border border-slate-800">
          <p><span className="font-bold text-slate-300">Clic</span> - Seleccionar neurona</p>
          <p><span className="font-bold text-slate-300">Doble clic</span> - Enfocar cámara</p>
          <p><span className="font-bold text-slate-300">ESC</span> - Deseleccionar</p>
          <p><span className="font-bold text-slate-300">Arrastra</span> - Orbitar 360°</p>
          <p><span className="font-bold text-slate-300">Click der.</span> - Desplazar / Pan</p>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden absolute top-4 right-4 z-20 bg-slate-800 p-2 rounded-lg text-white border border-slate-700 shadow-lg"
          onClick={() => setHudOpen(!hudOpen)}
        >
          {hudOpen ? 'Ocultar Panel' : 'Mostrar Info'}
        </button>
      </div>

      <HudPanel
        selectedNeuron={selectedNeuron}
        isOpen={hudOpen}
        onClose={() => setHudOpen(false)}
        onToggle={() => setHudOpen(!hudOpen)}
        neurons={neuronsData}
        synapses={synapsesData}
        stats={statsData}
        morphologyNeurons={morphologyNeurons}
        onSelectNeuron={handleSelectNeuron}
        onDeselect={handleDeselect}
        aiStatus={aiStatus}
        progressText={progressText}
        analysisText={analysisText}
        visibleTypes={visibleTypes}
        onToggleType={handleToggleType}
        onStartTour={handleStartTour}
        onStopTour={handleStopTour}
        isTouring={isTouring}
        tourRegion={tourRegion}
        onResetView={handleResetView}
        bodyMode={bodyMode}
        onCycleBodyMode={handleCycleBodyMode}
        neuronScale={neuronScale}
        onCycleNeuronScale={handleCycleNeuronScale}
        onToggleExplode={handleToggleExplode}
        isExploded={isExploded}
        onJumpToRegion={handleJumpToRegion}
        activeStimulus={activeStimulus}
        onActivateStimulus={activateStimulus}
        isSimulatingStimulus={isSimulatingStimulus}
        onSimulateSignal={handleSimulateSignal}
        isSimulatingSignal={isManualSimulating}
        simulationReach={isManualSimulating ? simulationReach : stimulusActivated.size}
      />
    </div>
  );
}