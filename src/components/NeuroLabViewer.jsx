import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { NEURON_TYPE_COLORS, BRAIN_REGIONS } from '../data/neurons.js';
import { useAIAnalysis } from '../hooks/useAIAnalysis.js';
import BrainScene from './BrainScene.jsx';
import HudPanel from './HudPanel.jsx';

export default function NeuroLabViewer() {
  const [neuronsData, setNeuronsData] = useState([]);
  const [synapsesData, setSynapsesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedNeuron, setSelectedNeuron] = useState(null);
  const [hudOpen, setHudOpen] = useState(true);
  
  const { status: aiStatus, progressText, analysisText } = useAIAnalysis(selectedNeuron);
  
  // State for visual features
  const [activatedNeurons, setActivatedNeurons] = useState(new Set());
  const [signalPulses, setSignalPulses] = useState([]);
  const [highlightedSynapses, setHighlightedSynapses] = useState(new Set());
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationReach, setSimulationReach] = useState(0);
  
  const [visibleTypes, setVisibleTypes] = useState(new Set(Object.keys(NEURON_TYPE_COLORS)));
  
  const [isTouring, setIsTouring] = useState(false);
  const [tourRegion, setTourRegion] = useState('');
  const [cameraTarget, setCameraTarget] = useState(null);
  const tourTimerRef = useRef(null);

  const [isXRay, setIsXRay] = useState(false);
  const [isExploded, setIsExploded] = useState(false); // Capas separadas

  useEffect(() => {
    fetch('/data/brain_data.json')
      .then(res => res.json())
      .then(data => {
        setNeuronsData(data.neurons);
        setSynapsesData(data.synapses);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error loading brain data:", err);
        setIsLoading(false);
      });
  }, []);

  const handleSelectNeuron = useCallback((neuron) => {
    // Avoid blocking the main thread when clicking by using requestAnimationFrame
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

  // Signal propagation logic
  const propagateSignal = useCallback((neuronId, depth, currentSet) => {
    if (depth >= 5) {
      setTimeout(() => {
        setIsSimulating(false);
        setActivatedNeurons(new Set());
        setHighlightedSynapses(new Set());
        setSimulationReach(0);
      }, 3000);
      return;
    }
    
    const outgoing = synapsesData
      .map((s, idx) => ({ ...s, idx }))
      .filter(s => s.from === neuronId);
    
    if (outgoing.length === 0) {
      setTimeout(() => {
        setIsSimulating(false);
        setActivatedNeurons(new Set());
        setHighlightedSynapses(new Set());
        setSimulationReach(0);
      }, 3000);
      return;
    }
    
    setTimeout(() => {
      outgoing.forEach((syn, i) => {
        const pulseId = `pulse-${depth}-${i}-${Math.random().toString(36).substring(7)}`;
        setSignalPulses(prev => [...prev, { 
          id: pulseId, 
          fromId: syn.from, 
          toId: syn.to,
          color: '#22d3ee' 
        }]);
        setHighlightedSynapses(prev => new Set([...prev, syn.idx]));
      });
    }, depth * 400);
  }, [synapsesData]);

  const handleSimulateSignal = useCallback(() => {
    if (!selectedNeuron || isSimulating) return;
    setIsSimulating(true);
    setSimulationReach(1);
    setActivatedNeurons(new Set([selectedNeuron.id]));
    propagateSignal(selectedNeuron.id, 0, new Set([selectedNeuron.id]));
  }, [selectedNeuron, isSimulating, propagateSignal]);

  const handlePulseComplete = useCallback((pulseId) => {
    setSignalPulses(prev => {
      const pulse = prev.find(p => p.id === pulseId);
      if (pulse) {
        setActivatedNeurons(prevSet => {
          const newSet = new Set([...prevSet, pulse.toId]);
          setSimulationReach(newSet.size);
          return newSet;
        });
        const depthMatch = pulseId.match(/pulse-(\\d+)/);
        const depth = depthMatch ? parseInt(depthMatch[1]) : 0;
        propagateSignal(pulse.toId, depth + 1);
      }
      return prev.filter(p => p.id !== pulseId);
    });
  }, [propagateSignal]);

  const handleFocusNeuron = useCallback((neuron) => {
    setCameraTarget(neuron.position);
  }, []);

  const handleStartTour = useCallback(() => {
    if (isTouring || neuronsData.length === 0) return;
    setIsTouring(true);
    handleDeselect();
    
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
        const centroid = regionNeurons.reduce(
          (acc, n) => [acc[0] + n.position[0], acc[1] + n.position[1], acc[2] + n.position[2]],
          [0, 0, 0]
        ).map(v => v / regionNeurons.length);
        setCameraTarget(centroid);
      }
      
      index++;
      tourTimerRef.current = setTimeout(advanceTour, 4000);
    };
    
    advanceTour();
  }, [isTouring, handleDeselect, neuronsData]);

  const handleStopTour = useCallback(() => {
    clearTimeout(tourTimerRef.current);
    setIsTouring(false);
    setTourRegion('');
    setCameraTarget(null);
  }, []);

  const handleResetView = useCallback(() => {
    setCameraTarget([0, 0, 0]);
    handleDeselect();
    setActivatedNeurons(new Set());
    setHighlightedSynapses(new Set());
    setIsSimulating(false);
    setIsExploded(false);
  }, [handleDeselect]);

  const handleToggleXRay = useCallback(() => setIsXRay(prev => !prev), []);
  const handleToggleExplode = useCallback(() => setIsExploded(prev => !prev), []);

  const handleJumpToRegion = useCallback((regionName) => {
    const regionNeurons = neuronsData.filter(n => n.region === regionName);
    if (regionNeurons.length > 0) {
      const centroid = regionNeurons.reduce(
        (acc, n) => [acc[0] + n.position[0], acc[1] + n.position[1], acc[2] + n.position[2]],
        [0, 0, 0]
      ).map(v => v / regionNeurons.length);
      setCameraTarget(centroid);
    }
  }, [neuronsData]);

  useEffect(() => {
    return () => clearTimeout(tourTimerRef.current);
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-[#020617] text-cyan-400">
        <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold tracking-widest animate-pulse">Iniciando NeuroLab 3D...</h2>
        <p className="text-slate-500 text-sm mt-2">Cargando sinapsis y tensores de IA locales</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[#020617]">
      <div className="flex-1 h-full relative" onPointerMissed={handleDeselect}>
        <Canvas camera={{ position: [0, 8, 25], fov: 45 }} dpr={[1, 2]}>
          <BrainScene 
            neurons={neuronsData}
            synapses={synapsesData}
            selectedNeuron={selectedNeuron}
            onSelectNeuron={handleSelectNeuron}
            onFocusNeuron={handleFocusNeuron}
            activatedNeurons={activatedNeurons}
            signalPulses={signalPulses}
            onPulseComplete={handlePulseComplete}
            visibleTypes={visibleTypes}
            cameraTarget={cameraTarget}
            highlightedSynapses={highlightedSynapses}
            isXRay={isXRay}
            isExploded={isExploded}
          />
        </Canvas>
        
        {isTouring && tourRegion && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="bg-slate-900/80 backdrop-blur-sm px-10 py-5 rounded-2xl border border-cyan-500/50 tour-overlay shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              <p className="text-cyan-400 text-3xl font-extrabold text-center drop-shadow-md">{tourRegion}</p>
              <p className="text-slate-400 text-sm text-center mt-2 tracking-widest uppercase">Explorando región</p>
            </div>
          </div>
        )}

        {/* Shortcuts */}
        <div className="absolute bottom-4 left-4 text-xs text-slate-500 space-y-1 pointer-events-none hidden md:block bg-slate-900/50 p-3 rounded-lg backdrop-blur-sm">
          <p><span className="font-bold text-slate-300">ESC</span> - Deseleccionar</p>
          <p><span className="font-bold text-slate-300">Doble clic</span> - Enfocar neurona</p>
          <p><span className="font-bold text-slate-300">Arrastra</span> - Rotar vista</p>
          <p><span className="font-bold text-slate-300">Scroll</span> - Zoom</p>
        </div>

        {/* Mobile toggle */}
        <button 
          className="md:hidden absolute top-4 right-4 z-20 bg-slate-800 p-2 rounded-lg text-white border border-slate-700"
          onClick={() => setHudOpen(!hudOpen)}
        >
          {hudOpen ? 'Ocultar Panel' : 'Mostrar Info'}
        </button>
      </div>

      <HudPanel 
        selectedNeuron={selectedNeuron}
        isOpen={hudOpen} 
        onClose={() => setHudOpen(false)}
        neurons={neuronsData}
        synapses={synapsesData}
        onDeselect={handleDeselect}
        aiStatus={aiStatus}
        progressText={progressText}
        analysisText={analysisText}
        visibleTypes={visibleTypes}
        onToggleType={handleToggleType}
        onSimulateSignal={handleSimulateSignal}
        isSimulating={isSimulating}
        simulationReach={simulationReach}
        onStartTour={handleStartTour}
        onStopTour={handleStopTour}
        isTouring={isTouring}
        tourRegion={tourRegion}
        onResetView={handleResetView}
        onToggleXRay={handleToggleXRay}
        isXRay={isXRay}
        onToggleExplode={handleToggleExplode}
        isExploded={isExploded}
        onJumpToRegion={handleJumpToRegion}
      />
    </div>
  );
}