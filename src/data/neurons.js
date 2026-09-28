// Color mapping per neuron type
export const NEURON_TYPE_COLORS = {
  'Sensorial': '#06b6d4',      // cyan
  'Interneurona': '#a855f7',   // purple  
  'Motora': '#f97316',         // orange
  'Proyección': '#3b82f6',     // blue
  'Moduladora': '#10b981',     // emerald
};

// ~20 neurons with realistic Flywire-style IDs
// Positions in a rough ellipsoid shape
export const neurons = [
  // Lóbulo Óptico (Periphery, mostly Sensory & Interneurons)
  { id: '720575940617346657', position: [-3.8, 0, 0], type: 'Sensorial', neurotransmitter: 'Acetilcolina', region: 'Lóbulo Óptico', description: 'Neurona fotorreceptora R7 del ojo compuesto, especializada en detección de luz UV.' },
  { id: '720575940617346658', position: [-3.2, 0.5, 0.2], type: 'Sensorial', neurotransmitter: 'Acetilcolina', region: 'Lóbulo Óptico', description: 'Neurona fotorreceptora R8 del ojo compuesto.' },
  { id: '720575940617346659', position: [-3.5, -0.5, -0.2], type: 'Interneurona', neurotransmitter: 'GABA', region: 'Lóbulo Óptico', description: 'Interneurona local que proporciona inhibición lateral en la lámina.' },
  { id: '720575940617346660', position: [3.8, 0, 0], type: 'Sensorial', neurotransmitter: 'Acetilcolina', region: 'Lóbulo Óptico', description: 'Neurona fotorreceptora R7, lóbulo derecho.' },
  { id: '720575940617346661', position: [3.2, -0.5, 0.2], type: 'Interneurona', neurotransmitter: 'GABA', region: 'Lóbulo Óptico', description: 'Interneurona local inhibidora, lóbulo derecho.' },
  
  // Lóbulo Antenal (Olfaction)
  { id: '720575940617346662', position: [-1.5, 1.2, 1.5], type: 'Sensorial', neurotransmitter: 'Acetilcolina', region: 'Lóbulo Antenal', description: 'Neurona receptora olfativa (ORN) que detecta feromonas.' },
  { id: '720575940617346663', position: [1.5, 1.2, 1.5], type: 'Sensorial', neurotransmitter: 'Acetilcolina', region: 'Lóbulo Antenal', description: 'Neurona receptora olfativa (ORN) que detecta olores alimenticios.' },
  { id: '720575940617346664', position: [-1.2, 1.0, 1.2], type: 'Proyección', neurotransmitter: 'Acetilcolina', region: 'Lóbulo Antenal', description: 'Neurona de proyección (PN) uniglomerular.' },
  
  // Cuerpo Central (Central Complex)
  { id: '720575940617346665', position: [0, 0, -1], type: 'Interneurona', neurotransmitter: 'GABA', region: 'Cuerpo Central', description: 'Neurona del cuerpo elipsoide involucrada en navegación.' },
  { id: '720575940617346666', position: [0, -0.2, -1.2], type: 'Interneurona', neurotransmitter: 'Glutamato', region: 'Cuerpo Central', description: 'Neurona de la protuberancia (noduli).' },
  { id: '720575940617346667', position: [0.2, 0.3, -0.8], type: 'Proyección', neurotransmitter: 'Acetilcolina', region: 'Cuerpo Central', description: 'Neurona de proyección hacia los cuerpos en abanico.' },

  // Cuerpo Pedunculado (Mushroom Body) - Learning & Memory
  { id: '720575940617346668', position: [-1, 1.5, -0.5], type: 'Interneurona', neurotransmitter: 'Glutamato', region: 'Cuerpo Pedunculado', description: 'Célula Kenyon que integra información olfativa.' },
  { id: '720575940617346669', position: [1, 1.5, -0.5], type: 'Interneurona', neurotransmitter: 'Glutamato', region: 'Cuerpo Pedunculado', description: 'Célula Kenyon principal (Mushroom body).' },
  { id: '720575940617346670', position: [0, 1.8, -0.2], type: 'Moduladora', neurotransmitter: 'Dopamina', region: 'Cuerpo Pedunculado', description: 'Neurona dopaminérgica moduladora del aprendizaje de aversión.' },
  { id: '720575940617346671', position: [-1.2, 1.8, 0], type: 'Moduladora', neurotransmitter: 'Octopamina', region: 'Cuerpo Pedunculado', description: 'Neurona octopaminérgica moduladora del aprendizaje de recompensa.' },

  // Protocerebro (Higher processing)
  { id: '720575940617346672', position: [-0.5, 0.8, -1.5], type: 'Interneurona', neurotransmitter: 'Acetilcolina', region: 'Protocerebro', description: 'Interneurona integradora multisensorial.' },
  { id: '720575940617346673', position: [0.5, 0.8, -1.5], type: 'Interneurona', neurotransmitter: 'Acetilcolina', region: 'Protocerebro', description: 'Interneurona protocerebral anterior.' },

  // Ganglio Subesofágico (Motor control / Feeding)
  { id: '720575940617346674', position: [0, -1.5, 0.5], type: 'Motora', neurotransmitter: 'Glutamato', region: 'Ganglio Subesofágico', description: 'Neurona motora de la probóscide (alimentación).' },
  { id: '720575940617346675', position: [-0.2, -1.8, 0.8], type: 'Motora', neurotransmitter: 'Glutamato', region: 'Ganglio Subesofágico', description: 'Neurona motora del cuello.' },
  { id: '720575940617346676', position: [0.2, -1.8, 0.8], type: 'Moduladora', neurotransmitter: 'Serotonina', region: 'Ganglio Subesofágico', description: 'Neurona serotoninérgica que regula el estado de alimentación.' },
];

