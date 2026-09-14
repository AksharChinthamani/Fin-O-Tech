import { useState, useEffect, useRef, useCallback } from 'react';
import { MarketState, AnomalyEvent, ChartCandle, ProbabilityPrediction, HistoricalCorpusEntry } from '../types';
import {
  calcZScore,
  rollingMean,
  rollingStdDev,
  calcStressScore,
  isAnomaly,
  generateExplanation,
  findHistoricalMatches,
  calcPrediction,
} from '../utils/calculations';

const INITIAL_PRICE = 104850;
const UPDATE_INTERVAL = 1500; // 1.5 seconds
const CORPUS_SIZE = 259200; // 6 months of 1-minute candles (6 * 30 * 24 * 60)

// Generate full 6-month historical corpus
function generateHistoricalCorpus(): HistoricalCorpusEntry[] {
  const corpus: HistoricalCorpusEntry[] = [];
  let price = INITIAL_PRICE * (0.85 + Math.random() * 0.1);
  
  // Generate 6 months of data
  for (let i = 0; i < CORPUS_SIZE; i++) {
    const volatility = 0.0008 + Math.random() * 0.0004;
    const drift = (Math.random() - 0.498) * 0.0002;
    const change = drift + (Math.random() - 0.5) * volatility * 2;
    
    price = price * (1 + change);
    const volume = 50 + Math.random() * 200 + (Math.random() > 0.95 ? 500 : 0);
    const buySellRatio = 0.45 + Math.random() * 0.1;
    const priceVelocity = change * 10;
    
    corpus.push({
      zPrice: 0, // Will be calculated after
      zVolume: 0,
      buySellRatio,
      priceVelocity,
      futureReturns: 0, // Will be calculated after
    });
  }
  
  // Calculate future returns (5-minute forward window)
  for (let i = 0; i < corpus.length - 5; i++) {
    // Simulate future price movement
    const futureChange = (Math.random() - 0.5) * 0.002;
    corpus[i].futureReturns = futureChange;
  }
  
  // Calculate z-scores against long-term baselines
  const allVelocities = corpus.map(d => d.priceVelocity);
  const velMean = rollingMean(allVelocities, corpus.length);
  const velStd = rollingStdDev(allVelocities, corpus.length);
  
  // Simulate z-scores based on velocity and buy/sell ratio
  for (const entry of corpus) {
    entry.zPrice = calcZScore(entry.priceVelocity, velMean, velStd) * (Math.random() > 0.5 ? 1 : -1);
    entry.zVolume = Math.abs(calcZScore(entry.priceVelocity * 100, velMean * 100, velStd * 100));
  }
  
  return corpus;
}

// Generate recent market state for live simulation
function generateRecentMarketData(numPoints: number): MarketState[] {
  const data: MarketState[] = [];
  let price = INITIAL_PRICE * (0.95 + Math.random() * 0.1);
  const now = Date.now();
  
  for (let i = 0; i < numPoints; i++) {
    const timestamp = now - (numPoints - i) * 60000;
    const volatility = 0.0008 + Math.random() * 0.0004;
    const drift = (Math.random() - 0.498) * 0.0002;
    const change = drift + (Math.random() - 0.5) * volatility * 2;
    
    const open = price;
    const close = price * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.0005);
    const low = Math.min(open, close) * (1 - Math.random() * 0.0005);
    const volume = 50 + Math.random() * 200 + (Math.random() > 0.95 ? 500 : 0);
    
    price = close;
    
    data.push({
      timestamp,
      price: close,
      open,
      high,
      low,
      close,
      volume,
      returns: change,
      futureReturns: 0,
      zPrice: 0,
      zVolume: 0,
      buySellRatio: 0.45 + Math.random() * 0.1,
      priceVelocity: change * 10,
      stressScore: 0,
      isAnomaly: false,
    });
  }
  
  // Calculate future returns
  for (let i = 0; i < data.length - 5; i++) {
    data[i].futureReturns = (data[i + 5].close - data[i].close) / data[i].close;
  }
  
  // Calculate z-scores against long-term baselines
  const allReturns = data.map(d => d.returns);
  const allVolumes = data.map(d => d.volume);
  const returnMean = rollingMean(allReturns, data.length);
  const returnStd = rollingStdDev(allReturns, data.length);
  const volMean = rollingMean(allVolumes, data.length);
  const volStd = rollingStdDev(allVolumes, data.length);
  
  for (const d of data) {
    d.zPrice = calcZScore(d.returns, returnMean, returnStd);
    d.zVolume = calcZScore(d.volume, volMean, volStd);
    d.stressScore = calcStressScore(d.zPrice, d.zVolume, d.buySellRatio, d.priceVelocity);
    d.isAnomaly = isAnomaly(d.stressScore, d.zPrice, d.zVolume);
  }
  
  return data;
}

