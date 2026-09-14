import { AnomalyEvent } from '../types';
import { formatPrice, formatPercent } from '../utils/calculations';

interface AlertLogProps {
  anomalies: AnomalyEvent[];
}

export default function AlertLog({ anomalies }: AlertLogProps) {
  return (
    <div className="bg-[#111827] rounded-xl border border-gray-800 p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
          Live Alert History
        </h2>
        <span className="text-[10px] text-gray-600 bg-gray-800/50 px-2 py-0.5 rounded">
          {anomalies.length} events
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px] scrollbar-thin">
        {anomalies.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-gray-600 text-xs">No anomalies detected yet...</p>
          </div>
        ) : (
          anomalies.map((event) => (
            <AlertItem key={event.id} event={event} />
          ))
        )}
      </div>
    </div>
  );
}

function AlertItem({ event }: { event: AnomalyEvent }) {
  const isBullish = event.zPrice > 0;
  const severity = event.stressScore > 70 ? 'EXTREME' : event.stressScore > 55 ? 'HIGH' : 'MODERATE';
  
  return (
    <div className={`bg-[#0d1117] rounded-lg p-3 border transition-all duration-300 ${
      severity === 'EXTREME' ? 'border-red-500/30' :
      severity === 'HIGH' ? 'border-amber-500/30' :
      'border-gray-800/50'
    }`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${
            isBullish ? 'bg-green-400' : 'bg-red-400'
          }`}></span>
          <span className="text-gray-400 text-[10px] font-mono">
            {new Date(event.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
          severity === 'EXTREME' ? 'bg-red-500/20 text-red-400' :
          severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400' :
          'bg-gray-700/50 text-gray-400'
        }`}>
          {severity}
        </span>
      </div>
      
      <div className="flex items-center gap-3 mb-1">
        <span className="text-white text-xs font-mono">${formatPrice(event.price)}</span>
        <span className={`text-[10px] font-mono ${isBullish ? 'text-green-400' : 'text-red-400'}`}>
          {isBullish ? '↑' : '↓'} Stress: {event.stressScore.toFixed(0)}
        </span>
      </div>
      
      <p className="text-gray-500 text-[10px] line-clamp-2">{event.explanation}</p>
      
      {event.prediction && (
        <div className="mt-2 pt-2 border-t border-gray-800/50 flex items-center gap-3">
          <span className="text-[9px] text-gray-500">P(up):</span>
          <span className="text-green-400 text-[10px] font-mono">{event.prediction.directionUp.toFixed(0)}%</span>
          <span className="text-[9px] text-gray-500">P(down):</span>
          <span className="text-red-400 text-[10px] font-mono">{event.prediction.directionDown.toFixed(0)}%</span>
          <span className="text-[9px] text-gray-500">n={event.prediction.sampleSize}</span>
        </div>
      )}
    </div>
  );
}
