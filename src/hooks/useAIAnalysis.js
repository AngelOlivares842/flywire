import { useState, useEffect, useRef, useCallback } from 'react';

export function useAIAnalysis() {
  const [aiStatus, setAiStatus] = useState('idle'); // 'idle' | 'loading' | 'ready' | 'thinking' | 'error' | 'no-webgpu'
  const [progressText, setProgressText] = useState('');
  const [analysisText, setAnalysisText] = useState('');
  
  const workerRef = useRef(null);
  const pendingNeuronRef = useRef(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/aiWorker.js', import.meta.url), { type: 'module' });
    
    workerRef.current.onmessage = (e) => {
      const { type, available, progress, text, error } = e.data;
      
      switch (type) {
        case 'WEBGPU_AVAILABLE':
          if (!available) {
            setAiStatus('no-webgpu');
          }
          break;
        case 'PROGRESS':
          setProgressText(progress);
          break;
        case 'READY':
          setAiStatus('ready');
          setProgressText('');
          break;
        case 'STREAM_CHUNK':
          setAnalysisText((prev) => prev + text);
          break;
        case 'STREAM_DONE':
          setAiStatus('ready');
          break;
        case 'ERROR':
          setAiStatus('error');
          setProgressText(error);
          break;
        default:
          break;
      }
    };

    workerRef.current.postMessage({ type: 'CHECK_WEBGPU' });

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const startAnalysis = useCallback((neuron) => {
    setAiStatus('thinking');
    setAnalysisText('');
    workerRef.current?.postMessage({ type: 'ANALYZE', data: neuron });
  }, []);

  const requestAnalysis = useCallback((neuron) => {
    if (aiStatus === 'idle') {
      setAiStatus('loading');
      pendingNeuronRef.current = neuron;
      workerRef.current?.postMessage({ type: 'INIT' });
    } else if (aiStatus === 'loading' || aiStatus === 'thinking') {
      pendingNeuronRef.current = neuron;
    } else if (aiStatus === 'ready') {
      startAnalysis(neuron);
    }
  }, [aiStatus, startAnalysis]);

  useEffect(() => {
    if (aiStatus === 'ready' && pendingNeuronRef.current) {
      const neuron = pendingNeuronRef.current;
      pendingNeuronRef.current = null;
      startAnalysis(neuron);
    }
  }, [aiStatus, startAnalysis]);

  const resetAnalysis = useCallback(() => {
    setAnalysisText('');
    pendingNeuronRef.current = null;
    if (aiStatus === 'thinking') {
       // Reset visual state even if worker is still thinking.
       setAiStatus('ready');
    }
  }, [aiStatus]);

  return {
    aiStatus,
    progressText,
    analysisText,
    requestAnalysis,
    resetAnalysis,
  };
}
