import { useState, useEffect, useRef, useCallback } from 'react';
import { MarketState, AnomalyEvent, ChartCandle, ProbabilityPrediction } from '../types';
import {
  calcReturn,
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

function generateInitialHistoricalData(numPoints: number): MarketState[] {
  const data: MarketState[] = [];
  let price = INITIAL_PRICE * (0.85 + Math.random() * 0.1);
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
  const [currentState, setCurrentState] = useState<MarketState | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);
  const [chartData, setChartData] = useState<ChartCandle[]>([]);
  const [prediction, setPrediction] = useState<ProbabilityPrediction | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [totalAnomalies, setTotalAnomalies] = useState(0);
  const lastPriceRef = useRef(INITIAL_PRICE);
  const tickRef = useRef(0);
  const lastChartTimeRef = useRef(0);

  // Initialize historical data
  useEffect(() => {
    const data = generateInitialHistoricalData(500);
    setHistoricalData(data);
    lastPriceRef.current = data[data.length - 1].close;
    
    const candles: ChartCandle[] = data.slice(-100).map(d => ({
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
  }, []);

  const simulateTick = useCallback(() => {
    if (!isRunning) return;
    
    tickRef.current++;
    
    setHistoricalData(prevData => {
      if (prevData.length === 0) return prevData;
      
      const lastPrice = prevData[prevData.length - 1].close;
      
      // Occasionally inject anomalies for demo purposes
      const isInjectingAnomaly = tickRef.current % 20 === 0 || (Math.random() > 0.92);
      
      let change: number;
      let volumeMultiplier: number;
      
      if (isInjectingAnomaly) {
        const direction = Math.random() > 0.5 ? 1 : -1;
        change = direction * (0.003 + Math.random() * 0.005);
        volumeMultiplier = 3 + Math.random() * 4;
      } else {
        const volatility = 0.0005 + Math.random() * 0.0003;
        const drift = (Math.random() - 0.498) * 0.0001;
        change = drift + (Math.random() - 0.5) * volatility * 2;
        volumeMultiplier = 0.8 + Math.random() * 0.6;
      }
      
      const newPrice = lastPrice * (1 + change);
      const newVolume = (80 + Math.random() * 150) * volumeMultiplier;
      const buySellRatio = isInjectingAnomaly 
        ? (change > 0 ? 0.65 + Math.random() * 0.15 : 0.2 + Math.random() * 0.15)
        : 0.45 + Math.random() * 0.1;
      
      lastPriceRef.current = newPrice;
      
      // Calculate long-term baselines
      const allReturns = prevData.map(d => d.returns);
      const allVolumes = prevData.map(d => d.volume);
      const returnMean = rollingMean(allReturns, Math.min(200, allReturns.length));
      const returnStd = rollingStdDev(allReturns, Math.min(200, allReturns.length));
      const volMean = rollingMean(allVolumes, Math.min(200, allVolumes.length));
      const volStd = rollingStdDev(allVolumes, Math.min(200, allVolumes.length));
      
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
      
      // Handle anomaly
      if (anomaly) {
        const { explanation, factors } = generateExplanation(zPrice, zVolume, buySellRatio, velocity);
        
        const matches = findHistoricalMatches(newState, newData);
        const pred = calcPrediction(matches, newPrice);
        setPrediction(pred);
        
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
          prediction: pred,
        };
        
        setAnomalies(prev => [event, ...prev].slice(0, 20));
        setTotalAnomalies(prev => prev + 1);
      }
      
      return newData;
    });
  }, [isRunning]);

  useEffect(() => {
    const interval = setInterval(simulateTick, UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [simulateTick]);

  return {
    currentState,
    historicalData,
    anomalies,
    chartData,
    prediction,
    isRunning,
    setIsRunning,
    totalAnomalies,
  };
}
