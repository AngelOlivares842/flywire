// Neuron type colors - maps neurotransmitter codes to colors
export const NEURON_TYPE_COLORS = {
  'ACH': '#06b6d4',
  'GABA': '#a855f7',
  'GLUT': '#f97316',
  'DA': '#10b981',
  'SER': '#ec4899',
  'OCT': '#eab308',
  'unknown': '#64748b',
};

export const NEURON_TYPE_LABELS = {
  'ACH': 'Acetilcolina',
  'GABA': 'GABA',
  'GLUT': 'Glutamato',
  'DA': 'Dopamina',
  'SER': 'Serotonina',
  'OCT': 'Octopamina',
};

export const BRAIN_REGIONS = [
  'Lóbulo Óptico',
  'Lóbulo Antenal',
  'Cuerpo Pedunculado',
  'Cuerpo Central',
  'Protocerebro',
  'Ganglio Subesofágico',
  'Centro Mecanosensorial',
];

export const REGION_COLORS = {
  'Lóbulo Óptico': '#0ea5e9',
  'Lóbulo Antenal': '#6366f1',
  'Cuerpo Pedunculado': '#3b82f6',
  'Cuerpo Central': '#2dd4bf',
  'Protocerebro': '#06b6d4',
  'Ganglio Subesofágico': '#8b5cf6',
  'Centro Mecanosensorial': '#f59e0b',
};

// Stimulus circuit definitions for sensory simulation
export const STIMULUS_CIRCUITS = {
  light: {
    label: '💡 Luz',
    description: 'Fotorreceptores → Lóbulo Óptico → Protocerebro',
    sourceRegions: ['Lóbulo Óptico'],
    sourceNtTypes: ['ACH'],
    targetRegions: ['Protocerebro', 'Cuerpo Central'],
    color: '#fbbf24',
    flyReaction: 'eyes',
  },
  odor: {
    label: '🌸 Olor',
    description: 'ORNs → Lóbulo Antenal → Cuerpo Pedunculado (memoria)',
    sourceRegions: ['Lóbulo Antenal'],
    sourceNtTypes: ['ACH'],
    targetRegions: ['Cuerpo Pedunculado'],
    color: '#a78bfa',
    flyReaction: 'antennae',
  },
  danger: {
    label: '⚡ Peligro',
    description: 'Respuesta de escape rápida → Neuronas motoras',
    sourceRegions: ['Protocerebro'],
    sourceNtTypes: ['ACH', 'GLUT'],
    targetRegions: ['Ganglio Subesofágico'],
    color: '#ef4444',
    flyReaction: 'wings',
  },
  food: {
    label: '🍯 Alimento',
    description: 'Gusto → Ganglio subesofágico → Modulación dopaminérgica',
    sourceRegions: ['Ganglio Subesofágico'],
    sourceNtTypes: ['DA', 'SER'],
    targetRegions: ['Cuerpo Pedunculado'],
    color: '#22c55e',
    flyReaction: 'proboscis',
  },
};

export function getNeuronById(neurons, id) {
  return neurons.find(n => n.id === id) || null;
}

export function getConnectionsForNeuron(synapses, id) {
  return synapses.filter(s => s.from === id || s.to === id);
}
