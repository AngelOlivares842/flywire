import { useState, useCallback, useRef } from 'react';
import { STIMULUS_CIRCUITS } from '../data/neurons.js';

export function useStimulusSimulation(neurons, synapses) {
  const [activeStimulus, setActiveStimulus] = useState(null);
  const [stimulusActivated, setStimulusActivated] = useState(new Set());
  const [stimulusPulses, setStimulusPulses] = useState([]);
  const [isSimulatingStimulus, setIsSimulatingStimulus] = useState(false);
  const timerRef = useRef(null);

  const clearStimulus = useCallback(() => {
    clearTimeout(timerRef.current);
    setActiveStimulus(null);
    setStimulusActivated(new Set());
    setStimulusPulses([]);
    setIsSimulatingStimulus(false);
  }, []);

  const activateStimulus = useCallback((stimulusKey) => {
    if (!stimulusKey) { clearStimulus(); return; }
    if (isSimulatingStimulus) return;

    const circuit = STIMULUS_CIRCUITS[stimulusKey];
    if (!circuit) return;

    setActiveStimulus(stimulusKey);
    setIsSimulatingStimulus(true);

    // Phase 1: Find source neurons matching the circuit
    const sourceNeurons = neurons.filter(n =>
      circuit.sourceRegions.includes(n.region) &&
      circuit.sourceNtTypes.includes(n.type)
    );

    // Take a random subset (max 50) for visual clarity
    const shuffled = [...sourceNeurons].sort(() => Math.random() - 0.5);
    const sources = shuffled.slice(0, Math.min(50, shuffled.length));
    const sourceIds = new Set(sources.map(n => n.id));

    setStimulusActivated(sourceIds);

    // Phase 2: After 800ms, propagate to connected neurons
    timerRef.current = setTimeout(() => {
      const nextIds = new Set();
      const newPulses = [];

      for (const syn of synapses) {
        if (sourceIds.has(syn.from)) {
          nextIds.add(syn.to);
          newPulses.push({
            id: `stim-${syn.from}-${syn.to}-${Math.random().toString(36).slice(2,6)}`,
            fromId: syn.from,
            toId: syn.to,
            color: circuit.color,
          });
        }
      }

      setStimulusPulses(newPulses.slice(0, 100)); // Limit for performance

      // Phase 3: Activate targets
      timerRef.current = setTimeout(() => {
        setStimulusActivated(prev => new Set([...prev, ...nextIds]));
        setStimulusPulses([]);

        // Phase 4: Find targets in target regions for final cascade
        const targetNeurons = neurons.filter(n =>
          circuit.targetRegions.includes(n.region)
        );
        const targetSample = targetNeurons.sort(() => Math.random() - 0.5).slice(0, 40);
        const targetIds = new Set(targetSample.map(n => n.id));

        timerRef.current = setTimeout(() => {
          setStimulusActivated(prev => new Set([...prev, ...targetIds]));

          // Auto-clear after 3 seconds
          timerRef.current = setTimeout(() => {
            clearStimulus();
          }, 3000);
        }, 600);
      }, 800);
    }, 800);
  }, [neurons, synapses, isSimulatingStimulus, clearStimulus]);

  return {
    activeStimulus,
    stimulusActivated,
    stimulusPulses,
    isSimulatingStimulus,
    activateStimulus,
    clearStimulus,
  };
}
