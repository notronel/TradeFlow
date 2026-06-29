
import React, { useState, useMemo } from 'react';
import { Trade } from '../types';
import { calculateDailyPnL, formatCurrency } from '../utils/calculations';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info, Target, FileText, CheckCircle2, Lightbulb, Clock } from 'lucide-react';

interface Props {
  trades: Trade[];
}

const PnLCalendar: React.FC<Props> = ({ trades }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const monthData = useMemo(() => {
    return calculateDailyPnL(trades);
  }, [trades]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);
  
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const selectedData = useMemo(() => {
    return selectedDateStr ? monthData[selectedDateStr] : null;
  }, [selectedDateStr, monthData]);

  const days = [];
  // Padding for start of month
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`pad-${i}`} className="h-28 md:h-40 bg-stone-50 border border-neutral-200 rounded-xl dark:bg-neutral-950/40 dark:border-neutral-800/50"></div>);
  }

  // Actual days
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const data = monthData[dateStr];
    const isSelected = selectedDateStr === dateStr;
    
    days.push(
      <button 
        key={day} 
        onClick={() => setSelectedDateStr(dateStr)}
        className={`h-28 md:h-40 rounded-xl p-2 flex flex-col justify-between transition-all border-2 items-center ${
          isSelected 
            ? 'bg-neutral-950 text-white border-neutral-950 shadow-sm z-10 dark:bg-neutral-100 dark:text-neutral-950 dark:border-neutral-100' 
            : 'bg-white border-neutral-200 hover:border-neutral-300 hover:bg-stone-50 dark:bg-neutral-900 dark:border-neutral-800 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/60'
        }`}
      >
        <span className={`text-[10px] font-bold ${isSelected ? '' : 'text-neutral-500 dark:text-neutral-500'}`}>{day}</span>
        {data ? (
          <div className="w-full text-center">
            <div className={`text-[10px] md:text-xs font-black truncate ${data.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(data.pnl)}
            </div>
            <div className={`text-[9px] font-bold uppercase tracking-tighter ${isSelected ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-500'}`}>
              {data.count} {data.count === 1 ? 'Trade' : 'Trades'}
            </div>
            <div className={`mt-1 h-1 w-full rounded-full overflow-hidden ${isSelected ? 'bg-neutral-700 dark:bg-neutral-300' : 'bg-neutral-200 dark:bg-neutral-800'}`}>
              <div 
                className={`h-full ${data.pnl >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                style={{ width: '100%' }}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center opacity-5">
            <CalendarIcon size={16} className="text-neutral-400 dark:text-neutral-700" />
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-neutral-950 flex items-center gap-3 dark:text-neutral-50">
            <CalendarIcon className="text-neutral-700 dark:text-neutral-200" />
            Calendar
          </h2>
          <p className="text-neutral-500 mt-1">Daily performance distribution and journaling.</p>
        </div>
        
        <div className="flex items-center space-x-4 bg-white border border-neutral-200 rounded-2xl p-2 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
          <button onClick={prevMonth} className="p-2 hover:bg-stone-100 rounded-xl transition-colors text-neutral-500 hover:text-neutral-950 dark:hover:bg-neutral-800 dark:hover:text-neutral-100">
            <ChevronLeft size={20} />
          </button>
          <div className="text-sm font-black w-36 text-center uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
            {monthName} {year}
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-stone-100 rounded-xl transition-colors text-neutral-500 hover:text-neutral-950 dark:hover:bg-neutral-800 dark:hover:text-neutral-100">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-7 gap-2 md:gap-3 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-600 py-2">
            {d}
          </div>
        ))}
        {days}
      </div>

      {/* Selected Day Details Panel */}
      {selectedDateStr && (
        <div className="animate-in slide-in-from-top-4 duration-500 bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
          <div className="bg-stone-50 px-8 py-6 border-b border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-6 dark:bg-neutral-950/60 dark:border-neutral-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center text-neutral-800 font-black dark:bg-neutral-800 dark:text-neutral-100">
                {new Date(selectedDateStr).getDate()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-neutral-950 dark:text-neutral-50">
                  {new Date(selectedDateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-neutral-500 font-medium uppercase tracking-wider">
                  <span>{selectedData?.count || 0} Trades Recorded</span>
                  {selectedData && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700"></span>
                      <span className={selectedData.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        Daily PnL: {formatCurrency(selectedData.pnl)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button 
              onClick={() => setSelectedDateStr(null)}
              className="text-neutral-500 hover:text-neutral-950 transition-colors dark:hover:text-neutral-100"
            >
              Close Details
            </button>
          </div>

          <div className="p-8">
            {selectedData ? (
              <div className="space-y-12">
                {selectedData.trades.map((trade, idx) => (
                  <div key={trade.id} className="space-y-6">
                    {/* Trade Header */}
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-4 dark:border-neutral-800">
                      <div className="flex items-center gap-3">
                        <span className="text-neutral-400 dark:text-neutral-600 font-black text-sm uppercase">#{idx + 1}</span>
                        <h4 className="font-bold text-lg text-neutral-800 dark:text-neutral-200">{trade.symbol === 'JOURNAL' ? 'Journal Entry' : trade.symbol}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${trade.pnl >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {trade.pnl >= 0 ? 'Win' : 'Loss'}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono font-bold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(trade.pnl)}</div>
                        {trade.entryPrice > 0 && <div className="text-[10px] text-neutral-500 uppercase font-bold">{trade.side} @ {trade.entryPrice}</div>}
                      </div>
                    </div>

                    {/* Journal Content */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <DetailSection title="Trading Plan" content={trade.tradingPlan} icon={<Target size={14} className="text-neutral-500" />} />
                      <DetailSection title="Market Analysis" content={trade.analysis} icon={<FileText size={14} className="text-neutral-500" />} />
                      <DetailSection title="Results" content={trade.results} icon={<CheckCircle2 size={14} className="text-emerald-400" />} />
                      <DetailSection title="Lessons" content={trade.lessons} icon={<Lightbulb size={14} className="text-amber-400" />} isHighlight />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="mx-auto text-neutral-300 dark:text-neutral-800 mb-4" size={48} />
                <p className="text-neutral-500 font-medium">No activity recorded for this day.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      {!selectedDateStr && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 flex flex-wrap gap-8 justify-center shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Profitable Day</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Loss Day</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-700"></div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">No Activity</span>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailSection: React.FC<{ title: string; content: string; icon: React.ReactNode; isHighlight?: boolean }> = ({ title, content, icon, isHighlight }) => {
  if (!content) return null;
  return (
    <div className="space-y-3">
      <h5 className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
        {icon}
        {title}
      </h5>
      <p className={`text-sm leading-relaxed ${isHighlight ? 'text-neutral-900 font-medium dark:text-neutral-100' : 'text-neutral-600 dark:text-neutral-400'}`}>
        {content}
      </p>
    </div>
  );
}

export default PnLCalendar;
