import { MarketState } from '../types';

interface AnomalyPanelProps {
  currentState: MarketState | null;
}

export default function AnomalyPanel({ currentState }: AnomalyPanelProps) {
  if (!currentState) return null;
  
  const anomalyActive = currentState.isAnomaly;
  
  return (
    <div className={`bg-[#111827] rounded-xl border p-5 h-full transition-all duration-300 ${
      anomalyActive ? 'border-red-500/50 shadow-lg shadow-red-500/10' : 'border-gray-800'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
          Q2 · Anomaly Detection
        </h2>
        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
          anomalyActive ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-green-500/20 text-green-400'
        }`}>
          {anomalyActive ? '⚠ ANOMALY' : '✓ NORMAL'}
        </div>
      </div>
      
      <div className="space-y-3">
        <ThresholdBar 
          label="Price Z-Score" 
          value={currentState.zPrice} 
          threshold={3.0} 
          max={6}
          description="Deviation from 12-month mean returns"
        />
        <ThresholdBar 
          label="Volume Z-Score" 
          value={currentState.zVolume} 
          threshold={3.5} 
          max={10}
          description="Deviation from 12-month volume baseline"
        />
        <ThresholdBar 
          label="Buy/Sell Imbalance" 
          value={Math.abs(currentState.buySellRatio - 0.5) * 10} 
          threshold={1.5} 
          max={5}
          description="Deviation from balanced 50/50 ratio"
        />
        <ThresholdBar 
          label="Price Velocity" 
          value={Math.abs(currentState.priceVelocity) * 10} 
          threshold={3.0} 
          max={10}
          description="Rate of price change per minute"
        />
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${anomalyActive ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
          <span className="text-gray-400 text-xs">
            Multi-factor confirmation: {anomalyActive ? 'TRIGGERED' : 'Not triggered'}
          </span>
        </div>
        <p className="text-gray-600 text-[10px] mt-1 ml-5">
          IS_ANOMALY = stress_score &gt; 65 ∧ (|Z_price| &gt; 3.0 ∨ Z_volume &gt; 3.5)
        </p>
      </div>
    </div>
  );
}

function ThresholdBar({ label, value, threshold, max, description }: { 
  label: string; 
  value: number; 
  threshold: number; 
  max: number;
  description: string;
}) {
  const percentage = Math.min(100, (Math.abs(value) / max) * 100);
  const thresholdPercentage = (threshold / max) * 100;
  const isExceeded = Math.abs(value) > threshold;
  
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-400 text-xs">{label}</span>
        <span className={`font-mono text-xs font-bold ${isExceeded ? 'text-red-400' : 'text-gray-300'}`}>
          {value.toFixed(2)}
        </span>
      </div>
      <div className="relative h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-300 ${
            isExceeded ? 'bg-red-500' : 'bg-cyan-500'
          }`}
          style={{ width: `${percentage}%` }}
        ></div>
        <div 
          className="absolute top-0 h-full w-0.5 bg-amber-400/60"
          style={{ left: `${thresholdPercentage}%` }}
        ></div>
      </div>
      <p className="text-gray-600 text-[9px] mt-0.5">{description}</p>
    </div>
  );
}
