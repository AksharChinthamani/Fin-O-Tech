import Header from './components/Header';
import MarketStatus from './components/MarketStatus';
import AnomalyPanel from './components/AnomalyPanel';
import StressAnalyzer from './components/StressAnalyzer';
import ProbabilityEngine from './components/ProbabilityEngine';
import PriceChart from './components/PriceChart';
import AlertLog from './components/AlertLog';
import MarketStateVector from './components/MarketStateVector';
import SystemMetrics from './components/SystemMetrics';
import { useMarketSimulation } from './hooks/useMarketSimulation';

export default function App() {
  const {
    currentState,
    historicalData,
    historicalCorpus,
    anomalies,
    chartData,
    prediction,
    isRunning,
    setIsRunning,
    totalAnomalies,
    corpusSize,
  } = useMarketSimulation();

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white">
      <Header 
        currentState={currentState} 
        isRunning={isRunning} 
        totalAnomalies={totalAnomalies}
        corpusSize={corpusSize}
      />
      
      <main className="p-4 max-w-[1920px] mx-auto space-y-4">


        {/* Q1-Q4 Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          <MarketStatus currentState={currentState} />
          <AnomalyPanel currentState={currentState} />
          <StressAnalyzer latestAnomaly={anomalies[0] || null} />
          <ProbabilityEngine 
            prediction={prediction} 
            currentPrice={currentState?.close || 0} 
          />
        </div>

        {/* Chart */}
        <PriceChart data={chartData} />

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <AlertLog anomalies={anomalies} />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <MarketStateVector currentState={currentState} />
            <SystemMetrics 
              currentState={currentState}
              anomalies={anomalies}
              totalAnomalies={totalAnomalies}
              historicalCount={historicalData.length}
              corpusSize={corpusSize}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-4 border-t border-gray-800/50">
          <p className="text-gray-600 text-[10px]">
            Project bit-Co · Real-Time Cryptocurrency Anomaly Detection & Probabilistic Pattern Analysis Engine
          </p>
          <p className="text-gray-700 text-[9px] mt-1">
            Data Source: Binance Public API · Historical Corpus: 6 months (259,200 candles) · Update Interval: 1.5s · 
            Similarity: Euclidean Distance (D &lt; 1.5) · Prediction Window: 5-min forward
          </p>
        </footer>
      </main>
    </div>
  );
}
