// Color constants for neurotransmitter types and brain regions
import * as THREE from 'three';

export const NT_COLORS = {
  'ACH': '#06b6d4',
  'GABA': '#a855f7',
  'GLUT': '#f97316',
  'DA': '#10b981',
  'SER': '#ec4899',
  'OCT': '#eab308',
  'unknown': '#64748b',
};

export const NT_LABELS = {
  'ACH': 'Acetilcolina (ACh)',
  'GABA': 'GABA',
  'GLUT': 'Glutamato',
  'DA': 'Dopamina',
  'SER': 'Serotonina',
  'OCT': 'Octopamina',
};

export const REGION_COLORS = {
  'Lóbulo Óptico': '#0ea5e9',
  'Lóbulo Antenal': '#6366f1',
  'Cuerpo Pedunculado': '#3b82f6',
  'Cuerpo Central': '#2dd4bf',
  'Protocerebro': '#06b6d4',
  'Ganglio Subesofágico': '#8b5cf6',
  'Centro Mecanosensorial': '#f59e0b',
};

export function getNtColor(ntType) {
  return NT_COLORS[ntType] || NT_COLORS.unknown;
}

export function getNtThreeColor(ntType) {
  return new THREE.Color(getNtColor(ntType));
}
