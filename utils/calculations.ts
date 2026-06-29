
import { EvaluationConfig, Trade, TradingMetrics } from '../types';

export interface DailyPnLData {
  pnl: number;
  count: number;
  trades: Trade[];
}

export interface ConsistencyMetrics {
  largestWinningDay: number;
  totalWinningPnL: number;
  bestDayShare: number;
}

export interface EvaluationProgress {
  passDistance: number;
  failDistance: number;
  passProgress: number;
  failBufferProgress: number;
  isPassed: boolean;
  isFailed: boolean;
}

export interface PerformanceMetrics {
  totalTrades: number;
  expectancy: number;
  winRate: number;
  lossRate: number;
  longPct: number;
  shortPct: number;
  averageTradeTimeMinutes: number;
  averageTradeTimeLabel: string;
  netPnL: number;
}

export interface BellCurvePoint {
  label: string;
  count: number;
  curve: number;
}

export const calculateMetrics = (trades: Trade[], startingBalance: number = 0): TradingMetrics => {
  const closedTrades = trades.filter(t => t.status === 'CLOSED');
  
  // Sum PnL and subtract fees, rounding to 2 decimals
  const rawPnL = closedTrades.reduce((acc, t) => acc + (t.pnl - (t.fees || 0)), 0);
  const totalPnL = Math.round(rawPnL * 100) / 100;
  const currentBalance = startingBalance + totalPnL;

  if (closedTrades.length === 0) {
    return {
      totalTrades: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      totalPnL: 0,
      sharpeRatio: 0,
      avgRR: 0,
      startingBalance,
      currentBalance,
    };
  }

  const wins = closedTrades.filter(t => t.pnl > 0);
  const losses = closedTrades.filter(t => t.pnl <= 0);

  const totalWinAmount = wins.reduce((acc, t) => acc + (t.pnl - (t.fees || 0)), 0);
  const totalLossAmountRaw = losses.reduce((acc, t) => acc + (t.pnl - (t.fees || 0)), 0);
  const totalLossAmountAbs = Math.abs(totalLossAmountRaw);

  const avgWin = wins.length > 0 ? totalWinAmount / wins.length : 0;
  // Make avgLoss negative so the formatter shows a minus sign
  const avgLoss = losses.length > 0 ? totalLossAmountRaw / losses.length : 0;

  const winRate = (wins.length / closedTrades.length) * 100;
  // Profit factor is Gross Profits / Gross Losses (absolute)
  const profitFactor = totalLossAmountAbs === 0 ? totalWinAmount : totalWinAmount / totalLossAmountAbs;

  const returns = closedTrades.map(t => t.pnl);
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev === 0 ? 0 : (meanReturn / stdDev) * Math.sqrt(252);

  const avgRR = closedTrades.length > 0 
    ? closedTrades.reduce((acc, t) => {
        const reward = Math.abs(t.pnl);
        const risk = t.riskAmount || 1; 
        return acc + (reward / risk);
      }, 0) / closedTrades.length
    : 0;

  return {
    totalTrades: closedTrades.length,
    winRate,
    avgWin,
    avgLoss,
    profitFactor,
    totalPnL,
    sharpeRatio,
    avgRR,
    startingBalance,
    currentBalance,
  };
};

export const getTradeNetPnL = (trade: Trade): number => trade.pnl - (trade.fees || 0);

export const calculateDailyPnL = (trades: Trade[]): Record<string, DailyPnLData> => {
  return trades
    .filter(t => t.status === 'CLOSED')
    .reduce<Record<string, DailyPnLData>>((dailyPnL, trade) => {
      const dateStr = new Date(trade.entryDate).toISOString().split('T')[0];
      if (!dailyPnL[dateStr]) {
        dailyPnL[dateStr] = { pnl: 0, count: 0, trades: [] };
      }

      dailyPnL[dateStr].pnl += getTradeNetPnL(trade);
      dailyPnL[dateStr].count += 1;
      dailyPnL[dateStr].trades.push(trade);
      return dailyPnL;
    }, {});
};

export const calculateConsistency = (trades: Trade[]): ConsistencyMetrics => {
  const dailyPnL = calculateDailyPnL(trades);
  const winningDays = Object.values(dailyPnL)
    .map(day => day.pnl)
    .filter(pnl => pnl > 0);

  const totalWinningPnL = winningDays.reduce((acc, pnl) => acc + pnl, 0);
  const largestWinningDay = winningDays.length > 0 ? Math.max(...winningDays) : 0;
  const bestDayShare = totalWinningPnL > 0 ? (largestWinningDay / totalWinningPnL) * 100 : 0;

  return {
    largestWinningDay,
    totalWinningPnL,
    bestDayShare,
  };
};

