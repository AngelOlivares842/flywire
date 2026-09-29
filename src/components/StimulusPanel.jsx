import React from 'react';
import { STIMULUS_CIRCUITS } from '../data/neurons.js';

export default function StimulusPanel({ activeStimulus, onActivateStimulus, isSimulating }) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 space-y-3">
      <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
        <span>🧪</span>
        <span>Estímulos Sensoriales</span>
      </h4>
      <p className="text-xs text-slate-400">Activa un estímulo para ver la respuesta neural y el comportamiento de la mosca.</p>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(STIMULUS_CIRCUITS).map(([key, circuit]) => {
          const isActive = activeStimulus === key;
          return (
            <button
              key={key}
              onClick={() => onActivateStimulus(isActive ? null : key)}
              disabled={isSimulating && !isActive}
              className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all duration-300 text-left
                ${isActive
                  ? 'border-opacity-70 shadow-lg scale-[1.02]'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                }
                ${isSimulating && !isActive ? 'opacity-40 cursor-not-allowed' : ''}
              `}
              style={isActive ? {
                backgroundColor: circuit.color + '20',
                borderColor: circuit.color + '80',
                color: circuit.color,
                boxShadow: `0 0 15px ${circuit.color}30`,
              } : {}}
            >
              <span className="block text-base">{circuit.label}</span>
              <span className="block text-xs opacity-70 mt-0.5">
                {isActive ? 'Activo — clic para detener' : circuit.description.split('→')[0]}
              </span>
            </button>
          );
        })}
      </div>
      {activeStimulus && (
        <div
          className="text-xs p-2 rounded border animate-fade-in"
          style={{
            backgroundColor: STIMULUS_CIRCUITS[activeStimulus].color + '10',
            borderColor: STIMULUS_CIRCUITS[activeStimulus].color + '40',
            color: STIMULUS_CIRCUITS[activeStimulus].color,
          }}
        >
          <span className="font-semibold">Circuito: </span>
          {STIMULUS_CIRCUITS[activeStimulus].description}
        </div>
      )}
    </div>
  );
}