export const synapses = [
  // Retina -> Lamina
  { from: '720575940617346657', to: '720575940617346659', weight: 0.8 },
  { from: '720575940617346658', to: '720575940617346659', weight: 0.7 },
  { from: '720575940617346660', to: '720575940617346661', weight: 0.9 },
  
  // Antennal Lobe ORNs -> PNs
  { from: '720575940617346662', to: '720575940617346664', weight: 0.95 },
  { from: '720575940617346663', to: '720575940617346664', weight: 0.6 },
  
  // PNs -> Mushroom Body (Kenyon Cells)
  { from: '720575940617346664', to: '720575940617346668', weight: 0.5 },
  { from: '720575940617346664', to: '720575940617346669', weight: 0.55 },
  
  // Dopaminergic modulation of MB
  { from: '720575940617346670', to: '720575940617346668', weight: 1.0 },
  { from: '720575940617346671', to: '720575940617346669', weight: 1.0 },

  // MB -> Protocerebrum
  { from: '720575940617346668', to: '720575940617346672', weight: 0.75 },
  { from: '720575940617346669', to: '720575940617346673', weight: 0.7 },
  
  // Central Complex processing
  { from: '720575940617346672', to: '720575940617346665', weight: 0.4 },
  { from: '720575940617346665', to: '720575940617346667', weight: 0.85 },
  { from: '720575940617346666', to: '720575940617346665', weight: 0.65 },

  // Protocerebrum -> SEZ (Descending control)
  { from: '720575940617346672', to: '720575940617346674', weight: 0.9 },
  { from: '720575940617346673', to: '720575940617346675', weight: 0.8 },
  
  // SEZ internal
  { from: '720575940617346676', to: '720575940617346674', weight: 0.7 },
  { from: '720575940617346676', to: '720575940617346675', weight: 0.6 },
];

export function getNeuronById(id) {
  return neurons.find(n => n.id === id) || null;
}

export function getConnectionsForNeuron(id) {
  return synapses.filter(s => s.from === id || s.to === id);
}

export const BRAIN_REGIONS = [...new Set(neurons.map(n => n.region))];
