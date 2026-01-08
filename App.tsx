
import React, { useState, useEffect, useMemo } from 'react';
import { Trade, TradingMetrics } from './types';
import { calculateMetrics } from './utils/calculations';
import Dashboard from './components/Dashboard';
import TradeForm from './components/TradeForm';
import TradeList from './components/TradeList';
import AiInsights from './components/AiInsights';
import Integrations from './components/Integrations';
import PnLCalendar from './components/PnLCalendar';
import JournalFeed from './components/JournalFeed';
import { 
  LayoutDashboard, 
  ListPlus, 
  History, 
  BrainCircuit, 
  Share2, 
  Calendar as CalendarIcon,
  BookOpen,
  Trash2,
  Wallet
} from 'lucide-react';

const App: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>(() => {
    const saved = localStorage.getItem('tradeflow_trades');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [startingBalance, setStartingBalance] = useState<number>(() => {
    const saved = localStorage.getItem('tradeflow_balance');
    return saved ? parseFloat(saved) : 0;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'add' | 'history' | 'ai' | 'integrations' | 'calendar' | 'journal'>('dashboard');

  useEffect(() => {
    localStorage.setItem('tradeflow_trades', JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem('tradeflow_balance', startingBalance.toString());
  }, [startingBalance]);

  const metrics = useMemo(() => calculateMetrics(trades, startingBalance), [trades, startingBalance]);

  const addTrade = (trade: Trade) => {
    setTrades([trade, ...trades]);
    if (activeTab === 'add') {
      setActiveTab('dashboard');
    }
  };

  const updateTrade = (updatedTrade: Trade) => {
    setTrades(prev => prev.map(t => t.id === updatedTrade.id ? updatedTrade : t));
  };

  const syncTrades = (newTrades: Trade[]) => {
    const existingIds = new Set(trades.map(t => t.externalId).filter(Boolean));
    const uniqueNewTrades = newTrades.filter(t => !existingIds.has(t.externalId));
    
    if (uniqueNewTrades.length > 0) {
      setTrades(prev => [...uniqueNewTrades, ...prev]);
      return uniqueNewTrades.length;
    }
    return 0;
  };

  const deleteTrade = (id: string) => {
    setTrades(trades.filter(t => t.id !== id));
  };

  const clearAllTrades = () => {
    if (window.confirm("Are you sure you want to clear all trade history? This cannot be undone.")) {
      setTrades([]);
      setActiveTab('dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100">
      {/* Navigation Sidebar */}
      <nav className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            TradeFlow Pro
          </h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold">Institutional Grade Journal</p>
        </div>

        <div className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Analysis</p>
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard size={18} />} 
            label="Overview" 
          />
          <NavButton 
            active={activeTab === 'calendar'} 
            onClick={() => setActiveTab('calendar')} 
            icon={<CalendarIcon size={18} />} 
            label="Calendar" 
          />
          <NavButton 
            active={activeTab === 'journal'} 
            onClick={() => setActiveTab('journal')} 
            icon={<BookOpen size={18} />} 
            label="Trade Journal" 
          />
          
          <p className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-6 mb-2">Operations</p>
          <NavButton 
            active={activeTab === 'add'} 
            onClick={() => setActiveTab('add')} 
            icon={<ListPlus size={18} />} 
            label="Log Trade Data" 
          />
          <NavButton 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
            icon={<History size={18} />} 
            label="Trade History" 
          />
          
          <p className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-6 mb-2">Advanced</p>
          <NavButton 
            active={activeTab === 'ai'} 
            onClick={() => setActiveTab('ai')} 
            icon={<BrainCircuit size={18} />} 
            label="AI Insights" 
          />
          <NavButton 
            active={activeTab === 'integrations'} 
            onClick={() => setActiveTab('integrations')} 
            icon={<Share2 size={18} />} 
            label="Integrations" 
          />
        </div>

        <div className="p-4 border-t border-slate-800 space-y-4">
          <div className="space-y-2">
            <p className="px-1 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Account Config</p>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                <Wallet size={14} />
              </div>
              <input 
                type="number"
                placeholder="Initial Capital"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                value={startingBalance === 0 ? '' : startingBalance}
                onChange={(e) => setStartingBalance(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Net Account Value</p>
            <p className={`text-lg font-black ${metrics.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(metrics.currentBalance)}
            </p>
            <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-tight pt-1 border-t border-slate-700/50">
              <span>Total PnL</span>
              <span className={metrics.totalPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                {metrics.totalPnL >= 0 ? '+' : ''}{metrics.totalPnL.toFixed(2)}
              </span>
            </div>
          </div>
          
          {trades.length > 0 && (
            <button 
              onClick={clearAllTrades}
              className="w-full flex items-center justify-center space-x-2 py-2 text-[10px] font-bold uppercase tracking-widest text-rose-500/60 hover:text-rose-400 transition-colors"
            >
              <Trash2 size={12} />
              <span>Clear All Data</span>
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar h-screen bg-[#020617]">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {activeTab === 'dashboard' && <Dashboard metrics={metrics} trades={trades} />}
          {activeTab === 'calendar' && <PnLCalendar trades={trades} />}
          {activeTab === 'journal' && <JournalFeed trades={trades} onAddEntry={addTrade} onUpdateEntry={updateTrade} />}
          {activeTab === 'add' && <TradeForm onSave={addTrade} onBulkImport={syncTrades} />}
          {activeTab === 'history' && <TradeList trades={trades} onDelete={deleteTrade} />}
          {activeTab === 'ai' && <AiInsights trades={trades} />}
          {activeTab === 'integrations' && <Integrations onSync={syncTrades} />}
        </div>
      </main>
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 shadow-lg shadow-indigo-600/5' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
    }`}
  >
    {icon}
    <span className="font-semibold text-sm">{label}</span>
  </button>
);

export default App;
