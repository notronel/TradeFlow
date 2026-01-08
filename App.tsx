
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
  Wallet,
  Lock
} from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('tf_auth') === 'true';
  });
  const [passcodeInput, setPasscodeInput] = useState('');
  
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const masterPass = process.env.APP_PASSCODE || "zxcvbnm12W+#!"; 
    if (passcodeInput === masterPass) {
      setIsAuthenticated(true);
      localStorage.setItem('tf_auth', 'true');
    } else {
      alert("Invalid credentials. Please try again.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('tf_auth');
  };

  const addTrade = (trade: Trade) => {
    setTrades(prev => [trade, ...prev]);
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
    setTrades(prev => prev.filter(t => t.id !== id));
  };

  const clearAllTrades = () => {
    if (window.confirm("Are you sure you want to clear all trade history, settings, and integrations? This action cannot be undone.")) {
      // 1. Reset component state
      setTrades([]);
      setStartingBalance(0);
      
      // 2. Clear all app-specific keys from localStorage
      localStorage.removeItem('tradeflow_trades');
      localStorage.removeItem('tradeflow_balance');
      localStorage.removeItem('tradovate_config');
      
      // 3. Reset view
      setActiveTab('dashboard');
      
      // 4. Force state update for effects to catch up if needed
      setTimeout(() => {
         setTrades([]);
         setStartingBalance(0);
      }, 0);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mx-auto">
            <Lock size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Access Restricted</h1>
            <p className="text-slate-500 text-sm">This journal is private. Enter your security key.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password"
              placeholder="Security Passcode"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-center tracking-widest"
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              autoFocus
            />
            <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
              Unlock Terminal
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100">
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
          
          <div className="space-y-2">
            {(trades.length > 0 || startingBalance !== 0) && (
              <button 
                type="button"
                onClick={clearAllTrades}
                className="w-full flex items-center justify-center space-x-2 py-2 text-[10px] font-bold uppercase tracking-widest text-rose-500/60 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Clear All Data</span>
              </button>
            )}
            <button 
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <Lock size={12} />
              <span>Lock App</span>
            </button>
          </div>
        </div>
      </nav>

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
