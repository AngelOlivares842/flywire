const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, searchVal, replaceVal) {
    if (!fs.existsSync(filePath)) {
        console.error("File not found: " + filePath);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.split(searchVal).join(replaceVal);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Patched: " + filePath);
}

const dir = "c:/Users/angel/Documents/GitHub/RedCiclach/flywire/src/components";

// 1. NeuronNode.jsx
const neuronNode = path.join(dir, 'NeuronNode.jsx');
replaceInFile(neuronNode, 'position={[neuron.position.x, neuron.position.y, neuron.position.z]}', 'position={[neuron.position[0], neuron.position[1], neuron.position[2]]}');
replaceInFile(neuronNode, 'args={[0.15, 32, 32]}', 'args={[0.25, 32, 32]}');
replaceInFile(neuronNode, 't * 2 + neuron.id', 't * 2 + parseInt(neuron.id.slice(-4))');

// 2. SynapticLink.jsx
const synapticLink = path.join(dir, 'SynapticLink.jsx');
replaceInFile(synapticLink, 'start.x, start.y, start.z', 'start[0], start[1], start[2]');
replaceInFile(synapticLink, 'end.x, end.y, end.z', 'end[0], end[1], end[2]');
replaceInFile(synapticLink, "'#334155'", "'#475569'");
replaceInFile(synapticLink, 'Math.max(0.5, weight * 0.5)', 'Math.max(1.0, weight * 1.5)');
replaceInFile(synapticLink, 'isActive ? 0.8 : 0.3', 'isActive ? 0.8 : 0.4');

// 3. BrainScene.jsx
const brainScene = path.join(dir, 'BrainScene.jsx');
replaceInFile(brainScene, 'cameraTarget = null,\n  highlightedSynapses = new Set()', 'cameraTarget = null,\n  highlightedSynapses = new Set(),\n  isXRay = false');
replaceInFile(brainScene, '<DrosophilaModel opacity={1} />', '<DrosophilaModel opacity={isXRay ? 0.05 : 1} />');

// 4. DrosophilaModel.jsx
const drosophilaModel = path.join(dir, 'DrosophilaModel.jsx');
replaceInFile(drosophilaModel, '<planeGeometry args={[4, 2]} />\n          <meshPhysicalMaterial color="#a5b4fc" transparent opacity={0.08 * opacity} depthWrite={false} side={THREE.DoubleSide} />', '<sphereGeometry args={[1, 16, 16]} />\n          <meshPhysicalMaterial color="#a5b4fc" transparent opacity={0.08 * opacity} depthWrite={false} />');
replaceInFile(drosophilaModel, '<mesh position={[-2, 0, 0]} rotation={[0, 0, 0.2]}>', '<mesh position={[-2, 0, 0]} rotation={[0, 0, 0.2]} scale={[2, 0.05, 1]}>');
replaceInFile(drosophilaModel, '<mesh position={[2, 0, 0]} rotation={[0, 0, -0.2]}>', '<mesh position={[2, 0, 0]} rotation={[0, 0, -0.2]} scale={[2, 0.05, 1]}>');

// 5. api/analisis-ia.js
const apiPath = "c:/Users/angel/Documents/GitHub/RedCiclach/flywire/src/pages/api/analisis-ia.js";
replaceInFile(apiPath, 'export const prerender = false;', '// export const prerender = false;');

console.log("All patches applied.");
