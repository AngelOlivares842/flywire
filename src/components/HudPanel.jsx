import React, { useState, useMemo } from 'react';
import { NEURON_TYPE_COLORS } from '../data/neurons.js';

/**
 * HUD Panel Component
 */
export default function HudPanel({
  selectedNeuron,
  aiStatus,
  progressText,
  analysisText,
  neurons,
  synapses,
  onSelectNeuron,
  onDeselect,
  isOpen,
  onToggle
}) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Basic fallback for connections if the function isn't available
  const connectionsCount = useMemo(() => {
    if (!selectedNeuron) return 0;
    return synapses.filter(s => s.pre === selectedNeuron.id || s.post === selectedNeuron.id).length;
  }, [selectedNeuron, synapses]);

  // Search results
  const searchResults = useMemo(() => {
    if (searchQuery.trim().length < 2) return [];
    const lowerQuery = searchQuery.toLowerCase();
    return neurons.filter(n => 
      n.id.toLowerCase().includes(lowerQuery) ||
      n.type.toLowerCase().includes(lowerQuery) ||
      n.region.toLowerCase().includes(lowerQuery)
    ).slice(0, 5); // Limit to 5 results
  }, [searchQuery, neurons]);

  // If not open on mobile, don't render content (or render minimal)
  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute top-0 right-0 h-full w-full md:w-80 md:relative bg-slate-900/70 backdrop-blur-xl border-l border-slate-700/50 flex flex-col z-40 animate-slide-in">
      
      {/* Mobile close button inside panel if needed, but orchestrator handles toggle */}
      <div className="p-4 border-b border-slate-800/50 flex justify-between items-center md:hidden">
        <h2 className="text-lg font-bold text-white">Panel de Control</h2>
        <button onClick={onToggle} className="text-slate-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 relative">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por ID, tipo o región..."
            className="w-full bg-slate-800/80 border border-slate-700 rounded-md py-2 pl-9 pr-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-4 right-4 mt-1 bg-slate-800 border border-slate-700 rounded-md shadow-lg overflow-hidden z-50">
            {searchResults.map(result => (
              <button
                key={result.id}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700 focus:bg-slate-700 focus:outline-none transition-colors border-b border-slate-700/50 last:border-0 flex items-center space-x-2"
                onClick={() => {
                  onSelectNeuron(result);
                  setSearchQuery('');
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: NEURON_TYPE_COLORS[result.type] || '#ffffff' }}></span>
                <span className="truncate text-white">{result.id}</span>
                <span className="text-xs text-slate-400">({result.type})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {!selectedNeuron ? (
          <div className="animate-fade-in space-y-6">
            <div className="text-center space-y-3">
              <h3 className="text-xl font-bold text-white">Bienvenido a NeuroLab 3D</h3>
              <p className="text-sm text-slate-300">
                Selecciona una neurona haciendo clic en el modelo 3D o usa el buscador para ver su información y análisis por IA.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <h4 className="text-sm font-semibold text-slate-200 mb-3 uppercase tracking-wider">Leyenda de Tipos</h4>
              <div className="space-y-2">
                {Object.entries(NEURON_TYPE_COLORS).map(([type, color]) => (
                  <div key={type} className="flex items-center space-x-3 text-sm text-slate-300">
                    <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }}></span>
                    <span className="capitalize">{type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in space-y-5">
            {/* Neuron Metadata Card */}
            <div 
              className="bg-slate-800/80 rounded-lg p-4 shadow-lg border border-slate-700/50 relative overflow-hidden"
              style={{ borderLeftColor: NEURON_TYPE_COLORS[selectedNeuron.type] || '#ffffff', borderLeftWidth: '4px' }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-white break-all">{selectedNeuron.id}</h3>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-200 border border-slate-600">
                  {selectedNeuron.type}
                </span>
              </div>
              
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Neurotransmisor:</span>
                  <span className="text-slate-200">{selectedNeuron.neurotransmitter || 'Desconocido'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Región:</span>
                  <span className="text-slate-200">{selectedNeuron.region || 'Cerebro entero'}</span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-slate-700/50">
                  <span className="text-slate-400">Conexiones:</span>
                  <span className="text-cyan-400 font-semibold">{connectionsCount}</span>
                </div>
              </div>
            </div>

            {/* AI Analysis Section */}
            <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700/50 flex flex-col space-y-3 min-h-[200px]">
              <h4 className="text-sm font-semibold text-cyan-400 flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9.5 4a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm1 11.5a.5.5 0 01-1 0v-5a.5.5 0 011 0v5z"/>
                </svg>
                <span>Análisis por IA</span>
              </h4>
              
              {aiStatus === 'no-webgpu' && (
                <div className="text-sm text-orange-400 bg-orange-400/10 p-3 rounded">
                  ⚠️ WebGPU no está disponible en este navegador. El análisis por IA no funcionará localmente.
                </div>
              )}

              {(aiStatus === 'loading' || aiStatus === 'thinking') && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-4 text-center">
                  <div className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin"></div>
                  <p className="text-xs text-slate-400 animate-pulse">{progressText || 'Pensando...'}</p>
                </div>
              )}

              {(aiStatus === 'ready' || aiStatus === 'thinking') && analysisText && (
                <div className={`text-sm text-slate-200 leading-relaxed ${aiStatus === 'thinking' ? 'shimmer text-transparent bg-clip-text' : ''}`}>
                  {analysisText.split('\n').map((paragraph, i) => (
                    <p key={i} className="mb-2 last:mb-0">{paragraph}</p>
                  ))}
                </div>
              )}

              {aiStatus === 'error' && (
                <div className="text-sm text-red-400 bg-red-400/10 p-3 rounded">
                  ❌ Error al cargar el modelo de IA. Inténtalo de nuevo más tarde.
                </div>
              )}
            </div>

            <button
              onClick={onDeselect}
              className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md border border-slate-700 transition-colors text-sm font-medium"
            >
              Deseleccionar
            </button>
          </div>
        )}
      </div>

      {/* Footer Statistics */}
      <div className="p-4 bg-slate-950/50 border-t border-slate-800/50 text-xs text-slate-500 flex justify-between">
        <div>
          <span className="block font-medium text-slate-400">Neuronas</span>
          <span>{neurons.length.toLocaleString()}</span>
        </div>
        <div>
          <span className="block font-medium text-slate-400">Conexiones</span>
          <span>{synapses.length.toLocaleString()}</span>
        </div>
        {selectedNeuron && (
          <div>
            <span className="block font-medium text-slate-400">Seleccionada</span>
            <span className="text-cyan-500">{connectionsCount}</span>
          </div>
        )}
      </div>

    </div>
  );
}
