
import React, { useState, useMemo, useRef } from 'react';
import { Trade } from '../types';
import { 
  BookOpen, 
  PenLine, 
  RotateCcw, 
  Send, 
  Target, 
  History, 
  Lightbulb,
  MessageSquareQuote,
  Pencil,
  X,
  FileText
} from 'lucide-react';

interface Props {
  trades: Trade[];
  onAddEntry: (trade: Trade) => void;
  onUpdateEntry: (trade: Trade) => void;
}

const JournalFeed: React.FC<Props> = ({ trades, onAddEntry, onUpdateEntry }) => {
  const [plan, setPlan] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [results, setResults] = useState('');
  const [lessons, setLessons] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const composerRef = useRef<HTMLDivElement>(null);

  const resetEntry = () => {
    setPlan('');
    setAnalysis('');
    setResults('');
    setLessons('');
    setEditingId(null);
  };

  const handleEditClick = (entry: Trade) => {
    setPlan(entry.tradingPlan || '');
    setAnalysis(entry.analysis || '');
    setResults(entry.results || '');
    setLessons(entry.lessons || '');
    setEditingId(entry.id);
    
    // Scroll to composer
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const postEntry = () => {
    if (!plan && !analysis && !results && !lessons) return;

    if (editingId) {
      const originalTrade = trades.find(t => t.id === editingId);
      if (originalTrade) {
        onUpdateEntry({
          ...originalTrade,
          tradingPlan: plan,
          analysis: analysis,
          results: results,
          lessons: lessons,
        });
      }
    } else {
      const newTrade: Trade = {
        id: crypto.randomUUID(),
        symbol: 'JOURNAL',
        side: 'LONG',
        status: 'CLOSED',
        entryPrice: 0,
        exitPrice: 0,
        quantity: 0,
        pnl: 0,
        fees: 0,
        riskAmount: 0,
        entryDate: new Date().toISOString(),
        tradingPlan: plan,
        analysis: analysis,
        results: results,
        lessons: lessons,
        source: 'MANUAL'
      };
      onAddEntry(newTrade);
    }
    
    resetEntry();
  };

  // Only show trades that have at least one journal field populated
  const blogEntries = useMemo(() => {
    return trades.filter(t => t.tradingPlan || t.analysis || t.results || t.lessons);
  }, [trades]);

  return (
    <div className="max-w-4xl mx-auto space-y-12 rounded-3xl bg-stone-100 p-4 animate-in fade-in duration-700 dark:bg-neutral-950">
      {/* Blog Header */}
      <header className="text-center space-y-2">
        <h2 className="flex items-center justify-center gap-3 text-4xl font-black tracking-tight text-neutral-950 dark:text-neutral-50">
          <BookOpen className="text-neutral-700 dark:text-neutral-300" size={36} />
          Trader's Diary
        </h2>
        <p className="font-medium text-neutral-500">Record the psychology and logic behind your journey.</p>
      </header>

      {/* Minimalist Composer */}
      <section 
        ref={composerRef}
        className={`relative overflow-hidden rounded-3xl border bg-white p-8 shadow-sm transition-all duration-300 dark:bg-neutral-900 ${
          editingId ? 'border-neutral-500 ring-1 ring-neutral-400/20 dark:ring-neutral-600/20' : 'border-neutral-200 dark:border-neutral-800'
        }`}
      >
        <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-[0.03]">
          <PenLine size={120} />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${editingId ? 'bg-amber-500' : 'bg-indigo-500'} animate-pulse`}></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {editingId ? 'Editing Entry' : 'New Entry'}
              </span>
            </div>
            {editingId && (
              <button 
                onClick={resetEntry}
                className="flex items-center gap-1 text-xs text-neutral-500 transition-colors hover:text-neutral-950 dark:hover:text-neutral-100"
              >
                <X size={14} /> Cancel Editing
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                <Target size={14} className="text-neutral-500" /> Trading Plan
              </label>
              <textarea 
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                placeholder="What was the setup and entry trigger?"
                className="h-40 w-full resize-none rounded-2xl border border-neutral-200 bg-stone-50 p-4 text-sm transition-all outline-none placeholder:text-neutral-400 focus:ring-1 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase flex items-center gap-2 text-neutral-500">
                <FileText size={14} className="text-neutral-500" /> Market Analysis
              </label>
              <textarea 
                value={analysis}
                onChange={(e) => setAnalysis(e.target.value)}
                placeholder="Describe the context and price action behavior."
                className="h-40 w-full resize-none rounded-2xl border border-neutral-200 bg-stone-50 p-4 text-sm transition-all outline-none placeholder:text-neutral-400 focus:ring-1 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase flex items-center gap-2 text-neutral-500">
                <History size={14} className="text-neutral-500" /> Trade Results
              </label>
              <textarea 
                value={results}
                onChange={(e) => setResults(e.target.value)}
                placeholder="How did it play out? Slippage or execution errors?"
                className="h-40 w-full resize-none rounded-2xl border border-neutral-200 bg-stone-50 p-4 text-sm transition-all outline-none placeholder:text-neutral-400 focus:ring-1 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase flex items-center gap-2 text-neutral-500">
                <Lightbulb size={14} /> Lessons Learned
              </label>
              <textarea 
                value={lessons}
                onChange={(e) => setLessons(e.target.value)}
                placeholder="What will you do differently next time?"
                className="h-40 w-full resize-none rounded-2xl border border-neutral-200 bg-stone-50 p-4 text-sm transition-all outline-none placeholder:text-neutral-400 focus:ring-1 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4">
            <button 
              onClick={resetEntry}
              className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-neutral-500 transition-all hover:bg-stone-200 hover:text-neutral-950 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            >
              <RotateCcw size={16} />
              Reset Draft
            </button>
            <button 
              onClick={postEntry}
              className={`flex items-center gap-2 px-8 py-2.5 rounded-xl transition-all text-sm font-bold shadow-lg ${
                editingId 
                ? 'bg-amber-600 text-white shadow-sm hover:bg-amber-500' 
                : 'bg-neutral-950 text-white shadow-sm hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-white'
              }`}
            >
              {editingId ? <Pencil size={16} /> : <Send size={16} />}
              {editingId ? 'Save Changes' : 'Post Entry'}
            </button>
          </div>
        </div>
      </section>

      {/* Feed Divider */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800"></div>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Previous Entries</span>
        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800"></div>
      </div>

      {/* Blog Feed */}
      <div className="space-y-12 pb-24">
        {blogEntries.map((entry) => (
          <article key={entry.id} className="group animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex gap-6">
              {/* Date Column */}
              <div className="hidden md:flex flex-col items-center pt-2">
                <div className="font-black text-2xl text-neutral-700 dark:text-neutral-200">
                  {new Date(entry.entryDate).getDate()}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  {new Date(entry.entryDate).toLocaleString('default', { month: 'short' })}
                </div>
                <div className="mt-4 w-px flex-1 bg-neutral-200 dark:bg-neutral-800"></div>
              </div>

              {/* Content Card */}
              <div className="flex-1 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-3 text-xl font-bold text-neutral-900 dark:text-neutral-100">
                    {entry.symbol === 'JOURNAL' ? 'Journal Entry' : `Trade: ${entry.symbol}`}
                    {entry.pnl !== 0 && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${entry.pnl > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {entry.pnl > 0 ? 'Win' : 'Loss'}
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="md:hidden text-xs text-slate-500">
                      {new Date(entry.entryDate).toLocaleDateString()}
                    </div>
                      <button 
                        onClick={() => handleEditClick(entry)}
                        className={`p-2 rounded-lg transition-all ${
                          editingId === entry.id 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-stone-200 text-neutral-500 hover:text-neutral-950 group-hover:bg-stone-300 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 dark:group-hover:bg-neutral-700'
                        }`}
                        title="Edit Entry"
                      >
                      <Pencil size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  <BlogSection title="Trading Plan" content={entry.tradingPlan} />
                  <BlogSection title="Market Analysis" content={entry.analysis} />
                  <BlogSection title="Results" content={entry.results} />
                  <BlogSection title="Lessons" content={entry.lessons} isHighlight />
                </div>
              </div>
            </div>
          </article>
        ))}

        {blogEntries.length === 0 && (
          <div className="text-center py-24 bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
            <MessageSquareQuote className="mx-auto text-slate-800 mb-4" size={48} />
            <p className="text-slate-600 italic">"The empty page is where growth begins."</p>
            <p className="text-slate-700 text-sm mt-1">Start writing your first entry above.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const BlogSection: React.FC<{ title: string; content: string; isHighlight?: boolean }> = ({ title, content, isHighlight }) => {
  if (!content) return null;
  return (
    <div className="space-y-2">
      <h4 className={`text-[10px] font-bold uppercase tracking-widest ${isHighlight ? 'text-emerald-500' : 'text-indigo-400 opacity-80'}`}>
        {title}
      </h4>
      <p className="text-slate-300 leading-relaxed text-sm font-medium opacity-90 whitespace-pre-wrap">
        {content}
      </p>
    </div>
  );
};

export default JournalFeed;
