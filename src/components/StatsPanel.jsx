import React, { useMemo } from 'react';
import { NEURON_TYPE_COLORS, NEURON_TYPE_LABELS, REGION_COLORS } from '../data/neurons.js';

export default function StatsPanel({ stats, selectedNeuron }) {
  // Neurotransmitter distribution bar chart (global)
  const ntBars = useMemo(() => {
    if (!stats?.ntTypeCounts || !stats?.totalNeurons) return [];
    const entries = Object.entries(stats.ntTypeCounts).sort((a, b) => b[1] - a[1]);
    const max = entries[0]?.[1] || 1;
    return entries.map(([type, count]) => ({
      type,
      label: NEURON_TYPE_LABELS[type] || type,
      count,
      pct: ((count / stats.totalNeurons) * 100).toFixed(1),
      width: (count / max) * 100,
      color: NEURON_TYPE_COLORS[type] || '#64748b',
    }));
  }, [stats]);

  // Region distribution (global)
  const regionBars = useMemo(() => {
    if (!stats?.regionCounts || !stats?.totalNeurons) return [];
    const entries = Object.entries(stats.regionCounts).sort((a, b) => b[1] - a[1]);
    const max = entries[0]?.[1] || 1;
    return entries.map(([region, count]) => ({
      region,
      count,
      pct: ((count / stats.totalNeurons) * 100).toFixed(1),
      width: (count / max) * 100,
      color: REGION_COLORS[region] || '#64748b',
    }));
  }, [stats]);

  // Selected neuron NT score radar / breakdown
  const ntScoreBars = useMemo(() => {
    if (!selectedNeuron?.ntScores) return [];
    const labels = { ach: 'ACh (Acetilcolina)', gaba: 'GABA', glut: 'Glutamato', da: 'Dopamina', ser: 'Serotonina', oct: 'Octopamina' };
    const colors = { ach: '#06b6d4', gaba: '#a855f7', glut: '#f97316', da: '#10b981', ser: '#ec4899', oct: '#eab308' };
    return Object.entries(selectedNeuron.ntScores)
      .map(([key, val]) => ({ key, label: labels[key] || key, value: val, color: colors[key] || '#64748b' }))
      .sort((a, b) => b.value - a.value);
  }, [selectedNeuron]);

  // If a neuron is selected, render its specific neurotransmitter confidence profile
  if (selectedNeuron) {
    if (ntScoreBars.length === 0) return null;
    return (
      <div className="bg-slate-800/50 rounded-lg p-3.5 border border-cyan-800/40 animate-fade-in space-y-2">
        <h5 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center justify-between">
          <span>Perfil Químico (Princeton Scores)</span>
          <span className="text-[10px] text-slate-400 font-normal">FlyWire</span>
        </h5>
        <div className="space-y-1.5">
          {ntScoreBars.map(bar => (
            <div key={bar.key} className="flex items-center space-x-2 text-xs">
              <span className="w-28 text-slate-300 truncate" title={bar.label}>{bar.label}</span>
              <div className="flex-1 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, bar.value * 100)}%`, backgroundColor: bar.color }}
                />
              </div>
              <span className="text-slate-400 font-mono w-10 text-right">{(bar.value * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Otherwise render global connectome stats
  if (!stats) return null;

  return (
    <div className="space-y-4">
      {/* Global stats summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-800/60 rounded-lg p-3 text-center border border-slate-700/40">
          <p className="text-xl font-extrabold text-cyan-400">{stats.totalNeurons?.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 font-medium">Neuronas Totales</p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3 text-center border border-slate-700/40">
          <p className="text-xl font-extrabold text-blue-400">{(stats.totalSynapses / 1e6).toFixed(1)}M</p>
          <p className="text-[11px] text-slate-400 font-medium">Sinapsis Reales</p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3 text-center border border-slate-700/40">
          <p className="text-xl font-extrabold text-emerald-400">{stats.sampledNeurons?.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 font-medium">Neuronas 3D</p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3 text-center border border-slate-700/40">
          <p className="text-xl font-extrabold text-purple-400">{stats.morphologyCount}</p>
          <p className="text-[11px] text-slate-400 font-medium">Árboles SWC</p>
        </div>
      </div>

      {/* NT Distribution */}
      <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/30">
        <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Neurotransmisores (Connectoma)</h5>
        <div className="space-y-1.5">
          {ntBars.map(bar => (
            <div key={bar.type} className="flex items-center space-x-2 text-xs">
              <span className="w-14 text-slate-400 truncate">{bar.label.split(' ')[0]}</span>
              <div className="flex-1 bg-slate-700/40 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${bar.width}%`, backgroundColor: bar.color }}
                />
              </div>
              <span className="text-slate-500 font-mono w-10 text-right">{bar.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Region Distribution */}
      <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/30">
        <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Regiones Cerebrales</h5>
        <div className="space-y-1.5">
          {regionBars.map(bar => (
            <div key={bar.region} className="flex items-center space-x-2 text-xs">
              <span className="w-24 text-slate-400 truncate" title={bar.region}>
                {bar.region.replace('Lóbulo ', 'L. ').replace('Cuerpo ', 'C. ').replace('Ganglio ', 'G. ').replace('Centro ', 'C. ')}
              </span>
              <div className="flex-1 bg-slate-700/40 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${bar.width}%`, backgroundColor: bar.color }}
                />
              </div>
              <span className="text-slate-500 font-mono w-10 text-right">{bar.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
