
export type TradeSide = 'LONG' | 'SHORT';
export type TradeStatus = 'OPEN' | 'CLOSED';

export interface Account {
  id: string;
  name: string;
  startingBalance: number;
  isArchived?: boolean;
}

export interface Trade {
  id: string;
  accountId: string; // Link to specific PA account
  symbol: string;
  side: TradeSide;
  status: TradeStatus;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  entryDate: string;
  exitDate?: string;
  pnl: number;
  fees: number;
  riskAmount: number;
  tradingPlan: string;
  analysis: string;
  results: string;
  lessons: string;
  externalId?: string; // To prevent duplicates
  source?: 'MANUAL' | 'TRADOVATE' | 'CSV';
}

export interface TradovateConfig {
  apiKey: string;
  apiSecret: string;
  username: string;
  password: string;
  isDemo: boolean;
}

export interface TradingMetrics {
  totalTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  totalPnL: number;
  sharpeRatio: number;
  avgRR: number;
  startingBalance: number;
  currentBalance: number;
  consistencyPct: number;
  isConsistent: boolean;
}