export const calculateEvaluationProgress = (
  metrics: TradingMetrics,
  config: EvaluationConfig
): EvaluationProgress => {
  const targetProfit = Math.max(config.targetProfit, 0);
  const maxLoss = Math.max(config.maxLoss, 0);
  const evaluationPnL = config.startingBalance > 0
    ? metrics.currentBalance - config.startingBalance
    : metrics.totalPnL;
  const passDistance = Math.max(targetProfit - evaluationPnL, 0);
  const failDistance = Math.max(evaluationPnL + maxLoss, 0);
  const passProgress = targetProfit > 0 ? Math.min(Math.max((evaluationPnL / targetProfit) * 100, 0), 100) : 0;
  const failBufferProgress = maxLoss > 0 ? Math.min(Math.max((failDistance / maxLoss) * 100, 0), 100) : 100;

  return {
    passDistance,
    failDistance,
    passProgress,
    failBufferProgress,
    isPassed: targetProfit > 0 && evaluationPnL >= targetProfit,
    isFailed: maxLoss > 0 && evaluationPnL <= -maxLoss,
  };
};

export const calculatePerformanceMetrics = (trades: Trade[]): PerformanceMetrics => {
  const closedTrades = trades.filter(t => t.status === 'CLOSED');
  const netPnlValues = closedTrades.map(getTradeNetPnL);
  const totalTrades = closedTrades.length;
  const wins = closedTrades.filter(t => getTradeNetPnL(t) > 0).length;
  const losses = totalTrades - wins;
  const longs = closedTrades.filter(t => t.side === 'LONG').length;
  const shorts = closedTrades.filter(t => t.side === 'SHORT').length;

  const tradeDurations = closedTrades
    .map(trade => {
      if (!trade.exitDate) return null;
      const entry = new Date(trade.entryDate).getTime();
      const exit = new Date(trade.exitDate).getTime();
      if (Number.isNaN(entry) || Number.isNaN(exit) || exit <= entry) return null;
      return (exit - entry) / 60000;
    })
    .filter((value): value is number => value !== null);

  const totalPnL = netPnlValues.reduce((acc, value) => acc + value, 0);
  const expectancy = totalTrades > 0 ? totalPnL / totalTrades : 0;
  const averageTradeTimeMinutes = tradeDurations.length > 0
    ? tradeDurations.reduce((acc, value) => acc + value, 0) / tradeDurations.length
    : 0;

  return {
    totalTrades,
    expectancy,
    winRate: totalTrades > 0 ? (wins / totalTrades) * 100 : 0,
    lossRate: totalTrades > 0 ? (losses / totalTrades) * 100 : 0,
    longPct: totalTrades > 0 ? (longs / totalTrades) * 100 : 0,
    shortPct: totalTrades > 0 ? (shorts / totalTrades) * 100 : 0,
    averageTradeTimeMinutes,
    averageTradeTimeLabel: formatDuration(averageTradeTimeMinutes),
    netPnL: totalPnL,
  };
};

export const buildPnLBellCurve = (trades: Trade[], bins = 8): BellCurvePoint[] => {
  const closedTrades = trades.filter(t => t.status === 'CLOSED');
  const values = closedTrades.map(getTradeNetPnL);

  if (values.length === 0) {
    return [];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
  const variance = values.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  if (min === max) {
    return [
      {
        label: formatCurrencyCompact(min),
        count: values.length,
        curve: values.length,
      },
    ];
  }

  const bucketCount = Math.max(4, bins);
  const bucketSize = (max - min) / bucketCount;
  const histogram = Array.from({ length: bucketCount }, (_, index) => {
    const start = min + index * bucketSize;
    const end = index === bucketCount - 1 ? max : start + bucketSize;
    const center = start + bucketSize / 2;
    const count = values.filter(value => {
      if (index === bucketCount - 1) {
        return value >= start && value <= end;
      }
      return value >= start && value < end;
    }).length;

    const density = stdDev > 0
      ? (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((center - mean) / stdDev, 2))
      : count;

    return {
      label: formatCurrencyCompact(center),
      count,
      curve: density * values.length * bucketSize,
    };
  });

  return histogram;
};

export const formatDuration = (minutes: number): string => {
  if (!minutes || minutes <= 0) return '0m';
  const rounded = Math.round(minutes);
  const days = Math.floor(rounded / 1440);
  const hours = Math.floor((rounded % 1440) / 60);
  const mins = rounded % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

/**
 * Formats currency with forced sign (+$1.00 or -$1.00)
 */
export const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    signDisplay: 'always'
  }).format(val);
};

/**
 * Formats currency without forced positive sign ($1.00 or -$1.00)
 */
export const formatCurrencyPlain = (val: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    signDisplay: 'auto'
  }).format(val);
};

export const formatCurrencyCompact = (val: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(val);
};
