import { ProbabilityPrediction } from '../types';
import { formatPrice, formatPercent } from '../utils/calculations';

interface ProbabilityEngineProps {
  prediction: ProbabilityPrediction | null;
  currentPrice: number;
}

export default function ProbabilityEngine({ prediction, currentPrice }: ProbabilityEngineProps) {
  return (
    <div className="bg-[#111827] rounded-xl border border-gray-800 p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
          Q4 · 6-Month Historical Probability Engine
        </h2>
        {prediction && (
          <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
            {prediction.sampleSize} matches found
          </span>
        )}
      </div>
      
      {!prediction ? (
        <div className="flex items-center justify-center h-[calc(100%-2rem)]">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-gray-800/50 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">Awaiting anomaly trigger</p>
            <p className="text-gray-600 text-xs mt-1">Will scan 259,200 historical candles when anomaly detected</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Direction Probability */}
          <div className="bg-[#0d1117] rounded-lg p-3 border border-gray-800/50">
            <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-2">Directional Probability (5-min forward)</p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-green-400 text-xs font-bold">↑ UP</span>
                  <span className="text-green-400 font-mono text-sm font-bold">{prediction.directionUp.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-l-full transition-all duration-500"
                    style={{ width: `${prediction.directionUp}%` }}
                  ></div>
                  <div 
                    className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-r-full transition-all duration-500"
                    style={{ width: `${prediction.directionDown}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-red-400 text-xs font-bold">↓ DOWN</span>
                  <span className="text-red-400 font-mono text-sm font-bold">{prediction.directionDown.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Expected Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0d1117] rounded-lg p-3 border border-gray-800/50">
              <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Expected Range</p>
              <p className="text-white font-mono text-xs">
                ${formatPrice(prediction.expectedRange[0])} — ${formatPrice(prediction.expectedRange[1])}
              </p>
            </div>
            <div className="bg-[#0d1117] rounded-lg p-3 border border-gray-800/50">
              <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Confidence Level</p>
              <p className={`font-mono text-xs font-bold ${
                prediction.confidence > 75 ? 'text-green-400' : 
                prediction.confidence > 50 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {prediction.confidence.toFixed(0)}%
              </p>
            </div>
          </div>
          
          {/* Statistical Metrics */}
          <div className="grid grid-cols-4 gap-2">
            <StatBox label="Mean" value={formatPercent(prediction.meanReturn * 100)} positive={prediction.meanReturn > 0} />
            <StatBox label="Median" value={formatPercent(prediction.medianReturn * 100)} positive={prediction.medianReturn > 0} />
            <StatBox label="Best Case" value={formatPercent(prediction.bestCase * 100)} positive={true} />
            <StatBox label="Worst Case" value={formatPercent(prediction.worstCase * 100)} positive={false} />
          </div>
          
          {/* Sample Info */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-800">
            <span className="text-gray-600 text-[10px]">
              Based on {prediction.sampleSize} historical analogs from 6-month corpus (259,200 candles)
            </span>
            <span className="text-gray-600 text-[10px]">
              Euclidean distance threshold: D &lt; 1.5
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  return (
    <div className="bg-[#0d1117] rounded-lg p-2 border border-gray-800/50 text-center">
      <p className="text-gray-500 text-[9px] uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`font-mono text-xs font-bold ${positive ? 'text-green-400' : 'text-red-400'}`}>
        {value}
      </p>
    </div>
  );
}
