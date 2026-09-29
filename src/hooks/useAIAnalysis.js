import { useState, useEffect, useRef, useCallback } from 'react';

export function useAIAnalysis(selectedNeuron) {
  const [aiStatus, setAiStatus] = useState('idle');
  const [progressText, setProgressText] = useState('');
  const [analysisText, setAnalysisText] = useState('');
  const workerRef = useRef(null);
  const lastNeuronIdRef = useRef(null);
  const webGPUAvailable = useRef(null);

  // Initialize worker
  useEffect(() => {
    try {
      workerRef.current = new Worker(
        new URL('../workers/aiWorker.js', import.meta.url),
        { type: 'module' }
      );

      workerRef.current.onmessage = (e) => {
        const { type, available, progress, text, error } = e.data;
        switch (type) {
          case 'WEBGPU_AVAILABLE':
            webGPUAvailable.current = available;
            if (!available) setAiStatus('no-webgpu');
            break;
          case 'PROGRESS':
            setProgressText(progress);
            break;
          case 'READY':
            setAiStatus('ready');
            setProgressText('');
            break;
          case 'STREAM_CHUNK':
            setAnalysisText(prev => prev + text);
            break;
          case 'STREAM_DONE':
            setAiStatus('ready');
            break;
          case 'ERROR':
            setAiStatus('error');
            setProgressText(error);
            // Fallback to API
            break;
        }
      };

      workerRef.current.postMessage({ type: 'CHECK_WEBGPU' });
    } catch (err) {
      console.warn('AI Worker failed to initialize:', err);
      setAiStatus('no-webgpu');
    }

    return () => workerRef.current?.terminate();
  }, []);

  // React to neuron selection changes
  useEffect(() => {
    if (!selectedNeuron) {
      setAnalysisText('');
      lastNeuronIdRef.current = null;
      return;
    }

    if (selectedNeuron.id === lastNeuronIdRef.current) return;
    lastNeuronIdRef.current = selectedNeuron.id;

    // Build rich neuron data for analysis
    const neuronData = {
      id: selectedNeuron.id,
      type: selectedNeuron.type,
      neurotransmitter: selectedNeuron.neurotransmitter,
      region: selectedNeuron.region,
      label: selectedNeuron.label || '',
      cellType: selectedNeuron.cellType || '',
      description: selectedNeuron.description || '',
      connectionCount: selectedNeuron.connectionCount || 0,
      hemisphere: selectedNeuron.hemisphere || '',
      neuropil: selectedNeuron.neuropil || '',
      ntScores: selectedNeuron.ntScores || {},
    };

    if (aiStatus === 'no-webgpu' || aiStatus === 'error') {
      // Fallback: try server API
      fetchAPIAnalysis(neuronData);
    } else if (aiStatus === 'idle') {
      setAiStatus('loading');
      setAnalysisText('');
      workerRef.current?.postMessage({ type: 'INIT' });
      // Store pending request
      lastNeuronIdRef.current = null; // Will re-trigger after READY
    } else if (aiStatus === 'ready') {
      setAiStatus('thinking');
      setAnalysisText('');
      workerRef.current?.postMessage({ type: 'ANALYZE', data: neuronData });
    }
  }, [selectedNeuron, aiStatus]);

  const fetchAPIAnalysis = useCallback(async (neuronData) => {
    setAiStatus('thinking');
    setAnalysisText('');
    setProgressText('Consultando Gemini...');
    try {
      const res = await fetch('/api/analisis-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(neuronData),
      });
      const data = await res.json();
      setAnalysisText(data.analysis || 'Sin respuesta.');
      setAiStatus('ready');
    } catch (err) {
      // Final fallback: generate local description
      const desc = generateLocalDescription(neuronData);
      setAnalysisText(desc);
      setAiStatus('ready');
    }
    setProgressText('');
  }, []);

  return { status: aiStatus, progressText, analysisText };
}

function generateLocalDescription(n) {
  const ntDesc = {
    'ACH': 'utiliza acetilcolina como neurotransmisor principal, mediando sinapsis excitatorias rápidas',
    'GABA': 'es GABAérgica, proporcionando inhibición esencial para el procesamiento neural',
    'GLUT': 'utiliza glutamato, un neurotransmisor excitatorio clave en circuitos motores y sensoriales',
    'DA': 'es dopaminérgica, modulando el aprendizaje por recompensa y la motivación',
    'SER': 'es serotoninérgica, regulando el estado emocional y comportamientos rítmicos',
    'OCT': 'utiliza octopamina (análogo de noradrenalina), modulando respuestas de estrés y vigilia',
  };
  const regionDesc = {
    'Lóbulo Óptico': 'Se encuentra en el lóbulo óptico, donde procesa información visual del ojo compuesto.',
    'Lóbulo Antenal': 'Localizada en el lóbulo antenal, el primer centro de procesamiento olfativo del cerebro.',
    'Cuerpo Pedunculado': 'Forma parte del cuerpo pedunculado (mushroom body), estructura central para el aprendizaje y la memoria.',
    'Cuerpo Central': 'Pertenece al complejo central, involucrado en la navegación espacial y el control motor.',
    'Protocerebro': 'Se ubica en el protocerebro, una región de integración multisensorial de alto nivel.',
    'Ganglio Subesofágico': 'Localizada en la zona subesofágica, controla comportamientos motores como la alimentación y locomoción.',
    'Centro Mecanosensorial': 'Forma parte del centro mecanosensorial, procesando información de las antenas Johnston.',
  };

  let text = `Esta neurona (${n.label || n.cellType || String(n.id).slice(-6)}) `;
  text += ntDesc[n.type] || 'tiene un perfil neuroquímico mixto';
  text += '. ';
  text += regionDesc[n.region] || '';
  text += ' ';
  if (n.connectionCount > 0) {
    text += `Posee ${n.connectionCount} conexiones sinápticas en la muestra visualizada`;
    if (n.connectionCount > 20) text += ', siendo un nodo altamente conectado en la red neural';
    text += '.';
  }
  return text;
}
