const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const readline = require('readline');

const MOSCA_DIR = path.join(__dirname, 'mosca');
const SWC_DIR = path.join(MOSCA_DIR, 'sk_lod1_783_healed');
const OUTPUT_PATH = path.join(__dirname, 'public', 'data', 'brain_data.json');

// ── Helpers ──────────────────────────────────────────────────────────────────

function readGzCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath).pipe(zlib.createGunzip()),
      crlfDelay: Infinity,
    });
    let headers = null;
    rl.on('line', (line) => {
      if (!headers) { headers = line.split(',').map(h => h.trim()); return; }
      const vals = [];
      let current = '';
      let inBracket = false;
      for (const ch of line) {
        if (ch === '[') { inBracket = true; current += ch; }
        else if (ch === ']') { inBracket = false; current += ch; }
        else if (ch === ',' && !inBracket) { vals.push(current.trim()); current = ''; }
        else { current += ch; }
      }
      vals.push(current.trim());
      const obj = {};
      headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
      rows.push(obj);
    });
    rl.on('close', () => resolve(rows));
    rl.on('error', reject);
  });
}

function streamGzCSV(filePath, onRow) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath).pipe(zlib.createGunzip()),
      crlfDelay: Infinity,
    });
    let headers = null;
    let count = 0;
    rl.on('line', (line) => {
      if (!headers) { headers = line.split(',').map(h => h.trim()); return; }
      const vals = line.split(',').map(v => v.trim());
      const obj = {};
      headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
      onRow(obj);
      count++;
    });
    rl.on('close', () => resolve(count));
    rl.on('error', reject);
  });
}

function parsePosition(posStr) {
  const clean = posStr.replace(/[\[\]]/g, '').trim();
  const parts = clean.split(/\s+/).map(Number);
  return parts.length === 3 && parts.every(n => !isNaN(n)) ? parts : null;
}

// ── Neuropil → Region mapping ────────────────────────────────────────────────

function getRegion(neuropil) {
  if (!neuropil) return 'Protocerebro';
  const n = neuropil.toUpperCase().replace(/[._](L|R)$/g, '');
  // Visual system
  if (/^(ME|LO|LOP|AME)/.test(n)) return 'Lóbulo Óptico';
  // Olfactory
  if (/^AL/.test(n)) return 'Lóbulo Antenal';
  // Mushroom body
  if (/^(MB|CA|PED|A'L|AL_|B'L|BL|GL)/.test(n)) return 'Cuerpo Pedunculado';
  // Central complex
  if (/^(FB|EB|NO|PB)$/.test(n)) return 'Cuerpo Central';
  // Suboesophageal
  if (/^(GNG|PRW|SAD|SEZ)/.test(n)) return 'Ganglio Subesofágico';
  // Mechanosensory
  if (/^(AMMC|FLA|CAN|EPA|GOR)/.test(n)) return 'Centro Mecanosensorial';
  // Everything else → Protocerebro
  return 'Protocerebro';
}

const NT_LABELS = {
  'ACH': 'Acetilcolina', 'GABA': 'GABA', 'GLUT': 'Glutamato',
  'DA': 'Dopamina', 'SER': 'Serotonina', 'OCT': 'Octopamina',
};

const NT_DESCRIPTORS = {
  'ACH': 'colinérgica', 'GABA': 'GABAérgica', 'GLUT': 'glutamatérgica',
  'DA': 'dopaminérgica', 'SER': 'serotoninérgica', 'OCT': 'octopaminérgica',
};

// ── SWC Parsing ──────────────────────────────────────────────────────────────

function parseSWC(filePath, centerX, centerY, centerZ, scale) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
  const points = [];
  const parentRaw = [];
  const nodeMap = new Map();

  for (const line of lines) {
    const p = line.trim().split(/\s+/);
    if (p.length < 7) continue;
    const idx = points.length;
    nodeMap.set(parseInt(p[0]), idx);
    points.push([
      +((parseFloat(p[2]) - centerX) * scale).toFixed(3),
      +(-(parseFloat(p[3]) - centerY) * scale).toFixed(3),
      +(-(parseFloat(p[4]) - centerZ) * scale).toFixed(3),
      +(parseFloat(p[5]) * scale).toFixed(4)
    ]);
    parentRaw.push(parseInt(p[6]));
  }

  const parents = parentRaw.map(p => p === -1 ? -1 : (nodeMap.get(p) ?? -1));
  return { points, parents };
}

