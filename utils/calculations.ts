
import { Trade, TradingMetrics } from '../types';

export const calculateMetrics = (trades: Trade[], startingBalance: number = 0): TradingMetrics => {
  const closedTrades = trades.filter(t => t.status === 'CLOSED' && t.symbol !== 'JOURNAL');
  
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
      consistencyPct: 0,
      isConsistent: true
    };
  }

  const wins = closedTrades.filter(t => t.pnl > 0);
  const losses = closedTrades.filter(t => t.pnl <= 0);

  const totalWinAmount = wins.reduce((acc, t) => acc + (t.pnl - (t.fees || 0)), 0);
  const totalLossAmountRaw = losses.reduce((acc, t) => acc + (t.pnl - (t.fees || 0)), 0);
  const totalLossAmountAbs = Math.abs(totalLossAmountRaw);

  const avgWin = wins.length > 0 ? totalWinAmount / wins.length : 0;
  const avgLoss = losses.length > 0 ? totalLossAmountRaw / losses.length : 0;
  const winRate = (wins.length / closedTrades.length) * 100;
  const profitFactor = totalLossAmountAbs === 0 ? totalWinAmount : totalWinAmount / totalLossAmountAbs;

  // Sharpe Ratio
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

  // Consistency Calculation: (Highest Single-Day Profit / Total Profit)
  const dailyPnL: Record<string, number> = {};
  closedTrades.forEach(t => {
    const date = t.entryDate.split('T')[0];
    dailyPnL[date] = (dailyPnL[date] || 0) + (t.pnl - (t.fees || 0));
  });

  const dailyProfits = Object.values(dailyPnL).filter(p => p > 0);
  const totalProfitSum = dailyProfits.reduce((acc, p) => acc + p, 0);
  const highestDay = dailyProfits.length > 0 ? Math.max(...dailyProfits) : 0;
  
  const consistencyPct = totalProfitSum > 0 ? (highestDay / totalProfitSum) * 100 : 0;
  const isConsistent = consistencyPct <= 40;

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
    consistencyPct,
    isConsistent
  };
};

export const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    signDisplay: 'always'
  }).format(val);
};

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
