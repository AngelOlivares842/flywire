import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import BrainScene from './BrainScene.jsx';
import HudPanel from './HudPanel.jsx';
import { useAIAnalysis } from '../hooks/useAIAnalysis.js';
import { neurons, synapses, NEURON_TYPE_COLORS, BRAIN_REGIONS } from '../data/neurons.js';

export default function NeuroLabViewer() {
  const [selectedNeuron, setSelectedNeuron] = useState(null);
  const [hudOpen, setHudOpen] = useState(true);
  
  const { aiStatus, progressText, analysisText, requestAnalysis, resetAnalysis } = useAIAnalysis();

  const [activatedNeurons, setActivatedNeurons] = useState(new Set());
  const [signalPulses, setSignalPulses] = useState([]);
  const [highlightedSynapses, setHighlightedSynapses] = useState(new Set());
  const [isSimulating, setIsSimulating] = useState(false);
  
  const [visibleTypes, setVisibleTypes] = useState(new Set(Object.keys(NEURON_TYPE_COLORS)));
  
  const [isTouring, setIsTouring] = useState(false);
  const [tourRegion, setTourRegion] = useState('');
  const [cameraTarget, setCameraTarget] = useState(null);
  const tourTimerRef = useRef(null);
  
  const [isXRay, setIsXRay] = useState(false);

  const handleSelectNeuron = useCallback((neuron) => {
    setSelectedNeuron(neuron);
    setHudOpen(true);
    requestAnalysis(neuron);
  }, [requestAnalysis]);

  const handleDeselect = useCallback(() => {
    setSelectedNeuron(null);
    resetAnalysis();
  }, [resetAnalysis]);

  const toggleHud = useCallback(() => {
    setHudOpen(prev => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleDeselect();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDeselect]);

  // A. Signal Propagation Logic
  const propagateSignal = useCallback((neuronId, depth) => {
    if (depth >= 4) { // Max 4 hops
      setTimeout(() => setIsSimulating(false), 1500);
      return;
    }
    
    const outgoing = synapses
      .map((s, idx) => ({ ...s, idx }))
      .filter(s => s.from === neuronId);
    
    if (outgoing.length === 0) {
      setTimeout(() => setIsSimulating(false), 1500);
      return;
    }
    
    setTimeout(() => {
      outgoing.forEach((syn, i) => {
        const pulseId = `pulse-${depth}-${i}-${Date.now()}`;
        setSignalPulses(prev => [...prev, { 
          id: pulseId, 
          fromId: syn.from, 
          toId: syn.to,
          color: '#06b6d4' 
        }]);
        setHighlightedSynapses(prev => new Set([...prev, syn.idx]));
      });
    }, depth * 600);
  }, []);

  const handleSimulateSignal = useCallback(() => {
    if (!selectedNeuron || isSimulating) return;
    setIsSimulating(true);
    setActivatedNeurons(new Set([selectedNeuron.id]));
    
    propagateSignal(selectedNeuron.id, 0);
  }, [selectedNeuron, isSimulating, propagateSignal]);

  const handlePulseComplete = useCallback((pulseId) => {
    setSignalPulses(prev => {
      const pulse = prev.find(p => p.id === pulseId);
      if (pulse) {
        setActivatedNeurons(prevSet => new Set([...prevSet, pulse.toId]));
        const depthMatch = pulseId.match(/pulse-(\d+)/);
        const depth = depthMatch ? parseInt(depthMatch[1]) : 0;
        propagateSignal(pulse.toId, depth + 1);
      }
      return prev.filter(p => p.id !== pulseId);
    });
  }, [propagateSignal]);

  // B. Type Filtering
  const handleToggleType = useCallback((typeName) => {
    setVisibleTypes(prev => {
      const next = new Set(prev);
      if (next.has(typeName)) next.delete(typeName);
      else next.add(typeName);
      return next;
    });
  }, []);

  // C. Auto Tour
  const handleStartTour = useCallback(() => {
    if (isTouring) return;
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
      
      const regionNeurons = neurons.filter(n => n.region === region);
      if (regionNeurons.length > 0) {
        const centroid = regionNeurons.reduce(
          (acc, n) => [acc[0] + n.position[0], acc[1] + n.position[1], acc[2] + n.position[2]],
          [0, 0, 0]
        ).map(v => v / regionNeurons.length);
        setCameraTarget(centroid);
      }
      
      index++;
      tourTimerRef.current = setTimeout(advanceTour, 3500);
    };
    
    advanceTour();
  }, [isTouring, handleDeselect]);

  const handleStopTour = useCallback(() => {
    clearTimeout(tourTimerRef.current);
    setIsTouring(false);
    setTourRegion('');
    setCameraTarget(null);
  }, []);

  useEffect(() => {
    return () => clearTimeout(tourTimerRef.current);
  }, []);

  // D. Focus & Reset
  const handleFocusNeuron = useCallback((neuron) => {
    setCameraTarget(neuron.position);
  }, []);

  const handleResetView = useCallback(() => {
    setCameraTarget([0, 0, 0]);
    handleDeselect();
    setActivatedNeurons(new Set());
    setHighlightedSynapses(new Set());
    setIsSimulating(false);
  }, [handleDeselect]);

  // E. X-Ray Mode
  const handleToggleXRay = useCallback(() => setIsXRay(prev => !prev), []);

  // F. Region Jump
  const handleJumpToRegion = useCallback((regionName) => {
    const regionNeurons = neurons.filter(n => n.region === regionName);
    if (regionNeurons.length > 0) {
      const centroid = regionNeurons.reduce(
        (acc, n) => [acc[0] + n.position[0], acc[1] + n.position[1], acc[2] + n.position[2]],
        [0, 0, 0]
      ).map(v => v / regionNeurons.length);
      setCameraTarget(centroid);
    }
  }, []);

  return (
    <div className="w-full h-full flex relative">
      <div className="flex-1 h-full relative">
        <Canvas
          camera={{ position: [0, 2, 10], fov: 50 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
          style={{ background: '#020617' }}
        >
          <BrainScene
            neurons={neurons}
            synapses={synapses}
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
          />
        </Canvas>
        
        <div className="absolute bottom-4 left-4 text-xs text-slate-500 space-y-1 pointer-events-none">
          <p>ESC - Deseleccionar</p>
          <p>Doble clic - Enfocar neurona</p>
          <p>Arrastra - Rotar vista</p>
          <p>Scroll - Zoom</p>
        </div>

        {isTouring && tourRegion && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="bg-slate-900/80 backdrop-blur-sm px-8 py-4 rounded-2xl border border-cyan-500/30 animate-fade-in tour-overlay">
              <p className="text-cyan-400 text-2xl font-bold text-center text-glow">{tourRegion}</p>
              <p className="text-slate-400 text-sm text-center">Región cerebral</p>
            </div>
          </div>
        )}
        
        <button 
          onClick={toggleHud} 
          className="md:hidden absolute top-4 right-4 z-50 p-2 bg-slate-800/80 backdrop-blur rounded-md border border-slate-700 text-white shadow-lg"
          aria-label="Toggle Menu"
        >
          {hudOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>
      
      <HudPanel
        selectedNeuron={selectedNeuron}
        aiStatus={aiStatus}
        progressText={progressText}
        analysisText={analysisText}
        neurons={neurons}
        synapses={synapses}
        onSelectNeuron={handleSelectNeuron}
        onDeselect={handleDeselect}
        isOpen={hudOpen}
        onToggle={toggleHud}
        visibleTypes={visibleTypes}
        onToggleType={handleToggleType}
        onSimulateSignal={handleSimulateSignal}
        isSimulating={isSimulating}
        simulationReach={activatedNeurons.size}
        onStartTour={handleStartTour}
        onStopTour={handleStopTour}
        isTouring={isTouring}
        tourRegion={tourRegion}
        onResetView={handleResetView}
        onToggleXRay={handleToggleXRay}
        isXRay={isXRay}
        onJumpToRegion={handleJumpToRegion}
      />
    </div>
  );
}