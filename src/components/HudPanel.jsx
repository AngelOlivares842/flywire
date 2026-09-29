import React, { useState, useMemo } from 'react';
import { NEURON_TYPE_COLORS, BRAIN_REGIONS } from '../data/neurons.js';
import StatsPanel from './StatsPanel.jsx';
import StimulusPanel from './StimulusPanel.jsx';

export default function HudPanel({
  selectedNeuron,
  isOpen,
  onToggle,
  neurons = [],
  synapses = [],
  stats,
  morphologyNeurons = [],
  onSelectNeuron,
  onDeselect,
  aiStatus,
  progressText,
  analysisText,
  visibleTypes,
  onToggleType,
  onStartTour,
  onStopTour,
  isTouring,
  tourRegion,
  onResetView,
  bodyMode = 'silhouette',
  onCycleBodyMode,
  neuronScale = 1.0,
  onCycleNeuronScale,
  onToggleExplode,
  isExploded,
  onJumpToRegion,
  activeStimulus,
  onActivateStimulus,
  isSimulatingStimulus,
  onSimulateSignal,
  isSimulatingSignal,
  simulationReach = 0,
  viewMode = 'microscope',
  onToggleViewMode,
  telemetry = { speed: '0.0', heading: 0, activeNeurons: 0, wingHz: 120, leftMotor: '0', rightMotor: '0' },
  arenaStimulusType = 'light',
  onSetArenaStimulus,
  onRelocateStimulus,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'morphology' | 'stats'

  // Count incoming + outgoing connections for selected neuron
  const connectionsCount = useMemo(() => {
    if (!selectedNeuron || !synapses.length) return 0;
    const sId = selectedNeuron.id;
    return synapses.filter(s => s.from === sId || s.to === sId).length;
  }, [selectedNeuron, synapses]);

  const searchResults = useMemo(() => {
    if (searchQuery.trim().length < 2) return [];
    const lower = searchQuery.toLowerCase();
    return neurons
      .filter(n =>
        n.id.toLowerCase().includes(lower) ||
        (n.label && n.label.toLowerCase().includes(lower)) ||
        (n.cellType && n.cellType.toLowerCase().includes(lower)) ||
        n.region.toLowerCase().includes(lower) ||
        (n.neurotransmitter && n.neurotransmitter.toLowerCase().includes(lower))
      )
      .slice(0, 6);
  }, [searchQuery, neurons]);

  if (!isOpen) return null;

  // Body mode label and icon
  const bodyModeInfo = {
    silhouette: { label: 'Silueta Anatómica', icon: '🪰', color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10' },
    translucent: { label: 'Cristal Ámbar', icon: '🔬', color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
    none: { label: 'Solo Cerebro', icon: '🌌', color: 'text-indigo-400 border-indigo-500/40 bg-indigo-500/10' },
  }[bodyMode] || { label: 'Silueta Anatómica', icon: '🪰', color: 'text-cyan-400' };

  const neuronScaleLabel = neuronScale <= 0.8 ? 'Somas: Finos' : neuronScale <= 1.05 ? 'Somas: Medios' : 'Somas: Grandes';

  return (
    <div className="absolute top-0 right-0 h-full w-full md:w-[410px] md:relative bg-slate-900/90 backdrop-blur-2xl border-l border-slate-700/60 flex flex-col z-40 animate-slide-in shadow-2xl">
      {/* Mobile Top Header */}
      <div className="p-4 border-b border-slate-800/60 flex justify-between items-center md:hidden">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <span>🧠</span>
          <span>NeuroLab 3D</span>
        </h2>
        <button onClick={onToggle} className="text-slate-400 hover:text-white p-1">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Primary Mode Banner (Microscopio vs Vuelo Libre en Arena) */}
      <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm">{viewMode === 'arena' ? '🚀' : '🔬'}</span>
          <div>
            <p className="text-xs font-bold text-white tracking-wide">
              {viewMode === 'arena' ? 'Cámara de Vuelo (Arena 3D)' : 'Modo Microscopio Fijo'}
            </p>
            <p className="text-[10px] text-slate-400">
              {viewMode === 'arena' ? 'Vuelo guiado por su conectoma real' : 'Inspección celular y SWC'}
            </p>
          </div>
        </div>
        <button
          onClick={onToggleViewMode}
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-md ${
            viewMode === 'arena'
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 hover:bg-cyan-500/30'
              : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-cyan-400/40 hover:from-blue-500 hover:to-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
          }`}
        >
          {viewMode === 'arena' ? 'Volver a Microscopio' : '🚀 Activar Vuelo'}
        </button>
      </div>

      {/* Global Search Bar */}
      <div className="p-3 border-b border-slate-800/50 relative">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por ID, tipo celular, región..."
            className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs">✕</button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-3 right-3 mt-1 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800">
            {searchResults.map(result => (
              <button
                key={result.id}
                className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-slate-800 focus:bg-slate-800 focus:outline-none transition-colors flex items-center space-x-2.5"
                onClick={() => {
                  onSelectNeuron(result);
                  setSearchQuery('');
                }}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: NEURON_TYPE_COLORS[result.type] || '#38bdf8' }}></span>
                <div className="flex-1 truncate">
                  <p className="text-white font-medium truncate">{result.label || result.cellType || result.id}</p>
                  <p className="text-[10px] text-slate-400 truncate">{result.region} • {result.type}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
        {/* Real-Time Flight Telemetry Dashboard (Active during Arena Mode) */}
        {viewMode === 'arena' && (
          <div className="bg-gradient-to-br from-cyan-950/40 to-slate-900/90 rounded-xl p-3.5 border border-cyan-500/40 shadow-lg space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center space-x-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Telemetría Motora en Vivo</span>
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                Connectome Step 60Hz
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/50">
                <p className="text-base font-extrabold text-white font-mono">{telemetry.speed}</p>
                <p className="text-[10px] text-slate-400">Velocidad (mm/s)</p>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/50">
                <p className="text-base font-extrabold text-cyan-400 font-mono">{Math.round(telemetry.heading)}°</p>
                <p className="text-[10px] text-slate-400">Rumbo (Yaw)</p>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/50">
                <p className="text-base font-extrabold text-emerald-400 font-mono">{telemetry.wingHz}</p>
                <p className="text-[10px] text-slate-400">Aleteo (Hz)</p>
              </div>
            </div>

            {/* Bilateral Motor balance (Drives steering torque) */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Motor Izq: {telemetry.leftMotor}%</span>
                <span>Diferencial de Giro (Torque)</span>
                <span>Motor Der: {telemetry.rightMotor}%</span>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden bg-slate-800 border border-slate-700">
                <div className="bg-cyan-500 transition-all duration-100" style={{ width: `${Math.max(5, telemetry.leftMotor)}%` }}></div>
                <div className="flex-1 bg-slate-700/30"></div>
                <div className="bg-blue-500 transition-all duration-100" style={{ width: `${Math.max(5, telemetry.rightMotor)}%` }}></div>
              </div>
            </div>

            {/* Stimulus Controller inside Arena */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <p className="text-[11px] font-semibold text-slate-300">Estímulo Físico en la Arena:</p>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <button
                  onClick={() => onSetArenaStimulus('light')}
                  className={`py-1.5 px-2 rounded-lg border font-medium transition-all ${
                    arenaStimulusType === 'light' ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-bold' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  💡 Luz
                </button>
                <button
                  onClick={() => onSetArenaStimulus('odor')}
                  className={`py-1.5 px-2 rounded-lg border font-medium transition-all ${
                    arenaStimulusType === 'odor' ? 'bg-purple-500/20 text-purple-300 border-purple-500/60 font-bold' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  🌸 Olor
                </button>
                <button
                  onClick={() => onSetArenaStimulus('none')}
                  className={`py-1.5 px-2 rounded-lg border font-medium transition-all ${
                    arenaStimulusType === 'none' ? 'bg-slate-700 text-slate-200 border-slate-500 font-bold' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  🚫 Inercia
                </button>
              </div>

              {arenaStimulusType !== 'none' && (
                <button
                  onClick={onRelocateStimulus}
                  className="w-full py-1.5 px-3 rounded-lg border border-cyan-500/40 bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 text-xs font-semibold transition-all flex items-center justify-center space-x-1.5"
                >
                  <span>🎯</span>
                  <span>Mover Estímulo de Posición</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* If a neuron is selected, show its deep inspection card */}
        {selectedNeuron ? (
          <div className="animate-fade-in space-y-4">
            <div
              className="bg-slate-800/80 rounded-xl p-4 shadow-lg border border-slate-700/60 relative overflow-hidden"
              style={{ borderLeftColor: NEURON_TYPE_COLORS[selectedNeuron.type] || '#38bdf8', borderLeftWidth: '5px' }}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-base font-bold text-white break-words">
                    {selectedNeuron.label || selectedNeuron.cellType || 'Neurona'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {selectedNeuron.id}</p>
                </div>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border"
                  style={{
                    backgroundColor: (NEURON_TYPE_COLORS[selectedNeuron.type] || '#38bdf8') + '20',
                    borderColor: (NEURON_TYPE_COLORS[selectedNeuron.type] || '#38bdf8') + '60',
                    color: NEURON_TYPE_COLORS[selectedNeuron.type] || '#38bdf8',
                  }}
                >
                  {selectedNeuron.type}
                </span>
              </div>

              {/* Anatomy details */}
              <div className="space-y-1.5 text-xs mt-3 pt-2.5 border-t border-slate-700/50">
                <div className="flex justify-between">
                  <span className="text-slate-400">Neurotransmisor:</span>
                  <span className="text-slate-200 font-medium">{selectedNeuron.neurotransmitter || 'Desconocido'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Región Cerebral:</span>
                  <span className="text-slate-200 font-medium">{selectedNeuron.region || 'Cerebro entero'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Neuropilo:</span>
                  <span className="text-slate-300 font-mono">{selectedNeuron.neuropil || 'N/A'}</span>
                </div>
                {selectedNeuron.hemisphere && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hemisferio:</span>
                    <span className="text-slate-200 capitalize">{selectedNeuron.hemisphere}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 text-cyan-300 font-medium">
                  <span>Sinapsis Conectadas:</span>
                  <span className="font-bold">{connectionsCount}</span>
                </div>
              </div>
            </div>

            {/* Signal Simulation Action Button */}
            <div className="space-y-2">
              <button
                onClick={onSimulateSignal}
                disabled={isSimulatingSignal}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center space-x-2 border
                  ${isSimulatingSignal
                    ? 'bg-cyan-950/70 border-cyan-500 text-cyan-300 cursor-wait animate-pulse'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.35)]'
                  }`}
              >
                <span>⚡</span>
                <span>{isSimulatingSignal ? 'Propagando Sinapsis...' : 'Simular Impulso Eléctrico'}</span>
              </button>

              {isSimulatingSignal && (
                <div className="text-xs text-cyan-300 bg-cyan-950/40 p-2.5 rounded-lg border border-cyan-700/50 flex items-center justify-between animate-fade-in">
                  <span>Cascada neural activa</span>
                  <span className="font-bold">Alcance: {simulationReach} neuronas</span>
                </div>
              )}
            </div>

            {/* Chemical & Neurotransmitter Confidence Profile */}
            <StatsPanel selectedNeuron={selectedNeuron} />

            {/* AI Neuroscience Analysis */}
            <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700/50 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <span>🤖</span>
                  <span>Análisis Biológico por IA</span>
                </h4>
                <span className="text-[10px] text-slate-500">Qwen / Gemini</span>
              </div>

              {aiStatus === 'loading' || aiStatus === 'thinking' ? (
                <div className="flex items-center space-x-3 py-3">
                  <div className="w-5 h-5 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin"></div>
                  <p className="text-xs text-slate-400 animate-pulse">{progressText || 'Analizando conectoma...'}</p>
                </div>
              ) : analysisText ? (
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                  {analysisText}
                </p>
              ) : null}
            </div>

            {/* Deselect button */}
            <button
              onClick={onDeselect}
              className="w-full py-2 px-4 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 text-xs font-medium transition-colors"
            >
              ✕ Deseleccionar Neurona
            </button>
          </div>
        ) : (
          /* Default Global View: Stimuli, SWC Morphology list, Stats, View tools */
          <div className="animate-fade-in space-y-4">
            {/* View Tool Quick Bar */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={onCycleBodyMode}
                className={`py-2 px-2 rounded-xl border text-[11px] font-medium transition-all flex items-center justify-center space-x-1 ${bodyModeInfo.color}`}
              >
                <span>{bodyModeInfo.icon}</span>
                <span className="truncate">{bodyModeInfo.label}</span>
              </button>

              <button
                onClick={onCycleNeuronScale}
                className="py-2 px-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors flex items-center justify-center space-x-1"
                title="Cambiar tamaño de los somas neuronales"
              >
                <span>🔍</span>
                <span className="truncate">{neuronScaleLabel}</span>
              </button>

              <button
                onClick={onResetView}
                className="py-2 px-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors flex items-center justify-center space-x-1"
              >
                <span>↺</span>
                <span>Reset</span>
              </button>
            </div>

            {/* Sub-tabs for content */}
            <div className="flex border-b border-slate-800 text-xs font-medium text-slate-400">
              <button
                onClick={() => setActiveTab('explore')}
                className={`flex-1 py-2 text-center border-b-2 transition-colors ${activeTab === 'explore' ? 'border-cyan-400 text-cyan-300' : 'border-transparent hover:text-white'}`}
              >
                🧪 Estímulos
              </button>
              <button
                onClick={() => setActiveTab('morphology')}
                className={`flex-1 py-2 text-center border-b-2 transition-colors ${activeTab === 'morphology' ? 'border-cyan-400 text-cyan-300' : 'border-transparent hover:text-white'}`}
              >
                ⭐ Morfología (30)
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex-1 py-2 text-center border-b-2 transition-colors ${activeTab === 'stats' ? 'border-cyan-400 text-cyan-300' : 'border-transparent hover:text-white'}`}
              >
                📊 Conectoma
              </button>
            </div>

            {/* Tab 1: Sensory Circuit Stimuli */}
            {activeTab === 'explore' && (
              <div className="space-y-4 animate-fade-in">
                <StimulusPanel
                  activeStimulus={activeStimulus}
                  onActivateStimulus={onActivateStimulus}
                  isSimulating={isSimulatingStimulus}
                />

                {/* Jump to Region */}
                <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30 space-y-2">
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Regiones Cerebrales</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {BRAIN_REGIONS.map(region => (
                      <button
                        key={region}
                        onClick={() => onJumpToRegion(region)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-950 border border-slate-700/80 hover:border-cyan-600/60 rounded-lg text-[11px] text-slate-300 hover:text-cyan-300 transition-all"
                      >
                        {region}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Advanced Visual Modes */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={isTouring ? onStopTour : onStartTour}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${isTouring ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-slate-800/60 text-cyan-400 border-cyan-500/40 hover:bg-cyan-950/40'}`}
                  >
                    {isTouring ? 'Detener Tour Guiado' : '🎯 Iniciar Tour por Regiones'}
                  </button>

                  <button
                    onClick={onToggleExplode}
                    className={`w-full py-2 px-2.5 rounded-xl border text-[11px] font-medium transition-all ${isExploded ? 'bg-indigo-500/25 text-indigo-300 border-indigo-500/50' : 'bg-slate-800/60 text-slate-400 border-slate-700'}`}
                  >
                    💥 {isExploded ? 'Colapsar a Posición Anatómica' : 'Separar por Capas / Regiones'}
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: 30 SWC Morphology Neurons */}
            {activeTab === 'morphology' && (
              <div className="space-y-3 animate-fade-in">
                <div className="bg-cyan-950/30 p-3 rounded-xl border border-cyan-700/40 text-xs text-slate-300 space-y-1">
                  <p className="font-bold text-cyan-300 flex items-center space-x-1.5">
                    <span>⭐</span>
                    <span>Reconstrucciones Dendríticas SWC Reales</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Estas 30 neuronas contienen el árbol morfológico 3D completo extraído del dataset de microscopía electrónica de FlyWire. Haz clic en cualquiera para enfocarla y visualizar sus ramificaciones.
                  </p>
                </div>

                <div className="space-y-1.5 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
                  {morphologyNeurons.map(n => (
                    <button
                      key={n.id}
                      onClick={() => onSelectNeuron(n)}
                      className="w-full text-left p-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 hover:border-cyan-500/60 rounded-xl transition-all flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: NEURON_TYPE_COLORS[n.type] || '#38bdf8' }}></span>
                        <div className="truncate">
                          <p className="text-white font-medium truncate">{n.label || n.cellType || `Neurona #${n.id.slice(-6)}`}</p>
                          <p className="text-[10px] text-slate-400">{n.region}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                        Ver 3D
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Connectome Statistics & NT Type Filters */}
            {activeTab === 'stats' && (
              <div className="space-y-4 animate-fade-in">
                <StatsPanel stats={stats} />

                {/* Filter by Neurotransmitter */}
                <div className="bg-slate-800/40 rounded-xl p-3.5 border border-slate-700/30 space-y-2.5">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Filtro por Neurotransmisor</h4>
                  <div className="space-y-2">
                    {Object.entries(NEURON_TYPE_COLORS).map(([type, color]) => {
                      const isVisible = visibleTypes?.has(type);
                      return (
                        <div key={type} className={`flex items-center justify-between text-xs transition-opacity ${isVisible ? 'opacity-100' : 'opacity-40'}`}>
                          <div className="flex items-center space-x-2.5 text-slate-300">
                            <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: color }}></span>
                            <span className="capitalize">{type}</span>
                          </div>
                          <div
                            onClick={() => onToggleType(type)}
                            className={`toggle-switch ${isVisible ? 'active' : ''} cursor-pointer`}
                          ></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Persistent Bottom Bar */}
      <div className="p-3 bg-slate-950/70 border-t border-slate-800/60 text-[11px] text-slate-400 flex justify-between items-center">
        <div>
          <span className="font-semibold text-slate-300">Neuronas:</span> {neurons.length.toLocaleString()}
        </div>
        <div>
          <span className="font-semibold text-slate-300">Sinapsis Reales:</span> {synapses.length.toLocaleString()}
        </div>
        <div>
          <span className="font-semibold text-cyan-400">Árboles SWC:</span> {morphologyNeurons.length}
        </div>
      </div>
    </div>
  );
}
