import * as THREE from 'three';

export const getRegionOffset = (region) => {
  // A much cleaner "Layers" (Capas) vertical stack representation
  switch (region) {
    case 'Cuerpo Pedunculado': 
      return new THREE.Vector3(0, 25, 0);
    case 'Protocerebro': 
      return new THREE.Vector3(0, 12, 0);
    case 'Cuerpo Central': 
      return new THREE.Vector3(0, 0, 0);
    case 'Lóbulo Óptico Izquierdo': 
      return new THREE.Vector3(-20, 0, 0);
    case 'Lóbulo Óptico Derecho': 
      return new THREE.Vector3(20, 0, 0);
    case 'Lóbulo Antenal': 
      return new THREE.Vector3(0, -12, 0);
    case 'Ganglio Subesofágico': 
      return new THREE.Vector3(0, -25, 0);
    default: 
      return new THREE.Vector3(0, 0, 0);
  }
};
