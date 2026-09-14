import { MarketState } from '../types';
import { formatPrice, formatPercent } from '../utils/calculations';

interface MarketStatusProps {
  currentState: MarketState | null;
}

export default function MarketStatus({ currentState }: MarketStatusProps) {
  if (!currentState) return null;
  
  const priceChange = currentState.returns * 100;
  const isUp = priceChange >= 0;
  
  return (
    <div className="bg-[#111827] rounded-xl border border-gray-800 p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
          Current Market State
        </h2>
        <span className="text-[10px] text-gray-600 bg-gray-800/50 px-2 py-0.5 rounded">REAL-TIME</span>
      </div>
      
      <div className="mb-4">
        <div className="flex items-baseline gap-3">
          <span className="text-white text-3xl font-bold font-mono">
            ${formatPrice(currentState.close)}
          </span>
          <span className={`text-sm font-mono ${isUp ? 'text-green-400' : 'text-red-400'}`}>
            {formatPercent(priceChange)}
          </span>
        </div>
        <p className="text-gray-500 text-xs mt-1">
          Last updated: {new Date(currentState.timestamp).toLocaleTimeString()}
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Z-Score (Price)" value={currentState.zPrice.toFixed(2)} color={Math.abs(currentState.zPrice) > 2 ? 'red' : 'cyan'} />
        <MetricCard label="Z-Score (Volume)" value={currentState.zVolume.toFixed(2)} color={currentState.zVolume > 2.5 ? 'red' : 'cyan'} />
        <MetricCard label="Buy/Sell Ratio" value={currentState.buySellRatio.toFixed(3)} color={currentState.buySellRatio > 0.6 || currentState.buySellRatio < 0.4 ? 'amber' : 'cyan'} />
        <MetricCard label="Price Velocity" value={`${(currentState.priceVelocity * 100).toFixed(4)}%`} color={Math.abs(currentState.priceVelocity) > 0.5 ? 'red' : 'cyan'} />
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-xs">Market Stress Score</span>
          <span className={`font-mono font-bold text-sm ${
            currentState.stressScore > 70 ? 'text-red-400' :
            currentState.stressScore > 45 ? 'text-amber-400' :
            'text-green-400'
          }`}>
            {currentState.stressScore.toFixed(1)} / 100
          </span>
        </div>
        <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              currentState.stressScore > 70 ? 'bg-gradient-to-r from-red-500 to-red-400' :
              currentState.stressScore > 45 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
              'bg-gradient-to-r from-green-500 to-green-400'
            }`}
            style={{ width: `${currentState.stressScore}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: 'red' | 'amber' | 'cyan' | 'green' }) {
  const colorClasses: Record<string, string> = {
    red: 'text-red-400',
    amber: 'text-amber-400',
    cyan: 'text-cyan-400',
    green: 'text-green-400',
  };
  
  return (
    <div className="bg-[#0d1117] rounded-lg p-3 border border-gray-800/50">
      <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">{label}</p>
      <p className={`font-mono text-sm font-bold ${colorClasses[color]}`}>{value}</p>
    </div>
  );
}
