
import React, { useState, useEffect, useMemo } from 'react';
import { DailyReview, EvaluationConfig, Trade } from './types';
import { calculateMetrics } from './utils/calculations';
import Dashboard from './components/Dashboard';
import Performance from './components/Performance';
import TradeForm from './components/TradeForm';
import TradeList from './components/TradeList';
import AiInsights from './components/AiInsights';
import Integrations from './components/Integrations';
import JournalFeed from './components/JournalFeed';
import { 
  LayoutDashboard, 
  ListPlus, 
  History, 
  BrainCircuit, 
  Share2, 
  BarChart3,
  BookOpen,
  Trash2,
  Wallet,
  PanelLeftClose,
  PanelLeftOpen
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

  const [evaluationConfig, setEvaluationConfig] = useState<EvaluationConfig>(() => {
    const saved = localStorage.getItem('tradeflow_evaluation_config');
    if (saved) {
      return JSON.parse(saved);
    }

    const savedBalance = localStorage.getItem('tradeflow_balance');
    return {
      targetProfit: 3000,
      maxLoss: 2000,
      startingBalance: savedBalance ? parseFloat(savedBalance) : 0,
    };
  });

  const [dayReviews, setDayReviews] = useState<Record<string, DailyReview>>(() => {
    const saved = localStorage.getItem('tradeflow_day_reviews');
    return saved ? JSON.parse(saved) : {};
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'performance' | 'add' | 'history' | 'ai' | 'integrations' | 'journal'>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('tradeflow_sidebar_collapsed');
    return saved ? saved === 'true' : false;
  });

  useEffect(() => {
    localStorage.setItem('tradeflow_trades', JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem('tradeflow_balance', startingBalance.toString());
  }, [startingBalance]);

  useEffect(() => {
    localStorage.setItem('tradeflow_evaluation_config', JSON.stringify(evaluationConfig));
  }, [evaluationConfig]);

  useEffect(() => {
    localStorage.setItem('tradeflow_day_reviews', JSON.stringify(dayReviews));
  }, [dayReviews]);

  useEffect(() => {
    localStorage.setItem('tradeflow_sidebar_collapsed', sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

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

  const updateDayReview = (dateKey: string, review: DailyReview) => {
    setDayReviews(prev => ({
      ...prev,
      [dateKey]: review,
    }));
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
    <div className="min-h-screen flex flex-col md:flex-row bg-stone-100 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-100">
      {/* Navigation Sidebar */}
      <nav className={`w-full bg-white border-b md:border-b-0 md:border-r border-neutral-200 flex flex-col transition-all duration-300 dark:bg-neutral-900 dark:border-neutral-800 ${sidebarCollapsed ? 'md:w-20' : 'md:w-64'}`}>
        <div className={`p-6 ${sidebarCollapsed ? 'md:px-4' : ''}`}>
          <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-neutral-950 transition-all dark:text-neutral-50">
            <span className={sidebarCollapsed ? 'md:hidden' : ''}>TradeFlow Pro</span>
            <span className={`hidden ${sidebarCollapsed ? 'md:inline' : ''}`}>TF</span>
          </h1>
            <button
              onClick={() => setSidebarCollapsed(prev => !prev)}
              className="hidden md:flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-stone-50 text-neutral-500 transition-colors hover:border-neutral-300 hover:text-neutral-950 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-500 dark:hover:border-neutral-700 dark:hover:text-neutral-100"
              title={sidebarCollapsed ? 'Expand menu' : 'Collapse menu'}
              aria-label={sidebarCollapsed ? 'Expand menu' : 'Collapse menu'}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </div>
          <p className={`text-xs text-neutral-500 mt-1 uppercase tracking-widest font-semibold transition-opacity dark:text-neutral-500 ${sidebarCollapsed ? 'md:hidden' : ''}`}>Institutional Grade Journal</p>
        </div>

        <div className={`flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar ${sidebarCollapsed ? 'md:px-3' : ''}`}>
          <p className={`px-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 dark:text-neutral-600 ${sidebarCollapsed ? 'md:hidden' : ''}`}>Analysis</p>
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard size={18} />} 
            label="Overview" 
            collapsed={sidebarCollapsed}
          />
          <NavButton 
            active={activeTab === 'performance'} 
            onClick={() => setActiveTab('performance')} 
            icon={<BarChart3 size={18} />} 
            label="Performance" 
            collapsed={sidebarCollapsed}
          />
          <NavButton 
            active={activeTab === 'journal'} 
            onClick={() => setActiveTab('journal')} 
            icon={<BookOpen size={18} />} 
            label="Trade Journal" 
            collapsed={sidebarCollapsed}
          />
          
          <p className={`px-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-6 mb-2 dark:text-neutral-600 ${sidebarCollapsed ? 'md:hidden' : ''}`}>Operations</p>
          <NavButton 
            active={activeTab === 'add'} 
            onClick={() => setActiveTab('add')} 
            icon={<ListPlus size={18} />} 
            label="Log Trade Data" 
            collapsed={sidebarCollapsed}
          />
          <NavButton 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
            icon={<History size={18} />} 
            label="Trade History" 
            collapsed={sidebarCollapsed}
          />
          
          <p className={`px-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-6 mb-2 dark:text-neutral-600 ${sidebarCollapsed ? 'md:hidden' : ''}`}>Advanced</p>
          <NavButton 
            active={activeTab === 'ai'} 
            onClick={() => setActiveTab('ai')} 
            icon={<BrainCircuit size={18} />} 
            label="AI Insights" 
            collapsed={sidebarCollapsed}
          />
          <NavButton 
            active={activeTab === 'integrations'} 
            onClick={() => setActiveTab('integrations')} 
            icon={<Share2 size={18} />} 
            label="Integrations" 
            collapsed={sidebarCollapsed}
          />
        </div>

        <div className={`p-4 border-t border-neutral-200 space-y-4 dark:border-neutral-800 ${sidebarCollapsed ? 'md:px-3' : ''}`}>
          <div className={`space-y-2 ${sidebarCollapsed ? 'md:hidden' : ''}`}>
            <p className="px-1 text-[10px] font-bold text-neutral-400 uppercase tracking-widest dark:text-neutral-600">Account Config</p>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors dark:text-neutral-500 dark:group-focus-within:text-neutral-100">
                <Wallet size={14} />
              </div>
              <input 
                type="number"
                placeholder="Initial Capital"
                className="w-full bg-stone-50 border border-neutral-200 rounded-lg pl-9 pr-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-neutral-400 transition-all dark:bg-neutral-950 dark:border-neutral-800 dark:focus:ring-neutral-600"
                value={startingBalance === 0 ? '' : startingBalance}
                onChange={(e) => setStartingBalance(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={`bg-stone-50 rounded-lg p-3 border border-neutral-200 space-y-1 dark:bg-neutral-950 dark:border-neutral-800 ${sidebarCollapsed ? 'md:flex md:h-11 md:items-center md:justify-center md:p-0' : ''}`} title={`Net Account Value: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(metrics.currentBalance)}`}>
            <Wallet size={16} className={`hidden text-neutral-500 ${sidebarCollapsed ? 'md:block' : ''}`} />
            <div className={sidebarCollapsed ? 'md:hidden' : ''}>
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Net Account Value</p>
            <p className={`text-lg font-black ${metrics.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(metrics.currentBalance)}
            </p>
            <div className="flex justify-between items-center text-[9px] font-bold text-neutral-500 uppercase tracking-tight pt-1 border-t border-neutral-200 dark:border-neutral-800">
              <span>Total PnL</span>
              <span className={metrics.totalPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                {metrics.totalPnL >= 0 ? '+' : ''}{metrics.totalPnL.toFixed(2)}
              </span>
            </div>
            </div>
          </div>
          
          {trades.length > 0 && (
            <button 
              onClick={clearAllTrades}
              className={`w-full flex items-center justify-center py-2 text-[10px] font-bold uppercase tracking-widest text-rose-600/70 hover:text-rose-600 transition-colors dark:text-rose-500/70 dark:hover:text-rose-400 ${sidebarCollapsed ? 'md:h-10 md:rounded-lg md:border md:border-neutral-200 md:bg-stone-50 dark:md:border-neutral-800 dark:md:bg-neutral-950' : 'space-x-2'}`}
              title="Clear All Data"
            >
              <Trash2 size={12} />
              <span className={sidebarCollapsed ? 'md:hidden' : ''}>Clear All Data</span>
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar h-screen bg-stone-100 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {activeTab === 'dashboard' && (
            <Dashboard
              metrics={metrics}
              trades={trades}
              evaluationConfig={evaluationConfig}
              onEvaluationConfigChange={setEvaluationConfig}
              dayReviews={dayReviews}
              onDayReviewChange={updateDayReview}
            />
          )}
          {activeTab === 'performance' && <Performance trades={trades} />}
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
  collapsed?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label, collapsed = false }) => (
  <button
    onClick={onClick}
    title={label}
    className={`w-full flex items-center rounded-lg transition-all duration-200 ${
      collapsed ? 'md:justify-center md:px-0 md:py-3 space-x-3 md:space-x-0 px-4 py-2.5' : 'space-x-3 px-4 py-2.5'
    } ${
      active 
        ? 'bg-neutral-950 text-white border border-neutral-950 shadow-sm dark:bg-neutral-100 dark:text-neutral-950 dark:border-neutral-100' 
        : 'text-neutral-500 hover:bg-stone-100 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
    }`}
  >
    {icon}
    <span className={`font-semibold text-sm ${collapsed ? 'md:hidden' : ''}`}>{label}</span>
  </button>
);

export default App;
