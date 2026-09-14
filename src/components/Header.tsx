import { formatPrice } from '../utils/calculations';
import { MarketState } from '../types';

interface HeaderProps {
  currentState: MarketState | null;
  isRunning: boolean;
  totalAnomalies: number;
  corpusSize: number;
}

export default function Header({ currentState, isRunning, totalAnomalies, corpusSize }: HeaderProps) {
  return (
    <header className="bg-[#0d1117] border-b border-gray-800 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">bC</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg tracking-tight">bit-Co</h1>
              <p className="text-gray-500 text-[10px] -mt-0.5">Anomaly Detection Engine</p>
            </div>
          </div>
          
          <div className="h-8 w-px bg-gray-800 mx-2"></div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-gray-400 text-xs">{isRunning ? 'LIVE' : 'PAUSED'}</span>
            </div>
            
            <div className="text-gray-400 text-xs">
              <span className="text-gray-600">BTC/USDT</span>
              <span className="text-white font-mono ml-2 text-sm">
                ${currentState ? formatPrice(currentState.close) : '---'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-gray-500 text-[10px] uppercase tracking-wider">Anomalies Detected</p>
            <p className="text-amber-400 font-mono text-sm font-bold">{totalAnomalies}</p>
          </div>
          
          <div className="text-right">
            <p className="text-gray-500 text-[10px] uppercase tracking-wider">Historical Corpus</p>
            <p className="text-cyan-400 font-mono text-sm">{corpusSize.toLocaleString()} candles</p>
          </div>
          
          <div className="text-right">
            <p className="text-gray-500 text-[10px] uppercase tracking-wider">Engine Status</p>
            <p className="text-green-400 font-mono text-sm">Operational</p>
          </div>
        </div>
      </div>
    </header>
  );
}
