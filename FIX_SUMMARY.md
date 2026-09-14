# Fix Summary: Timestamp Ordering Issue

## Problem
The lightweight-charts library threw an error:
```
Assertion failed: data must be asc ordered by time, index=150, time=1789356560, prev time=1789356560
```

This occurred because the chart was receiving data points with duplicate timestamps.

## Root Cause
The market simulation updates every 1.5 seconds, but timestamps are truncated to seconds (`Math.floor(Date.now() / 1000)`). This meant multiple ticks could occur within the same second, creating candles with identical timestamps.

## Solution
Implemented a two-layer fix:

### 1. Simulation Hook (src/hooks/useMarketSimulation.ts)
- Added `lastChartTimeRef` to track the last timestamp used
- When creating new candles, ensure each timestamp is strictly greater than the previous:
  ```typescript
  const now = Math.floor(Date.now() / 1000);
  const newTime = now > lastChartTimeRef.current ? now : lastChartTimeRef.current + 1;
  lastChartTimeRef.current = newTime;
  ```
- Initialize `lastChartTimeRef` with the last candle's time from initial data

### 2. PriceChart Component (src/components/PriceChart.tsx)
- Added defensive filtering to remove any duplicate timestamps before passing data to lightweight-charts:
  ```typescript
  const seen = new Set<number>();
  const uniqueData = data.filter(d => {
    if (seen.has(d.time)) return false;
    seen.add(d.time);
    return true;
  });
  ```

## Result
- ✅ All chart data now has strictly ascending, unique timestamps
- ✅ No more assertion errors from lightweight-charts
- ✅ Chart updates smoothly with each simulation tick
- ✅ Build successful with no errors
