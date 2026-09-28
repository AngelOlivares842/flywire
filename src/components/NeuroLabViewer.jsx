import React, { useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import BrainScene from './BrainScene.jsx';
import HudPanel from './HudPanel.jsx';
import { useAIAnalysis } from '../hooks/useAIAnalysis.js';
import { neurons, synapses } from '../data/neurons.js';

export default function NeuroLabViewer() {
  const [selectedNeuron, setSelectedNeuron] = useState(null);
  const [hudOpen, setHudOpen] = useState(true);
  
  const { aiStatus, progressText, analysisText, requestAnalysis, resetAnalysis } = useAIAnalysis();

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

  // Keyboard shortcut to deselect
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleDeselect();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDeselect]);

  return (
    <div className="w-full h-full flex relative">
      {/* 3D Canvas */}
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
          />
        </Canvas>
        
        {/* Bottom-left overlay: keyboard shortcut hints */}
        <div className="absolute bottom-4 left-4 text-xs text-slate-500 space-y-1 pointer-events-none">
          <p>ESC - Deseleccionar</p>
          <p>Arrastra - Rotar vista</p>
          <p>Scroll - Zoom</p>
        </div>
        
        {/* Mobile toggle button for HUD */}
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
      
      {/* HUD Panel */}
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
      />
    </div>
  );
}