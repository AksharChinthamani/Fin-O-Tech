import { MarketState, ProbabilityPrediction, HistoricalMatch } from '../types';

// Calculate percentage returns
export function calcReturn(current: number, previous: number): number {
  if (previous === 0) return 0;
  return (current - previous) / previous;
}

// Calculate Z-Score against long-term baseline
export function calcZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

// Calculate rolling mean
export function rollingMean(values: number[], window: number): number {
  const slice = values.slice(-window);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

// Calculate rolling standard deviation
export function rollingStdDev(values: number[], window: number): number {
  const mean = rollingMean(values, window);
  const slice = values.slice(-window);
  const squaredDiffs = slice.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / slice.length);
}

// Calculate Composite Market Stress Score (0-100)
export function calcStressScore(
  zPrice: number,
  zVolume: number,
  buySellRatio: number,
  velocity: number
): number {
  const raw = 
    (Math.abs(zPrice) * 30) +
    (Math.max(0, zVolume) * 40) +
    (Math.abs(buySellRatio - 0.5) * 100 * 20) +
    (Math.abs(velocity) * 10);
  
  return Math.min(100, Math.max(0, raw));
}

// Determine if current state is anomalous
export function isAnomaly(stressScore: number, zPrice: number, zVolume: number): boolean {
  return stressScore > 45 || Math.abs(zPrice) > 2.5 || zVolume > 3.0;
}

// Generate human-readable explanation for anomaly
export function generateExplanation(
  zPrice: number,
  zVolume: number,
  buySellRatio: number,
  velocity: number
): { explanation: string; factors: string[] } {
  const factors: string[] = [];
  
  if (Math.abs(zPrice) > 2.0) {
    factors.push(zPrice > 0 
      ? `Price surge ${zPrice.toFixed(1)}σ above normal` 
      : `Price drop ${Math.abs(zPrice).toFixed(1)}σ below normal`);
  }
  
  if (zVolume > 2.5) {
    factors.push(`Volume spike ${zVolume.toFixed(1)}x above baseline`);
  }
  
  if (buySellRatio > 0.65) {
    factors.push(`Heavy buy pressure (${(buySellRatio * 100).toFixed(0)}% buy-side)`);
  } else if (buySellRatio < 0.35) {
    factors.push(`Heavy sell pressure (${((1 - buySellRatio) * 100).toFixed(0)}% sell-side)`);
  }
  
  if (Math.abs(velocity) > 0.005) {
    factors.push(`Rapid price velocity: ${(velocity * 100).toFixed(3)}%/min`);
  }
  
  const direction = zPrice > 0 ? 'bullish' : 'bearish';
  const severity = stressScoreCalc(zPrice, zVolume, buySellRatio, velocity) > 70 ? 'EXTREME' : 
                   stressScoreCalc(zPrice, zVolume, buySellRatio, velocity) > 55 ? 'HIGH' : 'MODERATE';
  
  const explanation = `${severity} ${direction} anomaly detected. ${factors.join('. ')}.`;
  
  return { explanation, factors };
}

function stressScoreCalc(zP: number, zV: number, br: number, vel: number): number {
  return calcStressScore(zP, zV, br, vel);
}

// Simulate historical similarity search across 12-month corpus
export function findHistoricalMatches(
  currentState: MarketState,
  historicalData: MarketState[],
  topN: number = 50
): HistoricalMatch[] {
  const matches: HistoricalMatch[] = [];
  
  for (const hist of historicalData) {
    const dist = Math.sqrt(
      Math.pow(currentState.zPrice - hist.zPrice, 2) +
      Math.pow(currentState.zVolume - hist.zVolume, 2) +
      Math.pow(currentState.buySellRatio - hist.buySellRatio, 2) +
      Math.pow(currentState.priceVelocity - hist.priceVelocity, 2) * 100
    );
    
    if (dist < 1.5) {
      matches.push({
        timestamp: hist.timestamp,
        distance: dist,
        futureReturn: hist.futureReturns,
        zPrice: hist.zPrice,
        zVolume: hist.zVolume,
        buySellRatio: hist.buySellRatio,
      });
    }
  }
  
  matches.sort((a, b) => a.distance - b.distance);
  return matches.slice(0, topN);
}

// Calculate probability prediction from historical matches
export function calcPrediction(matches: HistoricalMatch[], currentPrice: number): ProbabilityPrediction | null {
  if (matches.length < 5) return null;
  
  const returns = matches.map(m => m.futureReturn);
  const upCount = returns.filter(r => r > 0).length;
  const downCount = returns.filter(r => r <= 0).length;
  
  const sorted = [...returns].sort((a, b) => a - b);
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  
  const variance = returns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    directionUp: (upCount / returns.length) * 100,
    directionDown: (downCount / returns.length) * 100,
    meanReturn: mean,
    medianReturn: median,
    bestCase: sorted[Math.floor(sorted.length * 0.95)],
    worstCase: sorted[Math.floor(sorted.length * 0.05)],
    confidence: Math.min(95, 50 + (matches.length / 10)),
    sampleSize: matches.length,
    expectedRange: [
      currentPrice * (1 + (mean - stdDev)),
      currentPrice * (1 + (mean + stdDev))
    ],
  };
}

// Format price with commas
export function formatPrice(price: number): string {
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Format percentage
export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

// Format time
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
}

// Format relative time
export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}
