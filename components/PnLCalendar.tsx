
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Trade } from '../types';
import { formatCurrency, formatCurrencyPlain } from '../utils/calculations';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  History, 
  Target, 
  TrendingUp,
  Scale,
  Zap,
  CheckCircle2,
  AlertTriangle,
  TrendingUp as TrendingUpIcon,
  Pencil,
  Plus,
  Save,
  X,
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Type,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

interface Props {
  trades: Trade[];
  onAddEntry: (trade: Trade) => void;
  onUpdateEntry: (trade: Trade) => void;
}

const PnLCalendar: React.FC<Props> = ({ trades, onAddEntry, onUpdateEntry }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  // Helper to generate a consistent "YYYY-MM-DD" key based on LOCAL time
  const getLocalDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Reset editing state when a new date is selected
  useEffect(() => {
    setIsEditing(false);
  }, [selectedDateStr]);

  // Pre-calculate all daily data once
  const dailyDataMap = useMemo(() => {
    const map: Record<string, { pnl: number, count: number, risk: number, wins: number, journalEntry?: Trade }> = {};
    const sorted = [...trades].sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

    sorted.forEach(trade => {
      // Use local date key to ensure trades made at 10PM don't show up on next day (UTC)
      const dateStr = getLocalDateKey(new Date(trade.entryDate));
      
      if (!map[dateStr]) {
        map[dateStr] = { pnl: 0, count: 0, risk: 0, wins: 0 };
      }
      
      if (trade.symbol === 'JOURNAL') {
        map[dateStr].journalEntry = trade;
      } else {
        const net = (trade.pnl - (trade.fees || 0));
        map[dateStr].pnl += net;
        map[dateStr].count += 1;
        map[dateStr].risk += (trade.riskAmount || 0);
        if (net > 0) map[dateStr].wins += 1;
      }
    });

    return map;
  }, [trades]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Calculate Weekly Totals
  const weeklyPnLs = useMemo(() => {
    const weeklyMap: Record<number, number> = {};
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      const dateStr = getLocalDateKey(date);
      const data = dailyDataMap[dateStr];
      
      const firstDay = new Date(year, month, 1).getDay();
      const weekIndex = Math.floor((day + firstDay - 1) / 7);
      
      if (data) {
        weeklyMap[weekIndex] = (weeklyMap[weekIndex] || 0) + data.pnl;
      }
    }
    return weeklyMap;
  }, [year, month, totalDays, dailyDataMap]);

  const selectedData = useMemo(() => selectedDateStr ? dailyDataMap[selectedDateStr] : null, [selectedDateStr, dailyDataMap]);

  const dailyMetrics = useMemo(() => {
    if (!selectedDateStr) return null;
    const historyUpToDate = Object.entries(dailyDataMap)
      .filter(([date]) => date <= selectedDateStr)
      .map(([_, data]) => (data as { pnl: number }).pnl);
    const winningDays = historyUpToDate.filter(p => p > 0);
    const totalProfit = winningDays.reduce((acc, p) => acc + p, 0);
    const highestDay = winningDays.length > 0 ? Math.max(...winningDays) : 0;
    const consistencyPct = totalProfit > 0 ? (highestDay / totalProfit) * 100 : 0;
    const isConsistent = consistencyPct <= 40;
    const currentDayData = dailyDataMap[selectedDateStr];
    const rrFactor = currentDayData?.risk > 0 ? (currentDayData.pnl / currentDayData.risk).toFixed(2) : 'N/A';
    return { rrFactor, consistencyPct: consistencyPct.toFixed(1), isConsistent };
  }, [selectedDateStr, dailyDataMap]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    // Defer setting content to ensure ref is mounted
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = selectedData?.journalEntry?.tradingPlan || '';
      }
    }, 0);
  };

  const handleSaveEntry = () => {
    if (!selectedDateStr) return;
    const content = editorRef.current?.innerHTML || '';
    const existingEntry = selectedData?.journalEntry;

    if (existingEntry) {
      onUpdateEntry({ ...existingEntry, tradingPlan: content });
    } else {
      // Force Local Noon to ensure dates don't shift when converting to ISO
      const entryDate = new Date(selectedDateStr + 'T12:00:00').toISOString();
      const newEntry: Trade = {
        id: crypto.randomUUID(),
        accountId: trades[0]?.accountId || 'default_account',
        symbol: 'JOURNAL',
        side: 'LONG',
        status: 'CLOSED',
        entryPrice: 0,
        exitPrice: 0,
        quantity: 0,
        pnl: 0,
        fees: 0,
        riskAmount: 0,
        entryDate: entryDate,
        tradingPlan: content,
        analysis: '',
        results: '',
        lessons: '',
        source: 'MANUAL'
      };
      onAddEntry(newEntry);
    }
    setIsEditing(false);
  };

  const calendarDays = [];
  for (let i = 0; i < startDay; i++) {
    if (i !== 6) {
       calendarDays.push(<div key={`pad-${i}`} className="h-20 md:h-28 bg-gray-700/50 border border-gray-600 rounded-xl"></div>);
    }
  }

  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 6) continue;

    // Use local key to match map
    const dateStr = getLocalDateKey(date);
    const data = dailyDataMap[dateStr];
    const isSelected = selectedDateStr === dateStr;
    const winRate = data && data.count > 0 ? Math.round((data.wins / data.count) * 100) : 0;
    
    calendarDays.push(
      <button 
        key={day} 
        onClick={() => setSelectedDateStr(dateStr)}
        className={`h-20 md:h-28 rounded-xl p-2 flex flex-col justify-center transition-all border-2 items-center relative overflow-hidden ${
          isSelected 
            ? 'bg-gray-700 border-indigo-500 shadow-lg ring-1 ring-indigo-500/20' 
            : 'bg-gray-700 border-gray-600 hover:border-gray-500 hover:shadow-sm'
        }`}
      >
        <span className={`absolute top-2 left-2 text-[10px] font-bold ${isSelected ? 'text-indigo-400' : 'text-white'}`}>{day}</span>
        {data ? (
          <div className="w-full text-center space-y-1">
            <div className={`text-base md:text-xl font-black truncate ${data.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {formatCurrency(data.pnl)}
            </div>
            <div className="text-[12px] text-white font-bold uppercase tracking-tight">
              {data.count} {data.count === 1 ? 'Trade' : 'Trades'}
            </div>
            {data.count > 0 && (
               <div className={`text-[12px] font-bold tracking-tight ${winRate >= 50 ? 'text-emerald-300' : 'text-rose-300'}`}>
                 {winRate}% WR
               </div>
            )}
            {data.journalEntry && <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 mx-auto" />}
          </div>
        ) : (
          <div className="opacity-10">
            <CalendarIcon size={14} className="text-white" />
          </div>
        )}
      </button>
    );

    if (dayOfWeek === 5 || day === totalDays) {
      const weekIndex = Math.floor((day + startDay - 1) / 7);
      const weekTotal = weeklyPnLs[weekIndex] || 0;
      const isNextDayNewWeek = day === totalDays || new Date(year, month, day + 1).getDay() === 0 || new Date(year, month, day + 1).getDay() === 6;
      
      if (isNextDayNewWeek) {
          let containerClass = '';
          let labelClass = '';
          let iconClass = '';
          let valueClass = '';

          if (weekTotal > 0) {
              containerClass = 'border-emerald-500/30 bg-emerald-900/20';
              labelClass = 'text-emerald-400/50';
              iconClass = 'text-emerald-400/20';
              valueClass = 'text-emerald-400';
          } else if (weekTotal < 0) {
              containerClass = 'border-rose-500/30 bg-rose-900/20';
              labelClass = 'text-rose-400/50';
              iconClass = 'text-rose-400/20';
              valueClass = 'text-rose-400';
          } else {
              // Neutral (0)
              containerClass = 'border-gray-600 bg-gray-700/50';
              labelClass = 'text-gray-400/50';
              iconClass = 'text-gray-400/20';
              valueClass = 'text-white';
          }

          calendarDays.push(
            <div key={`week-${weekIndex}`} className={`h-20 md:h-28 rounded-xl p-2 flex flex-col justify-center border-2 items-center relative overflow-hidden group transition-colors ${containerClass}`}>
               <div className={`absolute top-2 left-2 text-[8px] font-black uppercase tracking-widest ${labelClass}`}>Wk PnL</div>
               <TrendingUpIcon size={14} className={`${iconClass} absolute bottom-2 right-2 group-hover:scale-110 transition-transform`} />
               <div className={`text-sm md:text-xl font-black truncate ${valueClass}`}>
                {formatCurrency(weekTotal)}
              </div>
            </div>
          );
      }
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-24 px-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <CalendarIcon className="text-indigo-400" />
            Performance Calendar
          </h2>
          <p className="text-white text-sm mt-1">Net weekly totals calculated automatically (Saturdays hidden).</p>
        </div>
        
        <div className="flex items-center space-x-4 bg-gray-700 border border-gray-600 rounded-2xl p-2 shadow-sm">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-gray-600 rounded-xl transition-colors text-white hover:text-white">
            <ChevronLeft size={20} />
          </button>
          <div className="text-sm font-black w-36 text-center uppercase tracking-widest text-indigo-300">
            {monthName} {year}
          </div>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-gray-600 rounded-xl transition-colors text-white hover:text-white">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 md:gap-3 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Weekly PnL'].map(d => (
          <div key={d} className={`text-[10px] font-black uppercase tracking-widest py-2 ${d === 'Weekly PnL' ? 'text-emerald-300' : 'text-white'}`}>{d}</div>
        ))}
        {calendarDays}
      </div>

      {selectedDateStr && (
        <div className="bg-gray-700 border border-gray-600 rounded-3xl overflow-hidden shadow-xl animate-in slide-in-from-top-4 duration-500 mt-8">
          <div className="bg-gray-800 px-8 py-6 border-b border-gray-600 flex justify-between items-center">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-indigo-900/50 rounded-xl flex items-center justify-center text-indigo-300 font-black border border-indigo-500/20">
                {/* Use selectedDateStr components directly to avoid timezone shift in display */}
                {selectedDateStr.split('-')[2]}
              </div>
              <h3 className="text-xl font-bold text-white">
                {new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
            </div>
            <button onClick={() => setSelectedDateStr(null)} className="text-white hover:text-white text-xs font-bold uppercase tracking-widest">Close</button>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
              <SummaryCard icon={<TrendingUp size={16} />} label="Daily PnL" value={formatCurrencyPlain(selectedData?.pnl || 0)} color={selectedData && selectedData.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'} />
              <SummaryCard icon={<Target size={16} />} label="Trades" value={selectedData?.count.toString() || '0'} color="text-white" />
              <SummaryCard icon={<Scale size={16} />} label="RR Factor" value={dailyMetrics?.rrFactor || '0.00'} color="text-amber-300" />
              <SummaryCard 
                icon={<Zap size={16} />} 
                label="Consistency" 
                value={`${dailyMetrics?.consistencyPct || 0}%`} 
                color={dailyMetrics?.isConsistent ? 'text-emerald-300' : 'text-rose-300'} 
                status={dailyMetrics?.isConsistent ? <CheckCircle2 size={12} className="text-emerald-300" /> : <AlertTriangle size={12} className="text-rose-300" />}
                subtitle="Profit Concentration (40% Rule)"
              />
              <SummaryCard icon={<History size={16} />} label="Narrative" value={selectedData?.journalEntry ? 'Logged' : 'Missing'} color={selectedData?.journalEntry ? 'text-indigo-300' : 'text-white'} />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <History size={14} className="text-indigo-300" />
                  Narrative Details
                </h4>
                
                {!isEditing && (
                  <button 
                    onClick={handleStartEdit}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-300 hover:text-white bg-indigo-900/30 hover:bg-indigo-900/50 px-3 py-1.5 rounded-lg border border-indigo-500/20 transition-all"
                  >
                    {selectedData?.journalEntry ? <><Pencil size={12} /> Edit Entry</> : <><Plus size={12} /> Add Entry</>}
                  </button>
                )}
              </div>
              
              <div className={`bg-gray-800 rounded-2xl p-6 border transition-all ${isEditing ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-gray-600'}`}>
                {isEditing ? (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex flex-wrap gap-1 bg-gray-700 p-2 rounded-xl border border-gray-600">
                      <ToolbarBtn onClick={() => execCommand('bold')} icon={<Bold size={14} />} title="Bold" />
                      <ToolbarBtn onClick={() => execCommand('italic')} icon={<Italic size={14} />} title="Italic" />
                      <ToolbarBtn onClick={() => execCommand('underline')} icon={<Underline size={14} />} title="Underline" />
                      <div className="w-px h-5 bg-gray-600 mx-1 self-center" />
                      <ToolbarBtn onClick={() => execCommand('formatBlock', 'H1')} icon={<Heading1 size={14} />} title="Heading 1" />
                      <ToolbarBtn onClick={() => execCommand('formatBlock', 'H2')} icon={<Heading2 size={14} />} title="Heading 2" />
                      <ToolbarBtn onClick={() => execCommand('formatBlock', 'P')} icon={<Type size={14} />} title="Text" />
                      <div className="w-px h-5 bg-gray-600 mx-1 self-center" />
                      <ToolbarBtn onClick={() => execCommand('insertUnorderedList')} icon={<List size={14} />} title="Bullets" />
                      <ToolbarBtn onClick={() => execCommand('insertOrderedList')} icon={<ListOrdered size={14} />} title="Numbers" />
                    </div>
                    
                    <div 
                      ref={editorRef}
                      contentEditable
                      className="w-full bg-gray-900 min-h-[200px] rounded-xl p-4 text-sm leading-relaxed focus:outline-none text-white border border-gray-700 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500 editor-content"
                      data-placeholder="Record your thoughts on today's price action..."
                    />
                    
                    <div className="flex justify-end gap-2 pt-2">
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                      >
                        <X size={14} /> Cancel
                      </button>
                      <button 
                        onClick={handleSaveEntry}
                        className="flex items-center gap-1.5 px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all"
                      >
                        <Save size={14} /> Save Entry
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {selectedData?.journalEntry ? (
                      <div 
                        className="editor-content prose prose-invert prose-gray max-w-none text-white"
                        dangerouslySetInnerHTML={{ __html: selectedData.journalEntry.tradingPlan }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 space-y-3 opacity-50">
                        <History size={32} />
                        <p className="text-white italic text-center">No narrative record exists for this date.</p>
                        <button onClick={handleStartEdit} className="text-indigo-300 hover:text-white underline text-sm">Write one now</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .editor-content h1 { font-size: 1.5rem; font-weight: 800; margin-bottom: 1rem; color: #a5b4fc; }
        .editor-content h2 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem; color: #818cf8; }
        .editor-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
        .editor-content ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1rem; }
        .editor-content p { margin-bottom: 1rem; }
        .editor-content b, .editor-content strong { font-weight: bold; color: #f3f4f6; }
      `}</style>
    </div>
  );
};

const ToolbarBtn = ({ onClick, icon, title }: { onClick: () => void, icon: React.ReactNode, title: string }) => (
  <button 
    onClick={(e) => { e.preventDefault(); onClick(); }}
    title={title}
    className="p-1.5 rounded-lg hover:bg-gray-600 text-gray-300 hover:text-white transition-all"
  >
    {icon}
  </button>
);

const SummaryCard = ({ icon, label, value, color, status, subtitle }: { icon: any, label: string, value: string, color: string, status?: React.ReactNode, subtitle?: string }) => (
  <div className="bg-gray-700 border border-gray-600 p-4 rounded-2xl flex flex-col justify-between h-full group hover:border-gray-500 transition-colors">
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <div className="group-hover:text-indigo-300 transition-colors">{icon}</div>
          <span className="text-[9px] font-black uppercase tracking-widest leading-none">{label}</span>
        </div>
        {status}
      </div>
      {subtitle && <p className="text-[8px] text-white font-bold leading-tight">{subtitle}</p>}
    </div>
    <div className={`text-xl font-black mt-2 truncate ${color}`}>{value}</div>
  </div>
);

export default PnLCalendar;