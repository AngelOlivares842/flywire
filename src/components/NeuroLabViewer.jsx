// src/components/NeuroLabViewer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, Line } from '@react-three/drei';

const mockNeurons = [
  { id: '720575940617346657', position: [0, 0, 0], type: 'Sensorial', neurotransmitter: 'Acetilcolina' },
  { id: '720575940617346658', position: [2, 1, -1], type: 'Interneurona', neurotransmitter: 'GABA' },
  { id: '720575940617346659', position: [-1, 2, 1], type: 'Motora', neurotransmitter: 'Glutamato' }
];

export default function NeuroLabViewer() {
  const [selectedNeuron, setSelectedNeuron] = useState(null);
  const [aiStatus, setAiStatus] = useState('unloaded'); // 'unloaded' | 'loading' | 'ready' | 'thinking'
  const [progressText, setProgressText] = useState('');
  const [analysisText, setAnalysisText] = useState('');
  
  const workerRef = useRef(null);

  useEffect(() => {
    // Instanciar worker con soporte nativo de módulos en Vite/Astro
    workerRef.current = new Worker(
      new URL('../workers/aiWorker.js', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (event) => {
      const { type, progress, text, error } = event.data;

      if (type === 'PROGRESS') {
        setProgressText(progress);
      } else if (type === 'READY') {
        setAiStatus('ready');
      } else if (type === 'RESULT') {
        setAnalysisText(text);
        setAiStatus('ready');
      } else if (type === 'ERROR') {
        setAnalysisText(`Error: ${error}`);
        setAiStatus('ready');
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleSelectNeuron = (neuron) => {
    setSelectedNeuron(neuron);

    // Si aún no se cargó el modelo, se inicia la descarga bajo demanda
    if (aiStatus === 'unloaded') {
      setAiStatus('loading');
      workerRef.current.postMessage({ type: 'INIT' });
    }

    if (aiStatus === 'ready') {
      setAiStatus('thinking');
      setAnalysisText('');
      workerRef.current.postMessage({ type: 'ANALYZE', data: neuron });
    }
  };

  return (
    <div className="w-full h-full flex relative overflow-hidden bg-slate-950 font-sans">
      {/* Visor 3D: renderizado fluido sin interrupciones */}
      <div className="flex-1 h-full relative">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 10, 10]} />
          <OrbitControls makeDefault />

          {mockNeurons.map((n) => (
            <Sphere
              key={n.id}
              position={n.position}
              args={[0.25, 32, 32]}
              onClick={() => handleSelectNeuron(n)}
              onPointerOver={() => (document.body.style.cursor = 'pointer')}
              onPointerOut={() => (document.body.style.cursor = 'auto')}
            >
              <meshStandardMaterial
                color={selectedNeuron?.id === n.id ? "#06b6d4" : "#ec4899"}
                emissive={selectedNeuron?.id === n.id ? "#06b6d4" : "#000000"}
                emissiveIntensity={0.5}
              />
            </Sphere>
          ))}
          <Line points={[mockNeurons[0].position, mockNeurons[1].position]} color="rgba(255,255,255,0.2)" lineWidth={2} />
          <Line points={[mockNeurons[0].position, mockNeurons[2].position]} color="rgba(255,255,255,0.2)" lineWidth={2} />
        </Canvas>
      </div>

      {/* Panel lateral con Tailwind CSS */}
      <aside className="w-96 bg-slate-900/80 backdrop-blur-md border-l border-slate-800 p-6 flex flex-col justify-between text-slate-100">
        <div>
          <h2 className="text-xl font-bold tracking-wide text-cyan-400 mb-4">Inspección de Nodo</h2>

          {selectedNeuron ? (
            <div className="space-y-4">
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
                <span className="text-xs text-slate-400 uppercase font-semibold">ID Flywire</span>
                <p className="font-mono text-sm text-cyan-300">{selectedNeuron.id}</p>
                <div className="mt-3 flex justify-between text-sm">
                  <div>
                    <span className="text-xs text-slate-400 block">Tipo</span>
                    <span>{selectedNeuron.type}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Neurotransmisor</span>
                    <span>{selectedNeuron.neurotransmitter}</span>
                  </div>
                </div>
              </div>

              {/* Estado y resultado de la inferencia local */}
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 min-h-[160px]">
                <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">Tutor Local (0.5B)</h3>

                {aiStatus === 'loading' && (
                  <div className="text-xs text-yellow-400 space-y-2">
                    <p className="font-medium animate-pulse">Cargando modelo a la GPU...</p>
                    <p className="text-slate-400 truncate">{progressText}</p>
                  </div>
                )}

                {aiStatus === 'thinking' && (
                  <p className="text-sm text-cyan-400 animate-pulse">Analizando conectoma...</p>
                )}

                {aiStatus === 'ready' && analysisText && (
                  <p className="text-sm text-slate-200 leading-relaxed">{analysisText}</p>
                )}

                {aiStatus === 'unloaded' && (
                  <p className="text-xs text-slate-500">Selecciona este nodo para inicializar el análisis local.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Haz clic en un nodo neuronal del visor 3D para comenzar.</p>
          )}
        </div>

        <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-3">
          Motor: WebGPU • Memoria aproximada: &lt; 400 MB
        </div>
      </aside>
    </div>
  );
}