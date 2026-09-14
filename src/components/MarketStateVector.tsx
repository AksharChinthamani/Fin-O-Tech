import { MarketState } from '../types';

interface MarketStateVectorProps {
  currentState: MarketState | null;
}

export default function MarketStateVector({ currentState }: MarketStateVectorProps) {
  if (!currentState) return null;
  
  const vector = [
    { label: 'Z_p', value: currentState.zPrice, max: 5, color: 'cyan' },
    { label: 'Z_v', value: currentState.zVolume, max: 8, color: 'purple' },
    { label: 'B/S', value: currentState.buySellRatio, max: 1, color: 'amber' },
    { label: 'Vel', value: currentState.priceVelocity * 100, max: 2, color: 'green' },
    { label: 'σ_t', value: currentState.stressScore / 100, max: 1, color: 'red' },
  ];

  return (
    <div className="bg-[#111827] rounded-xl border border-gray-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
          Market State Vector
        </h2>
        <span className="text-[10px] text-gray-600 bg-gray-800/50 px-2 py-0.5 rounded font-mono">
          S = [Z_p, Z_v, B/S, Vel, σ_t]
        </span>
      </div>
      
      <div className="flex items-center justify-between gap-2">
        {vector.map((item, idx) => (
          <div key={idx} className="flex-1 text-center">
            <div className="relative mx-auto w-12 h-12">
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18" cy="18" r="15"
                  fill="none"
                  stroke="#1f2937"
                  strokeWidth="2"
                />
                <circle
                  cx="18" cy="18" r="15"
                  fill="none"
                  stroke={getColor(item.color)}
                  strokeWidth="2"
                  strokeDasharray={`${Math.min(100, (Math.abs(item.value) / item.max) * 94.2)} 94.2`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[9px] font-mono text-white font-bold">
                  {item.value.toFixed(1)}
                </span>
              </div>
            </div>
            <p className="text-gray-500 text-[9px] mt-1 font-mono">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function getColor(color: string): string {
  const colors: Record<string, string> = {
    cyan: '#22d3ee',
    purple: '#a855f7',
    amber: '#f59e0b',
    green: '#22c55e',
    red: '#ef4444',
  };
  return colors[color] || '#6b7280';
}