export function useMarketSimulation() {
  const [historicalData, setHistoricalData] = useState<MarketState[]>([]);
  const [historicalCorpus, setHistoricalCorpus] = useState<HistoricalCorpusEntry[]>([]);
  const [currentState, setCurrentState] = useState<MarketState | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);
  const [chartData, setChartData] = useState<ChartCandle[]>([]);
  const [prediction, setPrediction] = useState<ProbabilityPrediction | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [totalAnomalies, setTotalAnomalies] = useState(0);
  const [corpusSize, setCorpusSize] = useState(0);
  const lastPriceRef = useRef(INITIAL_PRICE);
  const tickRef = useRef(0);
  const lastChartTimeRef = useRef(0);
  const corpusRef = useRef<HistoricalCorpusEntry[]>([]);
  const latestStateRef = useRef<MarketState | null>(null);

  // Initialize historical corpus and recent data
  useEffect(() => {
    // Generate full 6-month corpus (runs once)
    const corpus = generateHistoricalCorpus();
    setHistoricalCorpus(corpus);
    setCorpusSize(corpus.length);
    corpusRef.current = corpus; // Store in ref for access in callbacks
    
    // Generate recent market state for live simulation
    const data = generateRecentMarketData(500);
    setHistoricalData(data);
    lastPriceRef.current = data[data.length - 1].close;
    
    const candles: ChartCandle[] = data.slice(-100).map((d: MarketState) => ({
      time: Math.floor(d.timestamp / 1000),
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
    }));
    setChartData(candles);
    setCurrentState(data[data.length - 1]);
    
    // Set the last chart time to ensure future candles have strictly increasing timestamps
    if (candles.length > 0) {
      lastChartTimeRef.current = candles[candles.length - 1].time;
    }

    // Compute an initial Q4 prediction immediately on startup
    const lastState = data[data.length - 1];
    const initialMatches = findHistoricalMatches(lastState, corpus);
    const initialPred = calcPrediction(initialMatches, lastState.close);
    if (initialPred) setPrediction(initialPred);
  }, []);

  const simulateTick = useCallback(() => {
    if (!isRunning) return;
    
    tickRef.current++;
    
    setHistoricalData(prevData => {
      if (prevData.length === 0) return prevData;
      
      const lastPrice = prevData[prevData.length - 1].close;
      
      // Occasionally inject anomalies for demo purposes (less frequent, more significant)
      const isInjectingAnomaly = tickRef.current % 40 === 0 || (Math.random() > 0.97);
      
      let change: number;
      let volumeMultiplier: number;
      
      if (isInjectingAnomaly) {
        const direction = Math.random() > 0.5 ? 1 : -1;
        // Real anomalies: 0.5% - 1.5% moves
        change = direction * (0.005 + Math.random() * 0.01);
        volumeMultiplier = 4 + Math.random() * 6;
      } else {
        // Normal Bitcoin volatility: 0.02% - 0.1% per tick
        const volatility = 0.0002 + Math.random() * 0.0008;
        const drift = (Math.random() - 0.498) * 0.00005;
        change = drift + (Math.random() - 0.5) * volatility * 2;
        volumeMultiplier = 0.7 + Math.random() * 0.6;
      }
      
      const newPrice = lastPrice * (1 + change);
      const newVolume = (80 + Math.random() * 150) * volumeMultiplier;
      const buySellRatio = isInjectingAnomaly 
        ? (change > 0 ? 0.65 + Math.random() * 0.15 : 0.2 + Math.random() * 0.15)
        : 0.45 + Math.random() * 0.1;
      
      lastPriceRef.current = newPrice;
      
      // Calculate long-term baselines (use full history for more stable baselines)
      const allReturns = prevData.map(d => d.returns);
      const allVolumes = prevData.map(d => d.volume);
      const returnMean = rollingMean(allReturns, Math.min(500, allReturns.length));
      const returnStd = rollingStdDev(allReturns, Math.min(500, allReturns.length));
      const volMean = rollingMean(allVolumes, Math.min(500, allVolumes.length));
      const volStd = rollingStdDev(allVolumes, Math.min(500, allVolumes.length));
      
      const zPrice = calcZScore(change, returnMean, returnStd);
      const zVolume = calcZScore(newVolume, volMean, volStd);
      const velocity = change * 10;
      const stressScore = calcStressScore(zPrice, zVolume, buySellRatio, velocity);
      const anomaly = isAnomaly(stressScore, zPrice, zVolume);
      
      const newState: MarketState = {
        timestamp: Date.now(),
        price: newPrice,
        open: lastPrice,
        high: Math.max(lastPrice, newPrice) * (1 + Math.random() * 0.0002),
        low: Math.min(lastPrice, newPrice) * (1 - Math.random() * 0.0002),
        close: newPrice,
        volume: newVolume,
        returns: change,
        futureReturns: 0,
        zPrice,
        zVolume,
        buySellRatio,
        priceVelocity: velocity,
        stressScore,
        isAnomaly: anomaly,
      };
      
      const newData = [...prevData.slice(-499), newState];
      
      // Update future returns for recent entries
      for (let i = Math.max(0, newData.length - 6); i < newData.length - 1; i++) {
        if (i + 5 < newData.length) {
          newData[i] = { ...newData[i], futureReturns: (newData[i + 5].close - newData[i].close) / newData[i].close };
        }
      }
      
      setCurrentState(newState);
      // Expose newState for post-setter Q4 update
      latestStateRef.current = newState;
      
      // Update chart data with unique timestamps
      setChartData(prev => {
        const now = Math.floor(Date.now() / 1000);
        // Ensure timestamp is strictly greater than previous
        const newTime = now > lastChartTimeRef.current ? now : lastChartTimeRef.current + 1;
        lastChartTimeRef.current = newTime;
        
        const newCandle: ChartCandle = {
          time: newTime,
          open: lastPrice,
          high: newState.high,
          low: newState.low,
          close: newPrice,
          volume: newVolume,
        };
        return [...prev.slice(-150), newCandle];
      });

      if (anomaly) {
        const { explanation, factors } = generateExplanation(zPrice, zVolume, buySellRatio, velocity);
        
        // Build anomaly event — prediction will be attached after Q4 runs
        const event: AnomalyEvent = {
          id: `anomaly-${Date.now()}`,
          timestamp: Date.now(),
          stressScore,
          price: newPrice,
          zPrice,
          zVolume,
          buySellRatio,
          velocity,
          explanation,
          primaryFactors: factors,
          prediction: null, // filled in below
        };
        
        setAnomalies(prev => [event, ...prev].slice(0, 20));
        setTotalAnomalies(prev => prev + 1);
      }
      
      return newData;
    });

    // Q4: run prediction OUTSIDE the state updater so setPrediction is always reliable
    const stateForPrediction = latestStateRef.current;
    if (stateForPrediction && corpusRef.current.length > 0) {
      const matches = findHistoricalMatches(stateForPrediction, corpusRef.current);
      const pred = calcPrediction(matches, stateForPrediction.close);
      if (pred) setPrediction(pred);
    }
  }, [isRunning]);

  useEffect(() => {
    const interval = setInterval(simulateTick, UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [simulateTick]);

  return {
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
  };
}
