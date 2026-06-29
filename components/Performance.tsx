import React, { useMemo } from 'react';
import { Trade } from '../types';
import {
  buildPnLBellCurve,
  calculatePerformanceMetrics,
  formatCurrency,
} from '../utils/calculations';
import {
  Activity,
  ArrowDownUp,
  BarChart3,
  Clock3,
  Percent,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface Props {
  trades: Trade[];
}

const Performance: React.FC<Props> = ({ trades }) => {
  const metrics = useMemo(() => calculatePerformanceMetrics(trades), [trades]);
  const bellCurve = useMemo(() => buildPnLBellCurve(trades), [trades]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-neutral-950 dark:text-neutral-50">Performance</h2>
          <p className="mt-1 text-sm text-neutral-500">Distribution, expectancy, and trade mix.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-500 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <BarChart3 size={14} className="text-neutral-500" />
          System-level trade analysis
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="Trade Expectancy"
          value={formatCurrency(metrics.expectancy)}
          icon={<Activity size={18} />}
          subValue={`Net PnL ${formatCurrency(metrics.netPnL)}`}
          tone={metrics.expectancy >= 0 ? 'positive' : 'negative'}
        />
        <MetricCard
          title="Win / Loss"
          value={`${metrics.winRate.toFixed(1)}% / ${metrics.lossRate.toFixed(1)}%`}
          icon={<Percent size={18} />}
          subValue="Win rate and loss rate"
          tone={metrics.winRate >= 50 ? 'positive' : 'warning'}
        />
        <MetricCard
          title="Longs / Shorts"
          value={`${metrics.longPct.toFixed(1)}% / ${metrics.shortPct.toFixed(1)}%`}
          icon={<ArrowDownUp size={18} />}
          subValue="Directional split"
          tone={metrics.longPct === metrics.shortPct ? 'neutral' : metrics.longPct > metrics.shortPct ? 'positive' : 'warning'}
        />
        <MetricCard
          title="Amount of Trades"
          value={`${metrics.totalTrades}`}
          icon={<BarChart3 size={18} />}
          subValue="Closed trades analyzed"
          tone="neutral"
        />
        <MetricCard
          title="Average Trade Time"
          value={metrics.averageTradeTimeLabel}
          icon={<Clock3 size={18} />}
          subValue={`${Math.round(metrics.averageTradeTimeMinutes)} minutes average`}
          tone="neutral"
        />
        <MetricCard
          title="Trade Mix"
          value={bellCurve.length > 0 ? 'PnL spread' : 'No data'}
          icon={<TrendingUp size={18} />}
          subValue="Histogram and bell curve"
          tone="neutral"
        >
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>Longs</span>
              <span>{metrics.longPct.toFixed(1)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
              <div className="h-full rounded-full bg-neutral-950 dark:bg-neutral-100" style={{ width: `${Math.max(metrics.longPct, 4)}%` }} />
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>Shorts</span>
              <span>{metrics.shortPct.toFixed(1)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
              <div className="h-full rounded-full bg-rose-500" style={{ width: `${Math.max(metrics.shortPct, 4)}%` }} />
            </div>
          </div>
        </MetricCard>
      </div>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-neutral-500">PNL Bell Curve</p>
            <h3 className="mt-2 text-xl font-bold text-neutral-950 dark:text-neutral-50">Trade distribution by net result</h3>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-stone-50 px-3 py-2 text-xs font-bold text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950">
            Spread centered at {formatCurrency(metrics.expectancy)}
          </div>
        </div>

        <div className="h-[340px] w-full">
          {bellCurve.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={bellCurve} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                <XAxis dataKey="label" stroke="#737373" tick={{ fontSize: 10 }} />
                <YAxis stroke="#737373" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e5e5',
                    borderRadius: '12px',
                    color: '#171717',
                  }}
                  formatter={(value: unknown, name) => [
                    typeof value === 'number' ? value.toFixed(2) : String(value),
                    name === 'count' ? 'Trades' : 'Curve',
                  ]}
                />
                <Bar dataKey="count" fill="#171717" radius={[6, 6, 0, 0]} />
                <Line type="monotone" dataKey="curve" stroke="#525252" strokeWidth={3} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-stone-50 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950">
              Add closed trades to view the distribution.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  subValue: string;
  tone: 'positive' | 'negative' | 'warning' | 'neutral';
  children?: React.ReactNode;
}> = ({ title, value, icon, subValue, tone, children }) => (
  <section className={`rounded-xl border bg-white p-5 shadow-sm dark:bg-neutral-900 ${toneClass(tone, 'border')}`}>
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-neutral-500">{title}</p>
        <p className={`mt-2 text-2xl font-black tracking-tight ${toneClass(tone, 'text')}`}>{value}</p>
        <p className="mt-1 text-xs font-semibold text-neutral-500">{subValue}</p>
      </div>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 ${toneClass(tone, 'text')}`}>
        {icon}
      </div>
    </div>
    {children}
  </section>
);

const toneClass = (
  tone: 'positive' | 'negative' | 'warning' | 'neutral',
  target: 'text' | 'border'
) => {
  if (target === 'text') {
    return {
      positive: 'text-emerald-600 dark:text-emerald-400',
      negative: 'text-rose-600 dark:text-rose-400',
      warning: 'text-amber-600 dark:text-amber-400',
      neutral: 'text-neutral-950 dark:text-neutral-100',
    }[tone];
  }

  return {
    positive: 'border-emerald-500/30',
    negative: 'border-rose-500/30',
    warning: 'border-amber-500/30',
    neutral: 'border-neutral-200 dark:border-neutral-800',
  }[tone];
};

export default Performance;
