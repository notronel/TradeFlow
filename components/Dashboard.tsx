
import { TrendingUp, Target, BarChart3, Activity, Wallet, Zap, ShieldCheck, ShieldAlert } from 'lucide-react';
import React from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Trade, TradingMetrics } from '../types';
import { formatCurrency, formatCurrencyPlain } from '../utils/calculations';

interface Props {
  metrics: TradingMetrics;
  trades: Trade[];
}

const Dashboard: React.FC<Props> = ({ metrics, trades }) => {
  const equityCurve = React.useMemo(() => {
    const closedTrades = trades
      .slice()
      .filter(t => t.symbol !== 'JOURNAL' && t.status === 'CLOSED')
      .reverse();

    const data = closedTrades.reduce((acc: any[], trade, idx) => {
      const prevTotal = idx === 0 ? metrics.startingBalance : acc[idx - 1].balance;
      acc.push({
        name: idx + 1,
        balance: prevTotal + (trade.pnl - (trade.fees || 0)),
        date: new Date(trade.entryDate).toLocaleDateString()
      });
      return acc;
    }, []);

    return [{ name: 0, balance: metrics.startingBalance, date: 'Initial' }, ...data];
  }, [trades, metrics.startingBalance]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Trading Overview</h2>
          <p className="text-slate-400 mt-1">Real-time performance metrics and equity growth.</p>
        </div>
      </header>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Account Balance" 
          value={formatCurrencyPlain(metrics.currentBalance)} 
          icon={<Wallet className="text-indigo-400" />} 
          subValue={`Starting: ${formatCurrencyPlain(metrics.startingBalance)}`}
          highlight={metrics.totalPnL > 0 ? 'positive' : metrics.totalPnL < 0 ? 'negative' : 'neutral'}
        />
        <MetricCard 
          title="Win Rate" 
          value={`${metrics.winRate.toFixed(1)}%`} 
          icon={<Target className="text-emerald-400" />} 
          subValue={`${metrics.totalTrades} Total Trades`}
        />
        <MetricCard 
          title="Avg Win / Loss" 
          value={`${formatCurrency(metrics.avgWin)} / ${formatCurrency(metrics.avgLoss)}`} 
          icon={<BarChart3 className="text-amber-400" />}
          subValue={`Profit Factor: ${metrics.profitFactor.toFixed(2)}`}
        />
        <MetricCard 
          title="Consistency" 
          value={`${metrics.consistencyPct.toFixed(1)}%`} 
          icon={metrics.isConsistent ? <ShieldCheck className="text-emerald-400" /> : <ShieldAlert className="text-rose-400" />}
          subValue={metrics.isConsistent ? "Within 40% rule" : "Breaches 40% rule"}
          highlight={metrics.isConsistent ? 'positive' : 'negative'}
        />
      </div>

      {/* Chart Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold flex items-center">
            <TrendingUp className="mr-2 text-indigo-400" size={20} />
            Equity Growth (Portfolio Value)
          </h3>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-800 px-3 py-1 rounded-full">
            Starting at {formatCurrencyPlain(metrics.startingBalance)}
          </div>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityCurve}>
              <defs>
                <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 10}} label={{ value: 'Trade #', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#64748b' }} />
              <YAxis 
                stroke="#64748b" 
                tick={{fontSize: 10}} 
                tickFormatter={(val) => `$${val}`}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                itemStyle={{ color: '#f8fafc' }}
                formatter={(value) => [formatCurrencyPlain(Number(value)), 'Portfolio Value']}
              />
              <Area 
                type="monotone" 
                dataKey="balance" 
                stroke="#6366f1" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorPnL)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Recent Insights Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
           <h3 className="text-lg font-semibold mb-4">Risk Profile</h3>
           <div className="space-y-4">
              <div className="flex justify-between items-center text-sm text-slate-400">
                <span>Total Net PnL</span>
                <span className={metrics.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatCurrency(metrics.totalPnL)}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div 
                  className="bg-indigo-500 h-2 rounded-full" 
                  style={{ width: `${Math.min(metrics.winRate, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 italic">"Focus on maintaining a high RR even when win rate fluctuates."</p>
           </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
           <h3 className="text-lg font-semibold mb-4">Trading Strengths</h3>
           <ul className="space-y-3 text-sm text-slate-400">
             <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>Consistent risk application</li>
             <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>High discipline on exit plans</li>
             <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-slate-600 mr-2"></span>Awaiting more data for analysis...</li>
           </ul>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  subValue: string;
  highlight?: 'positive' | 'negative' | 'neutral'
}> = ({ 
  title, value, icon, subValue, highlight = 'neutral'
}) => (
  <div className={`bg-slate-900 border rounded-xl p-5 hover:border-slate-700 transition-colors ${
    highlight === 'positive' ? 'border-emerald-500/20' : 
    highlight === 'negative' ? 'border-rose-500/20' : 
    'border-slate-800'
  }`}>
    <div className="flex justify-between items-start mb-2">
      <span className="text-slate-400 text-sm font-medium">{title}</span>
      <div className="p-2 bg-slate-800 rounded-lg">{icon}</div>
    </div>
    <div className={`text-2xl font-bold mb-1 ${
      highlight === 'positive' ? 'text-emerald-400' : 
      highlight === 'negative' ? 'text-rose-400' : 
      ''
    }`}>{value}</div>
    <div className="text-xs text-slate-500 font-medium">{subValue}</div>
  </div>
);

export default Dashboard;
