import { AnomalyEvent, MarketState } from '../types';
import { formatPrice } from '../utils/calculations';

interface SystemMetricsProps {
  currentState: MarketState | null;
  anomalies: AnomalyEvent[];
  totalAnomalies: number;
  historicalCount: number;
}

export default function SystemMetrics({ currentState, anomalies, totalAnomalies, historicalCount }: SystemMetricsProps) {
  const uptime = '12h 34m';
  const lastAnomaly = anomalies.length > 0 
    ? `${Math.floor((Date.now() - anomalies[0].timestamp) / 1000)}s ago` 
    : 'N/A';
  
  return (
    <div className="bg-[#111827] rounded-xl border border-gray-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
          System Telemetry
        </h2>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
          <span className="text-green-400 text-[10px]">ALL SYSTEMS NOMINAL</span>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-3">
        <TelemetryCard label="Uptime" value={uptime} />
        <TelemetryCard label="Data Points" value={historicalCount.toLocaleString()} />
        <TelemetryCard label="Total Alerts" value={totalAnomalies.toString()} highlight />
        <TelemetryCard label="Last Alert" value={lastAnomaly} />
        <TelemetryCard label="Update Rate" value="1.5s" />
        <TelemetryCard label="Corpus Span" value="12 months" />
        <TelemetryCard label="Resolution" value="1-minute" />
        <TelemetryCard label="BTC Price" value={currentState ? `$${formatPrice(currentState.close)}` : '---'} />
      </div>
    </div>
  );
}

function TelemetryCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-[#0d1117] rounded-lg p-2.5 border border-gray-800/50">
      <p className="text-gray-500 text-[9px] uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`font-mono text-xs font-bold ${highlight ? 'text-amber-400' : 'text-gray-200'}`}>
        {value}
      </p>
    </div>
  );
}