function simplifyMorphology(morph, maxPts = 400) {
  if (morph.points.length <= maxPts) return morph;
  const step = Math.ceil(morph.points.length / maxPts);
  const important = new Set();
  morph.parents.forEach((p, i) => { if (p === -1) important.add(i); });
  const childCount = new Map();
  morph.parents.forEach(p => { if (p >= 0) childCount.set(p, (childCount.get(p) || 0) + 1); });
  childCount.forEach((c, idx) => { if (c > 1) important.add(idx); });

  const indexMap = new Map();
  const newPts = [];
  const newPar = [];
  for (let i = 0; i < morph.points.length; i++) {
    if (important.has(i) || i % step === 0) {
      indexMap.set(i, newPts.length);
      newPts.push(morph.points[i]);
      newPar.push(-1);
    }
  }
  for (let oldIdx = 0; oldIdx < morph.parents.length; oldIdx++) {
    if (!indexMap.has(oldIdx)) continue;
    const newIdx = indexMap.get(oldIdx);
    let pOld = morph.parents[oldIdx];
    while (pOld >= 0 && !indexMap.has(pOld)) pOld = morph.parents[pOld];
    newPar[newIdx] = pOld >= 0 ? (indexMap.get(pOld) ?? -1) : -1;
  }
  return { points: newPts, parents: newPar };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  NeuroLab 3D — Generador de Datos Reales        ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // 1. Neurons
  console.log('1/6  Leyendo neurons.csv.gz …');
  const neuronsRaw = await readGzCSV(path.join(MOSCA_DIR, 'neurons.csv.gz'));
  console.log(`     → ${neuronsRaw.length.toLocaleString()} neuronas`);

  const neuronMap = new Map();
  for (const r of neuronsRaw) {
    neuronMap.set(r.root_id, {
      id: r.root_id,
      ntType: (r.nt_type || 'unknown').toUpperCase(),
      ntScore: parseFloat(r.nt_type_score) || 0,
      neuropil: r.group || '',
      ntScores: {
        ach: +(parseFloat(r.ach_avg) || 0).toFixed(3),
        gaba: +(parseFloat(r.gaba_avg) || 0).toFixed(3),
        glut: +(parseFloat(r.glut_avg) || 0).toFixed(3),
        da: +(parseFloat(r.da_avg) || 0).toFixed(3),
        ser: +(parseFloat(r.ser_avg) || 0).toFixed(3),
        oct: +(parseFloat(r.oct_avg) || 0).toFixed(3),
      }
    });
  }

  // 2. Coordinates
  console.log('2/6  Leyendo coordinates.csv.gz …');
  const coordsRaw = await readGzCSV(path.join(MOSCA_DIR, 'coordinates.csv.gz'));
  console.log(`     → ${coordsRaw.length.toLocaleString()} coordenadas`);

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  let posCount = 0;

  for (const r of coordsRaw) {
    const pos = parsePosition(r.position);
    if (!pos) continue;
    const n = neuronMap.get(r.root_id);
    if (n) {
      n.rawPos = pos;
      posCount++;
      minX = Math.min(minX, pos[0]); maxX = Math.max(maxX, pos[0]);
      minY = Math.min(minY, pos[1]); maxY = Math.max(maxY, pos[1]);
      minZ = Math.min(minZ, pos[2]); maxZ = Math.max(maxZ, pos[2]);
    }
  }

  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;
  const rangeMax = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
  const targetWidth = 54.0;
  const sceneScale = targetWidth / rangeMax;
  console.log(`     → ${posCount.toLocaleString()} con posición | Scale: ${sceneScale.toExponential(3)}`);

  // 3. Labels
  console.log('3/6  Leyendo labels …');
  const procLabels = await readGzCSV(path.join(MOSCA_DIR, 'processed_labels.csv.gz'));
  const labelMap = new Map();
  for (const r of procLabels) {
    const l = r.processed_labels?.replace(/[\[\]']/g, '').split(';')[0]?.trim();
    if (l) labelMap.set(r.root_id, l);
  }

  const columnRaw = await readGzCSV(path.join(MOSCA_DIR, 'column_assignment.csv.gz'));
  const colMap = new Map();
  for (const r of columnRaw) colMap.set(r.root_id, { hemisphere: r.hemisphere || '', cellType: r.type || '' });
  console.log(`     → ${labelMap.size.toLocaleString()} labels | ${colMap.size.toLocaleString()} columnas`);

  // 4. Build + sample
  console.log('4/6  Muestreo estratificado …');
  const valid = [];
  for (const [id, n] of neuronMap) {
    if (!n.rawPos) continue;
    const region = getRegion(n.neuropil);
    const col = colMap.get(id);
    const label = labelMap.get(id) || '';
    const ct = col?.cellType || label || '';
    const desc = `Neurona ${NT_DESCRIPTORS[n.ntType] || ''} ${ct ? ct + ' ' : ''}del ${region}${col?.hemisphere ? ' (' + col.hemisphere + ')' : ''}`.trim();
    valid.push({
      id, type: n.ntType, neuropil: n.neuropil, region,
      neurotransmitter: NT_LABELS[n.ntType] || n.ntType,
      label, cellType: ct, hemisphere: col?.hemisphere || '',
      ntScores: n.ntScores, description: desc,
      position: [
        +((n.rawPos[0] - cx) * sceneScale).toFixed(3),
        +(-(n.rawPos[1] - cy) * sceneScale).toFixed(3), // Dorsal on top (+Y), Ventral on bottom (-Y)
        +(-(n.rawPos[2] - cz) * sceneScale).toFixed(3)  // Anterior facing front (+Z)
      ]
    });
  }
  console.log(`     → ${valid.length.toLocaleString()} neuronas válidas`);

  const byRegion = {};
  for (const n of valid) { (byRegion[n.region] ??= []).push(n); }
  const TARGET = 2000;
  const perRegion = Math.ceil(TARGET / Object.keys(byRegion).length);
  const sampled = [];
  const sampledIds = new Set();

  for (const [region, pool] of Object.entries(byRegion)) {
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const take = Math.min(perRegion, pool.length);
    for (let i = 0; i < take; i++) { sampled.push(pool[i]); sampledIds.add(pool[i].id); }
  }

  for (const [region, pool] of Object.entries(byRegion)) {
    const c = sampled.filter(n => n.region === region).length;
    console.log(`     • ${region}: ${c} (de ${pool.length.toLocaleString()})`);
  }
  console.log(`     → Total muestreado: ${sampled.length}`);

  // 5. Connections
  console.log('5/6  Procesando conexiones (streaming ~68 MB) …');
  const synapses = [];
  let totalConn = 0;
  await streamGzCSV(path.join(MOSCA_DIR, 'connections_princeton.csv.gz'), (r) => {
    totalConn++;
    if (totalConn % 1000000 === 0) process.stdout.write(`     … ${(totalConn / 1e6).toFixed(1)}M filas\r`);
    if (sampledIds.has(r.pre_root_id) && sampledIds.has(r.post_root_id)) {
      synapses.push({
        from: r.pre_root_id, to: r.post_root_id,
        neuropil: r.neuropil || '', weight: parseInt(r.syn_count) || 1,
        ntType: r.nt_type || ''
      });
    }
  });
  console.log(`\n     → ${totalConn.toLocaleString()} total | ${synapses.length.toLocaleString()} entre muestra`);

  // Connection count
  const connCount = new Map();
  for (const s of synapses) {
    connCount.set(s.from, (connCount.get(s.from) || 0) + 1);
    connCount.set(s.to, (connCount.get(s.to) || 0) + 1);
  }
  for (const n of sampled) n.connectionCount = connCount.get(n.id) || 0;

  // 6. SWC morphologies
  console.log('6/6  Pre-procesando morfologías SWC …');
  const topIds = [...connCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30).map(([id]) => id);
  const morphologies = {};
  for (const nid of topIds) {
    const swcPath = path.join(SWC_DIR, `${nid}.swc`);
    if (!fs.existsSync(swcPath)) continue;
    try {
      const raw = parseSWC(swcPath, cx, cy, cz, sceneScale);
      const simplified = simplifyMorphology(raw, 400);
      morphologies[nid] = simplified;
      console.log(`     ✓ ${nid}: ${raw.points.length} → ${simplified.points.length} pts`);
    } catch (e) { console.log(`     ✗ ${nid}: ${e.message}`); }
  }

  // Stats
  const ntTypeCounts = {}, regionCounts = {};
  for (const n of valid) {
    ntTypeCounts[n.type] = (ntTypeCounts[n.type] || 0) + 1;
    regionCounts[n.region] = (regionCounts[n.region] || 0) + 1;
  }

  const output = {
    neurons: sampled, synapses, morphologies,
    stats: {
      totalNeurons: valid.length, totalSynapses: totalConn,
      sampledNeurons: sampled.length, sampledSynapses: synapses.length,
      morphologyCount: Object.keys(morphologies).length,
      ntTypeCounts, regionCounts
    }
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output));
  const mb = (fs.statSync(OUTPUT_PATH).size / 1024 / 1024).toFixed(2);

  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║  ✅  Generación completa                         ║`);
  console.log(`╠══════════════════════════════════════════════════╣`);
  console.log(`║  Archivo:      ${OUTPUT_PATH}`);
  console.log(`║  Tamaño:       ${mb} MB`);
  console.log(`║  Neuronas:     ${sampled.length}`);
  console.log(`║  Sinapsis:     ${synapses.length}`);
  console.log(`║  Morfologías:  ${Object.keys(morphologies).length}`);
  console.log(`╚══════════════════════════════════════════════════╝`);
}

main().catch(e => { console.error('ERROR FATAL:', e); process.exit(1); });
