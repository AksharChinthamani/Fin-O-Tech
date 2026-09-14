export interface MarketState {
  timestamp: number;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  returns: number;
  futureReturns: number;
  zPrice: number;
  zVolume: number;
  buySellRatio: number;
  priceVelocity: number;
  stressScore: number;
  isAnomaly: boolean;
}

// Lightweight structure for 6-month historical corpus (memory efficient)
export interface HistoricalCorpusEntry {
  zPrice: number;
  zVolume: number;
  buySellRatio: number;
  priceVelocity: number;
  futureReturns: number;
}

export interface AnomalyEvent {
  id: string;
  timestamp: number;
  stressScore: number;
  price: number;
  zPrice: number;
  zVolume: number;
  buySellRatio: number;
  velocity: number;
  explanation: string;
  primaryFactors: string[];
  prediction: ProbabilityPrediction | null;
}

export interface ProbabilityPrediction {
  directionUp: number;
  directionDown: number;
  meanReturn: number;
  medianReturn: number;
  bestCase: number;
  worstCase: number;
  confidence: number;
  sampleSize: number;
  expectedRange: [number, number];
}

export interface HistoricalMatch {
  timestamp: number;
  distance: number;
  futureReturn: number;
  zPrice: number;
  zVolume: number;
  buySellRatio: number;
}

export interface ChartCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
