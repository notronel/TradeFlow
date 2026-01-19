
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Trade } from '../types';
import { formatCurrencyPlain } from '../utils/calculations';
import { 
  BookOpen, 
  RotateCcw, 
  Send, 
  History, 
  MessageSquareQuote,
  Pencil,
  X,
  Bold,
  Italic,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Type,
  Underline
} from 'lucide-react';

interface Props {
  trades: Trade[];
  onAddEntry: (trade: Trade) => void;
  onUpdateEntry: (trade: Trade) => void;
}

const JournalFeed: React.FC<Props> = ({ trades, onAddEntry, onUpdateEntry }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);

  // Helper to generate a consistent "YYYY-MM-DD" key based on LOCAL time
  const getLocalDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Group trades by day for the feed
  const dailyGroups = useMemo(() => {
    const groups: Record<string, { pnl: number, count: number, journalEntry?: Trade, trades: Trade[] }> = {};
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
    );

    sortedTrades.forEach(t => {
      // Use local date key to avoid grouping night trades into next day UTC
      const date = getLocalDateKey(new Date(t.entryDate));
      if (!groups[date]) groups[date] = { pnl: 0, count: 0, trades: [] };
      
      if (t.symbol === 'JOURNAL') {
        groups[date].journalEntry = t;
      } else {
        groups[date].pnl += (t.pnl - (t.fees || 0));
        groups[date].count += 1;
        groups[date].trades.push(t);
      }
    });

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [trades]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handlePost = () => {
    const content = editorRef.current?.innerHTML || '';
    if (!content.trim() || content === '<br>') return;

    if (editingId) {
      const original = trades.find(t => t.id === editingId);
      if (original) {
        onUpdateEntry({ ...original, tradingPlan: content });
      }
    } else {
      // Create new entry for "Today" (Local)
      const today = new Date();
      // Use Local Noon to ensure consistency across the app
      const entryDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0).toISOString();
      
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
    if (editorRef.current) editorRef.current.innerHTML = '';
    setEditingId(null);
  };

  const handleEdit = (entry: Trade) => {
    if (editorRef.current) editorRef.current.innerHTML = entry.tradingPlan || '';
    setEditingId(entry.id);
    composerRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
      <header className="text-center space-y-2">
        <h2 className="text-4xl font-black tracking-tight text-white flex items-center justify-center gap-3">
          <BookOpen className="text-indigo-400" size={36} />
          Trader's Diary
        </h2>
        <p className="text-white font-medium text-lg">Daily Performance & Rich Narrative</p>
      </header>

      {/* Rich Text Daily Entry Composer */}
      <section 
        ref={composerRef}
        className={`bg-gray-700 border transition-all duration-300 rounded-3xl p-4 shadow-xl relative ${
          editingId ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-gray-600'
        }`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${editingId ? 'bg-amber-500' : 'bg-indigo-500'} animate-pulse`}></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white">
                {editingId ? 'Editing Record' : 'Today\'s Narrative'}
              </span>
            </div>
            {editingId && (
              <button onClick={() => { if(editorRef.current) editorRef.current.innerHTML = ''; setEditingId(null); }} className="text-xs text-white hover:text-white flex items-center gap-1">
                <X size={14} /> Cancel
              </button>
            )}
          </div>

          {/* Document Formatting Toolbar */}
          <div className="flex flex-wrap gap-1 bg-gray-800 p-2 rounded-2xl border border-gray-600">
            <ToolbarBtn onClick={() => execCommand('bold')} icon={<Bold size={16} />} title="Bold" />
            <ToolbarBtn onClick={() => execCommand('italic')} icon={<Italic size={16} />} title="Italic" />
            <ToolbarBtn onClick={() => execCommand('underline')} icon={<Underline size={16} />} title="Underline" />
            <div className="w-px h-6 bg-gray-600 mx-1 self-center" />
            <ToolbarBtn onClick={() => execCommand('formatBlock', 'H1')} icon={<Heading1 size={16} />} title="Heading 1" />
            <ToolbarBtn onClick={() => execCommand('formatBlock', 'H2')} icon={<Heading2 size={16} />} title="Heading 2" />
            <ToolbarBtn onClick={() => execCommand('formatBlock', 'P')} icon={<Type size={16} />} title="Text" />
            <div className="w-px h-6 bg-gray-600 mx-1 self-center" />
            <ToolbarBtn onClick={() => execCommand('insertUnorderedList')} icon={<List size={16} />} title="Bullets" />
            <ToolbarBtn onClick={() => execCommand('insertOrderedList')} icon={<ListOrdered size={16} />} title="Numbers" />
            <div className="w-px h-6 bg-gray-600 mx-1 self-center" />
            <ToolbarBtn onClick={() => execCommand('justifyLeft')} icon={<AlignLeft size={16} />} title="Align Left" />
            <ToolbarBtn onClick={() => execCommand('justifyCenter')} icon={<AlignCenter size={16} />} title="Align Center" />
            <ToolbarBtn onClick={() => execCommand('justifyRight')} icon={<AlignRight size={16} />} title="Align Right" />
          </div>

          <div 
            ref={editorRef}
            contentEditable
            className="w-full bg-gray-800 min-h-[300px] rounded-2xl p-6 text-base leading-relaxed focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-white border border-gray-600 focus:border-indigo-500 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 editor-content"
            data-placeholder="Start writing your daily report... describe setups, emotions, and lessons."
          />

          <div className="flex items-center justify-between px-2">
            <p className="text-[10px] text-white font-bold uppercase tracking-wider">
              Document Mode Active
            </p>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => { if(editorRef.current) editorRef.current.innerHTML = ''; }}
                className="p-2.5 rounded-xl text-white hover:bg-gray-600 transition-all"
              >
                <RotateCcw size={18} />
              </button>
              <button 
                onClick={handlePost}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${
                  editingId ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                <Send size={18} />
                {editingId ? 'Update Record' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feed List */}
      <div className="space-y-12 pb-24">
        {dailyGroups.map(([date, data]) => (
          <article key={date} className="relative group">
            <div className="bg-gray-700 border border-gray-600 rounded-3xl overflow-hidden shadow-xl">
              <div className="flex flex-col md:flex-row items-stretch md:items-center border-b border-gray-600">
                <div className="bg-gray-800 p-6 flex flex-col items-center justify-center min-w-[140px] border-r border-gray-600">
                  {/* Manually extract Day to avoid UTC shift */}
                  <span className="text-2xl font-black text-white">{date.split('-')[2]}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                    {/* Construct date object from YYYY-MM-DD + T12:00:00 to get correct local month */}
                    {new Date(date + 'T12:00:00').toLocaleString('default', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
                
                <div className="flex-1 p-6 grid grid-cols-2 md:grid-cols-3 gap-6">
                  <Stat label="Total PnL" value={formatCurrencyPlain(data.pnl)} color={data.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'} />
                  <Stat label="Trades" value={data.count.toString()} color="text-white" />
                  <div className="flex justify-end items-center col-span-2 md:col-span-1">
                    {data.journalEntry && (
                      <button 
                        onClick={() => handleEdit(data.journalEntry!)}
                        className="p-2 bg-gray-800 hover:bg-gray-600 rounded-xl text-white hover:text-white transition-all border border-gray-600"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8">
                {data.journalEntry ? (
                  <div 
                    className="editor-content prose prose-invert prose-gray max-w-none text-white"
                    dangerouslySetInnerHTML={{ __html: data.journalEntry.tradingPlan }}
                  />
                ) : (
                  <div className="py-4 flex items-center gap-3 text-white italic text-sm">
                    <History size={14} />
                    No narrative recorded.
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}

        {dailyGroups.length === 0 && (
          <div className="text-center py-24 bg-gray-700 rounded-3xl border border-dashed border-gray-600">
            <MessageSquareQuote className="mx-auto text-white mb-4" size={48} />
            <p className="text-white italic">"No journal records found."</p>
          </div>
        )}
      </div>

      <style>{`
        .editor-content h1 { font-size: 2rem; font-weight: 800; margin-bottom: 1rem; color: #a5b4fc; }
        .editor-content h2 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.75rem; color: #818cf8; }
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
    className="p-2 rounded-lg hover:bg-gray-600 text-white hover:text-indigo-300 transition-all"
  >
    {icon}
  </button>
);

const Stat = ({ label, value, color }: { label: string, value: string, color: string }) => (
  <div className="space-y-0.5">
    <p className="text-[10px] font-black uppercase tracking-widest text-white">{label}</p>
    <p className={`text-xl font-black ${color}`}>{value}</p>
  </div>
);

export default JournalFeed;