import React, { useMemo, useState } from 'react';
import { DailyReview, EvaluationConfig, Trade, TradingMetrics } from '../types';
import {
  calculateConsistency,
  calculateDailyPnL,
  calculateEvaluationProgress,
  formatDuration,
  formatCurrency,
  formatCurrencyPlain,
  getTradeNetPnL,
} from '../utils/calculations';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  GaugeCircle,
  ImagePlus,
  SlidersHorizontal,
  Target,
  Trash2,
  Upload,
  Wallet,
} from 'lucide-react';

interface Props {
  metrics: TradingMetrics;
  trades: Trade[];
  evaluationConfig: EvaluationConfig;
  onEvaluationConfigChange: (config: EvaluationConfig) => void;
  dayReviews: Record<string, DailyReview>;
  onDayReviewChange: (dateKey: string, review: DailyReview) => void;
}

const Dashboard: React.FC<Props> = ({
  metrics,
  trades,
  evaluationConfig,
  onEvaluationConfigChange,
  dayReviews,
  onDayReviewChange,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  const dailyPnL = useMemo(() => calculateDailyPnL(trades), [trades]);
  const consistency = useMemo(() => calculateConsistency(trades), [trades]);
  const evaluation = useMemo(
    () => calculateEvaluationProgress(metrics, evaluationConfig),
    [evaluationConfig, metrics]
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const totalDays = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();
  const selectedData = selectedDateStr ? dailyPnL[selectedDateStr] : null;
  const selectedTrades = selectedData?.trades ?? [];
  const selectedReview = selectedDateStr ? dayReviews[selectedDateStr] ?? { note: '', images: [], updatedAt: '' } : null;
  const selectedNetPnL = selectedTrades.reduce((acc, trade) => acc + getTradeNetPnL(trade), 0);

  const selectedDayStats = useMemo(() => {
    const tradeCount = selectedTrades.length;
    const winners = selectedTrades.filter(trade => getTradeNetPnL(trade) > 0).length;
    const longs = selectedTrades.filter(trade => trade.side === 'LONG').length;
    const shorts = selectedTrades.filter(trade => trade.side === 'SHORT').length;
    const avgTradeTime = selectedTrades.reduce((acc, trade) => {
      if (!trade.exitDate) return acc;
      const start = new Date(trade.entryDate).getTime();
      const end = new Date(trade.exitDate).getTime();
      if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return acc;
      return acc + ((end - start) / 60000);
    }, 0);
    const timedTrades = selectedTrades.filter(trade => trade.exitDate && new Date(trade.exitDate).getTime() > new Date(trade.entryDate).getTime()).length;

    return {
      tradeCount,
      netPnL: selectedNetPnL,
      winRate: tradeCount > 0 ? (winners / tradeCount) * 100 : 0,
      longPct: tradeCount > 0 ? (longs / tradeCount) * 100 : 0,
      shortPct: tradeCount > 0 ? (shorts / tradeCount) * 100 : 0,
      expectancy: tradeCount > 0 ? selectedNetPnL / tradeCount : 0,
      averageTradeTimeMinutes: timedTrades > 0 ? avgTradeTime / timedTrades : 0,
    };
  }, [selectedNetPnL, selectedTrades]);

  const monthSummary = useMemo(() => {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return Object.entries(dailyPnL).reduce(
      (acc, [date, day]) => {
        if (!date.startsWith(monthPrefix)) return acc;
        acc.pnl += day.pnl;
        acc.trades += day.count;
        acc.activeDays += 1;
        return acc;
      },
      { pnl: 0, trades: 0, activeDays: 0 }
    );
  }, [dailyPnL, month, year]);

  const updateEvaluationConfig = (key: keyof EvaluationConfig, value: number) => {
    onEvaluationConfigChange({
      ...evaluationConfig,
      [key]: Number.isFinite(value) ? value : 0,
    });
  };

  const updateSelectedReview = (review: DailyReview) => {
    if (!selectedDateStr) return;
    onDayReviewChange(selectedDateStr, review);
  };

  const appendReviewImages = async (files: FileList | null) => {
    if (!selectedDateStr || !files || files.length === 0) return;
    const existing = selectedReview?.images ?? [];
    const newImages = await Promise.all(
      Array.from(files).map(file => fileToDataUrl(file))
    );
    updateSelectedReview({
      note: selectedReview?.note ?? '',
      images: [...existing, ...newImages],
      updatedAt: new Date().toISOString(),
    });
  };

  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`pad-${i}`} className="min-h-28 md:min-h-36 xl:min-h-40 rounded-lg bg-stone-50 border border-neutral-200 dark:bg-neutral-950/40 dark:border-neutral-800/50" />);
  }

  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const data = dailyPnL[dateStr];
    const isSelected = selectedDateStr === dateStr;

    days.push(
      <button
        key={dateStr}
        onClick={() => setSelectedDateStr(prev => (prev === dateStr ? null : dateStr))}
        className={`min-h-28 md:min-h-36 xl:min-h-40 rounded-lg border p-2 text-left transition-all ${
          isSelected
            ? 'border-neutral-950 bg-neutral-950 text-white shadow-sm dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950'
            : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-stone-50 dark:border-neutral-800 dark:bg-neutral-950/70 dark:hover:border-neutral-700 dark:hover:bg-neutral-900'
        }`}
      >
        <div className={`text-[10px] font-black ${isSelected ? '' : 'text-neutral-500 dark:text-neutral-500'}`}>
          {day}
        </div>
        {data ? (
          <div className="mt-3 space-y-1">
            <div className={`truncate text-xs font-black ${data.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(data.pnl)}
            </div>
            <div className={`text-[9px] font-bold uppercase tracking-tight ${isSelected ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-500'}`}>
              {data.count} {data.count === 1 ? 'trade' : 'trades'}
            </div>
          </div>
        ) : (
          <div className={`mt-5 h-1 rounded-full ${isSelected ? 'bg-neutral-700 dark:bg-neutral-300' : 'bg-neutral-200 dark:bg-neutral-800'}`} />
        )}
      </button>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-neutral-950 dark:text-neutral-50">Trading Journal</h2>
          <p className="mt-1 text-sm text-neutral-500">Daily execution, account progress, and eval risk in one view.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
          <SlidersHorizontal size={14} className="text-neutral-500" />
          Eval rules are saved locally
        </div>
      </header>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MetricTile
          title="PNL"
          icon={<Wallet size={20} />}
          value={formatCurrency(metrics.totalPnL)}
          tone={metrics.totalPnL > 0 ? 'positive' : metrics.totalPnL < 0 ? 'negative' : 'neutral'}
          subValue={`Balance ${formatCurrencyPlain(metrics.currentBalance)}`}
        >
          <div className="grid grid-cols-2 gap-3">
            <SummaryPill label="Trades" value={`${metrics.totalTrades}`} />
            <SummaryPill label="Win rate" value={`${metrics.winRate.toFixed(1)}%`} />
          </div>
        </MetricTile>

        <MetricTile
          title="Consistency"
          icon={<GaugeCircle size={20} />}
          value={`${consistency.bestDayShare.toFixed(1)}%`}
          tone={consistency.bestDayShare === 0 ? 'neutral' : consistency.bestDayShare <= 35 ? 'positive' : consistency.bestDayShare <= 50 ? 'warning' : 'negative'}
          subValue="Largest winning day share"
        >
          <div className="space-y-3">
            <ProgressBar
              value={Math.min(consistency.bestDayShare, 100)}
              tone={consistency.bestDayShare <= 35 ? 'positive' : consistency.bestDayShare <= 50 ? 'warning' : 'negative'}
            />
            <div className="grid grid-cols-2 gap-3">
              <SummaryPill label="Best day" value={formatCurrencyPlain(consistency.largestWinningDay)} />
              <SummaryPill label="Gross wins" value={formatCurrencyPlain(consistency.totalWinningPnL)} />
            </div>
          </div>
        </MetricTile>

        <MetricTile
          title="Distance to Eval"
          icon={<Target size={20} />}
          value={evaluation.isPassed ? 'Passed' : evaluation.isFailed ? 'Failed' : formatCurrencyPlain(evaluation.passDistance)}
          tone={evaluation.isPassed ? 'positive' : evaluation.isFailed ? 'negative' : 'neutral'}
          subValue={evaluation.isPassed ? 'Profit target reached' : evaluation.isFailed ? 'Max loss breached' : 'Remaining to pass'}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <ProgressLabel label="Pass progress" value={`${evaluation.passProgress.toFixed(0)}%`} />
              <ProgressBar value={evaluation.passProgress} tone="positive" />
              <ProgressLabel label="Fail buffer" value={formatCurrencyPlain(evaluation.failDistance)} />
              <ProgressBar value={evaluation.failBufferProgress} tone={evaluation.isFailed ? 'negative' : 'warning'} />
            </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <NumberField
                label="Target"
                value={evaluationConfig.targetProfit}
                onChange={value => updateEvaluationConfig('targetProfit', value)}
              />
              <NumberField
                label="Max loss"
                value={evaluationConfig.maxLoss}
                onChange={value => updateEvaluationConfig('maxLoss', value)}
              />
            </div>
          </div>
        </MetricTile>
      </div>

      <section className="mx-auto max-w-4xl rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:p-6">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
              <CalendarIcon size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-950 dark:text-neutral-50">Calendar View</h3>
              <p className="text-xs font-medium text-neutral-500">
                {monthSummary.activeDays} active days, {monthSummary.trades} trades, {formatCurrency(monthSummary.pnl)} this month
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-stone-50 p-1 dark:border-neutral-800 dark:bg-neutral-950 md:justify-start">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="rounded-md p-2 text-neutral-500 transition-colors hover:bg-white hover:text-neutral-950 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="w-36 text-center text-xs font-black uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
              {monthName} {year}
            </div>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="rounded-md p-2 text-neutral-500 transition-colors hover:bg-white hover:text-neutral-950 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-7 gap-2 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-1 text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-600">
              {day}
            </div>
          ))}
          {days}
        </div>

        <div className="mt-5 rounded-lg border border-neutral-200 bg-stone-50 p-4 dark:border-neutral-800 dark:bg-neutral-950/70">
          {selectedDateStr ? (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-600">Selected Day</p>
                  <p className="mt-1 text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    {new Date(selectedDateStr).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm md:min-w-64">
                  <SummaryPill label="Trades" value={`${selectedDayStats.tradeCount}`} />
                  <SummaryPill
                    label="Daily PnL"
                    value={selectedData ? formatCurrency(selectedData.pnl) : formatCurrencyPlain(0)}
                    tone={selectedData && selectedData.pnl < 0 ? 'negative' : selectedData && selectedData.pnl > 0 ? 'positive' : 'neutral'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <SummaryPill label="Win rate" value={`${selectedDayStats.winRate.toFixed(1)}%`} />
                <SummaryPill label="Expectancy" value={formatCurrency(selectedDayStats.expectancy)} tone={selectedDayStats.expectancy >= 0 ? 'positive' : 'negative'} />
                <SummaryPill label="Longs" value={`${selectedDayStats.longPct.toFixed(1)}%`} />
                <SummaryPill label="Shorts" value={`${selectedDayStats.shortPct.toFixed(1)}%`} />
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-600">Trade Review</p>
                  <textarea
                    className="mt-3 min-h-32 w-full rounded-lg border border-neutral-200 bg-stone-50 p-3 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-neutral-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-600"
                    placeholder="Write what worked, what did not, and what to adjust next time."
                    value={selectedReview?.note ?? ''}
                    onChange={(event) => {
                      updateSelectedReview({
                        note: event.target.value,
                        images: selectedReview?.images ?? [],
                        updatedAt: new Date().toISOString(),
                      });
                    }}
                  />
                </div>

                <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-600">Reference Images</p>
                      <p className="mt-1 text-sm text-neutral-500">Upload screenshots or trade notes for this day.</p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-stone-50 px-3 py-2 text-xs font-bold text-neutral-600 transition-colors hover:bg-white dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800">
                      <Upload size={14} />
                      Add images
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={(event) => {
                          void appendReviewImages(event.target.files);
                          event.currentTarget.value = '';
                        }}
                      />
                    </label>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                    {(selectedReview?.images ?? []).length > 0 ? (
                      (selectedReview?.images ?? []).map((src, index) => (
                        <div key={`${selectedDateStr}-img-${index}`} className="group relative overflow-hidden rounded-lg border border-neutral-200 bg-stone-50 dark:border-neutral-800 dark:bg-neutral-950">
                          <img src={src} alt={`Review attachment ${index + 1}`} className="h-24 w-full object-cover" />
                          <button
                            type="button"
                            className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() => {
                              const images = (selectedReview?.images ?? []).filter((_, imageIndex) => imageIndex !== index);
                              updateSelectedReview({
                                note: selectedReview?.note ?? '',
                                images,
                                updatedAt: new Date().toISOString(),
                              });
                            }}
                            aria-label="Remove image"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full rounded-lg border border-dashed border-neutral-200 bg-stone-50 px-4 py-8 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950">
                        <ImagePlus className="mx-auto mb-2 text-neutral-400 dark:text-neutral-600" size={28} />
                        No images uploaded yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedTrades.length > 0 && (
                <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-600">Trades For Day</p>
                    <span className="text-xs font-bold text-neutral-500">{selectedTrades.length} total</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {selectedTrades.map(trade => (
                      <div key={trade.id} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-stone-50 px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-950">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-neutral-800 dark:text-neutral-200">{trade.symbol === 'JOURNAL' ? 'Journal' : trade.symbol}</span>
                          <span className={`text-[10px] font-black uppercase ${trade.side === 'LONG' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{trade.side}</span>
                        </div>
                        <span className={getTradeNetPnL(trade) >= 0 ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'font-bold text-rose-600 dark:text-rose-400'}>
                          {formatCurrency(getTradeNetPnL(trade))}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-neutral-500">
                    <span>Net PnL: {formatCurrency(selectedNetPnL)}</span>
                    <span>Average trade size: {formatCurrency(selectedDayStats.expectancy)}</span>
                    <span>Average trade time: {formatDuration(selectedDayStats.averageTradeTimeMinutes)}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm font-medium text-neutral-500">Select a day to see its trade count and daily PnL.</p>
          )}
        </div>
      </section>

    </div>
  );
};

const MetricTile: React.FC<{
  title: string;
  icon: React.ReactNode;
  value: string;
  subValue: string;
  tone: 'positive' | 'negative' | 'warning' | 'neutral';
  children: React.ReactNode;
}> = ({ title, icon, value, subValue, tone, children }) => (
  <section className={`aspect-square min-h-[180px] rounded-xl border bg-white p-3 shadow-sm dark:bg-neutral-900 ${toneClass(tone, 'border')}`}>
    <div className="mb-1.5 flex items-start justify-between gap-2">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{title}</p>
        <p className={`mt-0.5 break-words text-base font-black tracking-tight ${toneClass(tone, 'text')}`}>
          {value}
        </p>
        <p className="mt-0.5 text-[9px] font-semibold text-neutral-500">{subValue}</p>
      </div>
      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 ${toneClass(tone, 'text')}`}>
        {icon}
      </div>
    </div>
    {children}
  </section>
);

const SummaryPill: React.FC<{
  label: string;
  value: string;
  tone?: 'positive' | 'negative' | 'neutral';
}> = ({ label, value, tone = 'neutral' }) => (
  <div className="rounded-lg border border-neutral-200 bg-stone-50 px-2 py-1 dark:border-neutral-800 dark:bg-neutral-950/70">
    <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-600">{label}</p>
    <p className={`mt-0.5 truncate text-[10px] font-bold ${toneClass(tone, 'text')}`}>{value}</p>
  </div>
);

const ProgressLabel: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3 text-xs font-bold text-neutral-500">
    <span>{label}</span>
    <span className="text-neutral-800 dark:text-neutral-200">{value}</span>
  </div>
);

const ProgressBar: React.FC<{
  value: number;
  tone: 'positive' | 'negative' | 'warning' | 'neutral';
}> = ({ value, tone }) => (
  <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
    <div
      className={`h-full rounded-full ${toneClass(tone, 'bg')}`}
      style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
    />
  </div>
);

const NumberField: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
}> = ({ label, value, onChange }) => (
  <label className="block">
    <span className="mb-1 block text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-600">{label}</span>
    <input
      type="number"
      className="w-full rounded-lg border border-neutral-200 bg-stone-50 px-3 py-2 text-xs font-bold text-neutral-900 outline-none transition-all focus:border-neutral-500 focus:ring-1 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-500 dark:focus:ring-neutral-600"
      value={value === 0 ? '' : value}
      onChange={event => onChange(Number(event.target.value))}
    />
  </label>
);

const toneClass = (
  tone: 'positive' | 'negative' | 'warning' | 'neutral',
  target: 'text' | 'border' | 'bg'
) => {
  if (target === 'text') {
    return {
      positive: 'text-emerald-600 dark:text-emerald-400',
      negative: 'text-rose-600 dark:text-rose-400',
      warning: 'text-amber-600 dark:text-amber-400',
      neutral: 'text-neutral-950 dark:text-neutral-100',
    }[tone];
  }

  if (target === 'border') {
    return {
      positive: 'border-emerald-500/30',
      negative: 'border-rose-500/30',
      warning: 'border-amber-500/30',
      neutral: 'border-neutral-200 dark:border-neutral-800',
    }[tone];
  }

  return {
    positive: 'bg-emerald-500',
    negative: 'bg-rose-500',
    warning: 'bg-amber-500',
    neutral: 'bg-neutral-500',
  }[tone];
};

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
};

export default Dashboard;
