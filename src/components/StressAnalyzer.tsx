import { AnomalyEvent, MarketState } from '../types';

interface StressAnalyzerProps {
  latestAnomaly: AnomalyEvent | null;
  currentState: MarketState | null;
}

export default function StressAnalyzer({ latestAnomaly, currentState }: StressAnalyzerProps) {
  // Use live current state for stress bars when no anomaly is active
  const liveZPrice = currentState?.zPrice ?? 0;
  const liveZVolume = currentState?.zVolume ?? 0;
  const liveBuySell = currentState?.buySellRatio ?? 0.5;
  const liveVelocity = currentState?.priceVelocity ?? 0;

  return (
    <div className="bg-[#111827] rounded-xl border border-gray-800 p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
          Stress Analyzer
        </h2>
        {latestAnomaly && (
          <span className="text-[10px] text-gray-600 bg-gray-800/50 px-2 py-0.5 rounded">
            {new Date(latestAnomaly.timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>
      
      {!latestAnomaly ? (
        <div className="space-y-4">
          <div className="bg-[#0d1117] rounded-lg p-3 border border-gray-800/50">
            <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Live Stress Composition</p>
            <p className="text-gray-400 text-xs">System monitoring — no anomaly detected yet</p>
          </div>
          <div className="pt-1">
            <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-2">Current Factor Readings</p>
            <div className="grid grid-cols-2 gap-2">
              <FactorBar label="Price" value={Math.abs(liveZPrice) * 30} max={100} color="cyan" />
              <FactorBar label="Volume" value={Math.max(0, liveZVolume) * 40} max={100} color="purple" />
              <FactorBar label="B/S Imbalance" value={Math.abs(liveBuySell - 0.5) * 100 * 20} max={100} color="amber" />
              <FactorBar label="Velocity" value={Math.abs(liveVelocity) * 10} max={100} color="green" />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Explanation */}
          <div className="bg-[#0d1117] rounded-lg p-3 border border-gray-800/50">
            <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Analysis</p>
            <p className="text-gray-200 text-sm leading-relaxed">{latestAnomaly.explanation}</p>
          </div>
          
          {/* Primary Factors */}
          <div>
            <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-2">Contributing Factors (Ranked)</p>
            <div className="space-y-2">
              {latestAnomaly.primaryFactors.map((factor, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                    idx === 0 ? 'bg-red-500/20 text-red-400' :
                    idx === 1 ? 'bg-amber-500/20 text-amber-400' :
                    'bg-gray-700/50 text-gray-400'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="text-gray-300 text-xs">{factor}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Factor Weights */}
          <div className="pt-3 border-t border-gray-800">
            <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-2">Stress Composition</p>
            <div className="grid grid-cols-2 gap-2">
              <FactorBar label="Price" value={Math.abs(latestAnomaly.zPrice) * 30} max={100} color="cyan" />
              <FactorBar label="Volume" value={Math.max(0, latestAnomaly.zVolume) * 40} max={100} color="purple" />
              <FactorBar label="B/S Imbalance" value={Math.abs(latestAnomaly.buySellRatio - 0.5) * 100 * 20} max={100} color="amber" />
              <FactorBar label="Velocity" value={Math.abs(latestAnomaly.velocity) * 10} max={100} color="green" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FactorBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const percentage = Math.min(100, (value / max) * 100);
  const colorClasses: Record<string, string> = {
    cyan: 'bg-cyan-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
    green: 'bg-green-500',
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-gray-500 text-[10px]">{label}</span>
        <span className="text-gray-400 text-[10px] font-mono">{value.toFixed(0)}</span>
      </div>
      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colorClasses[color]}`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}
