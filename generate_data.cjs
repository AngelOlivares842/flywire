const fs = require('fs');

const BRAIN_REGIONS = [
  'Lóbulo Óptico Izquierdo',
  'Lóbulo Óptico Derecho',
  'Lóbulo Antenal',
  'Cuerpo Central',
  'Cuerpo Pedunculado',
  'Protocerebro',
  'Ganglio Subesofágico'
];

const NEURON_TYPES = [
  'Sensorial',
  'Interneurona',
  'Motora',
  'Proyección',
  'Moduladora'
];

const NEUROTRANSMITTERS = [
  'Acetilcolina (ACh)',
  'GABA',
  'Glutamato',
  'Dopamina',
  'Serotonina',
  'Octopamina'
];

// Generate 200 neurons
const neurons = [];
let idCounter = 720575940617000000n;

for (let i = 0; i < 200; i++) {
  const region = BRAIN_REGIONS[Math.floor(Math.random() * BRAIN_REGIONS.length)];
  const type = NEURON_TYPES[Math.floor(Math.random() * NEURON_TYPES.length)];
  const neurotransmitter = NEUROTRANSMITTERS[Math.floor(Math.random() * NEUROTRANSMITTERS.length)];
  
  let x = 0, y = 0, z = 0;
  
  // Base coordinates by region to create a realistic spatial grouping
  switch (region) {
    case 'Lóbulo Óptico Izquierdo':
      x = -5 + (Math.random() * 3 - 1.5);
      y = 1 + (Math.random() * 4 - 2);
      z = 0 + (Math.random() * 3 - 1.5);
      break;
    case 'Lóbulo Óptico Derecho':
      x = 5 + (Math.random() * 3 - 1.5);
      y = 1 + (Math.random() * 4 - 2);
      z = 0 + (Math.random() * 3 - 1.5);
      break;
    case 'Lóbulo Antenal':
      x = (Math.random() * 2 - 1);
      y = 0 + (Math.random() * 2 - 1);
      z = 4 + (Math.random() * 2 - 1);
      break;
    case 'Cuerpo Central':
      x = (Math.random() * 2 - 1);
      y = 2 + (Math.random() * 2 - 1);
      z = 0 + (Math.random() * 2 - 1);
      break;
    case 'Cuerpo Pedunculado':
      x = (Math.random() * 3 - 1.5);
      y = 3 + (Math.random() * 2 - 1);
      z = -2 + (Math.random() * 2 - 1);
      break;
    case 'Protocerebro':
      x = (Math.random() * 4 - 2);
      y = 4 + (Math.random() * 2 - 1);
      z = -1 + (Math.random() * 3 - 1.5);
      break;
    case 'Ganglio Subesofágico':
      x = (Math.random() * 2 - 1);
      y = -2 + (Math.random() * 2 - 1);
      z = 1 + (Math.random() * 2 - 1);
      break;
  }
  
  // Add some global spread
  x *= 1.8;
  y *= 1.8;
  z *= 1.8;

  neurons.push({
    id: (idCounter++).toString(),
    type,
    region,
    neurotransmitter,
    position: [x, y, z]
  });
}

// Generate 350 synapses
const synapses = [];
for (let i = 0; i < 350; i++) {
  // 70% chance to connect within the same region
  const sameRegion = Math.random() < 0.7;
  
  let source, target;
  if (sameRegion) {
    const region = BRAIN_REGIONS[Math.floor(Math.random() * BRAIN_REGIONS.length)];
    const regionNeurons = neurons.filter(n => n.region === region);
    if (regionNeurons.length < 2) continue;
    source = regionNeurons[Math.floor(Math.random() * regionNeurons.length)];
    target = regionNeurons[Math.floor(Math.random() * regionNeurons.length)];
  } else {
    source = neurons[Math.floor(Math.random() * neurons.length)];
    target = neurons[Math.floor(Math.random() * neurons.length)];
  }
  
  if (source.id !== target.id) {
    // Check if duplicate
    const exists = synapses.some(s => s.from === source.id && s.to === target.id);
    if (!exists) {
      synapses.push({
        from: source.id,
        to: target.id,
        weight: Math.random() * 0.8 + 0.2
      });
    }
  }
}

const data = { neurons, synapses };
fs.writeFileSync('public/data/brain_data.json', JSON.stringify(data, null, 2));
console.log('Generated brain_data.json with 200 neurons and 350 synapses.');
