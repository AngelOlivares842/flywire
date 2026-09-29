import React, { useState } from 'react';

/**
 * Real-time Neural Minimap & Biophysical Activity Radar.
 * Displays live sensory transduction, region-by-region connectome excitation,
 * and emergent motor decisions.
 */
export default function NeuralMinimap({
  telemetry = {},
  sensoryFlux = { lightL: 0, lightR: 0, odorL: 0, odorR: 0, wallProximity: 0, relAngle: 0, targetDist: 0 },
  activeStimulusType = 'light',
  isArenaMode = false,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const {
    speed = '0.0',
    heading = 0,
    activeNeurons = 0,
    wingHz = 120,
    leftMotor = '0',
    rightMotor = '0',
  } = telemetry;

  const {
    lightL = 0,
    lightR = 0,
    odorL = 0,
    odorR = 0,
    wallProximity = 0,
    relAngle = 0,
    targetDist = 0,
  } = sensoryFlux;

  // Compute behavioral state diagnosis
  let behavioralState = '🕊️ Exploración Espontánea';
  let stateColor = 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10';

  if (wallProximity > 0.1) {
    behavioralState = '⚡ Evasión Mecanosensorial (Pared)';
    stateColor = 'text-red-400 border-red-500/40 bg-red-500/10';
  } else if (activeStimulusType === 'light' && (lightL > 0.05 || lightR > 0.05)) {
    if (Math.abs(lightL - lightR) < 0.08) {
      behavioralState = '💡 Fototaxis Frontal: Acelerando';
      stateColor = 'text-amber-300 border-amber-500/40 bg-amber-500/10';
    } else if (lightR > lightL) {
      behavioralState = '💡 Fototaxis: Virando a Estribor (Der)';
      stateColor = 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    } else {
      behavioralState = '💡 Fototaxis: Virando a Babor (Izq)';
      stateColor = 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    }
  } else if (activeStimulusType === 'odor' && (odorL > 0.05 || odorR > 0.05)) {
    behavioralState = '🌸 Búsqueda Quimiotáctica por Gradiente';
    stateColor = 'text-purple-400 border-purple-500/40 bg-purple-500/10';
  }

  // Sensory intensity percentage
  const pctLightL = Math.min(100, Math.round(lightL * 100));
  const pctLightR = Math.min(100, Math.round(lightR * 100));
  const pctOdorL = Math.min(100, Math.round(odorL * 100));
  const pctOdorR = Math.min(100, Math.round(odorR * 100));

  // Visual eye glow for schematic
  const eyeGlowL = activeStimulusType === 'light' ? `rgba(245, 158, 11, ${0.2 + lightL * 0.8})` : '#38bdf8';
  const eyeGlowR = activeStimulusType === 'light' ? `rgba(245, 158, 11, ${0.2 + lightR * 0.8})` : '#38bdf8';

  return (
    <div className="absolute top-4 left-4 z-30 pointer-events-auto select-none transition-all">
      <div className="bg-slate-900/90 backdrop-blur-xl border border-cyan-500/40 rounded-2xl shadow-[0_0_30px_rgba(2,6,23,0.8)] overflow-hidden w-[290px]">
        {/* Header */}
        <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-xs font-bold text-white tracking-wider uppercase">Minimapa Neural</span>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-400 hover:text-white text-xs p-1"
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
        </div>

        {!isCollapsed && (
          <div className="p-3.5 space-y-3">
            {/* Behavioral State Diagnosis Badge */}
            <div className={`p-2 rounded-xl border text-[11px] font-semibold text-center truncate ${stateColor}`}>
              {behavioralState}
            </div>

            {/* 2D Brain Schematic Diagram */}
            <div className="relative h-28 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 200 120" className="w-full h-full p-2">
                {/* Background Neural Axis lines */}
                <line x1="100" y1="15" x2="100" y2="105" stroke="#334155" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="30" y1="60" x2="170" y2="60" stroke="#334155" strokeWidth="1" strokeDasharray="3,3" />

                {/* Left Optic Lobe (Ojo Izquierdo) */}
                <ellipse cx="38" cy="60" rx="18" ry="32" fill={eyeGlowL} opacity={0.3 + lightL * 0.6} />
                <ellipse cx="38" cy="60" rx="18" ry="32" stroke="#f59e0b" strokeWidth={lightL > 0.2 ? '2' : '0.5'} fill="none" />
                <text x="38" y="63" fontSize="8" fill="#e2e8f0" textAnchor="middle" fontWeight="bold">L. Óptico (I)</text>

                {/* Right Optic Lobe (Ojo Derecho) */}
                <ellipse cx="162" cy="60" rx="18" ry="32" fill={eyeGlowR} opacity={0.3 + lightR * 0.6} />
                <ellipse cx="162" cy="60" rx="18" ry="32" stroke="#f59e0b" strokeWidth={lightR > 0.2 ? '2' : '0.5'} fill="none" />
                <text x="162" y="63" fontSize="8" fill="#e2e8f0" textAnchor="middle" fontWeight="bold">L. Óptico (D)</text>

                {/* Antennal Lobes (Frontal / Top in SVG) */}
                <circle cx="85" cy="28" r="10" fill="#a855f7" opacity={0.3 + odorL * 0.7} />
                <circle cx="115" cy="28" r="10" fill="#a855f7" opacity={0.3 + odorR * 0.7} />
                <text x="100" y="31" fontSize="7" fill="#c084fc" textAnchor="middle">L. Antenal</text>

                {/* Central Complex (Compass / Center) */}
                <circle cx="100" cy="60" r="15" fill="#0284c7" opacity={0.4} stroke="#38bdf8" strokeWidth="1.5" />
                {/* Heading needle in central compass */}
                <line
                  x1="100"
                  y1="60"
                  x2={100 + Math.sin(heading * Math.PI / 180) * 12}
                  y2={60 - Math.cos(heading * Math.PI / 180) * 12}
                  stroke="#22d3ee"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="100" cy="60" r="2.5" fill="#ffffff" />
                <text x="100" y="81" fontSize="7" fill="#94a3b8" textAnchor="middle">Cuerpo Central</text>

                {/* Subesophageal Ganglion / Descending Motor Center (Bottom in SVG) */}
                <rect x="75" y="90" width="50" height="18" rx="6" fill="#10b981" opacity={0.4} stroke="#34d399" strokeWidth="1" />
                <text x="100" y="102" fontSize="7" fill="#6ee7b7" textAnchor="middle" fontWeight="bold">GNG Motor</text>

                {/* Synaptic Pathway Stream Arrows */}
                <path d="M 56 60 Q 75 60 85 60" stroke="#38bdf8" strokeWidth="1.2" fill="none" strokeDasharray="2,2" />
                <path d="M 144 60 Q 125 60 115 60" stroke="#38bdf8" strokeWidth="1.2" fill="none" strokeDasharray="2,2" />
                <path d="M 100 75 L 100 90" stroke="#34d399" strokeWidth="1.5" fill="none" />
              </svg>

              {/* Angle to target badge */}
              {isArenaMode && targetDist > 0 && (
                <div className="absolute top-1.5 right-2 text-[9px] font-mono text-cyan-300 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">
                  d: {targetDist.toFixed(0)}u | ∠ {(relAngle * 180 / Math.PI).toFixed(0)}°
                </div>
              )}
            </div>

            {/* Sensory Reception Meters */}
            <div className="space-y-1.5 text-[10px]">
              {/* Visual Flux */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-slate-400">
                  <span>Ojo Izq (ACh): {pctLightL}%</span>
                  <span className="text-amber-400 font-semibold">Fototaxis Bilateral</span>
                  <span>Ojo Der (ACh): {pctLightR}%</span>
                </div>
                <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-800 gap-1">
                  <div className="h-full bg-amber-400 transition-all duration-100 rounded-l" style={{ width: `${pctLightL}%` }}></div>
                  <div className="flex-1 bg-transparent"></div>
                  <div className="h-full bg-amber-400 transition-all duration-100 rounded-r" style={{ width: `${pctLightR}%` }}></div>
                </div>
              </div>

              {/* Motor Differential Steering */}
              <div className="space-y-0.5 pt-1">
                <div className="flex justify-between text-slate-400">
                  <span>Motor Izq: {leftMotor}%</span>
                  <span className="text-cyan-400 font-semibold">Viraje Motor GNG</span>
                  <span>Motor Der: {rightMotor}%</span>
                </div>
                <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-800 gap-1">
                  <div className="h-full bg-cyan-400 transition-all duration-100 rounded-l" style={{ width: `${Math.max(5, leftMotor)}%` }}></div>
                  <div className="flex-1 bg-transparent"></div>
                  <div className="h-full bg-blue-400 transition-all duration-100 rounded-r" style={{ width: `${Math.max(5, rightMotor)}%` }}></div>
                </div>
              </div>
            </div>

            {/* Key Connectome Stats Footer */}
            <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-800 text-center text-[10px]">
              <div>
                <p className="font-mono font-bold text-white">{speed}</p>
                <p className="text-slate-500">mm/s</p>
              </div>
              <div>
                <p className="font-mono font-bold text-cyan-400">{wingHz}</p>
                <p className="text-slate-500">Hz Alas</p>
              </div>
              <div>
                <p className="font-mono font-bold text-emerald-400">{activeNeurons}</p>
                <p className="text-slate-500">Neuronas Activas</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
