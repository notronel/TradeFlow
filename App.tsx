import React, { useState, useEffect, useMemo } from 'react';
import { Trade, TradingMetrics, Account } from './types';
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
  Lock,
  ChevronDown,
  PlusCircle,
  Briefcase
} from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('tf_auth') === 'true';
  });
  const [passcodeInput, setPasscodeInput] = useState('');

  // --- Account Management State ---
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('tradeflow_accounts');
    if (saved) return JSON.parse(saved);
    
    // Legacy migration: If no accounts exist, check for legacy balance
    const legacyBalance = localStorage.getItem('tradeflow_balance');
    return [{
      id: 'default_account',
      name: 'Main Portfolio',
      startingBalance: legacyBalance ? parseFloat(legacyBalance) : 0
    }];
  });

  const [activeAccountId, setActiveAccountId] = useState<string>('ALL'); // 'ALL' or specific account ID

  const [trades, setTrades] = useState<Trade[]>(() => {
    const saved = localStorage.getItem('tradeflow_trades');
    let parsedTrades: Trade[] = saved ? JSON.parse(saved) : [];
    
    // Legacy migration: Ensure all trades have an accountId
    const hasLegacy = parsedTrades.some(t => !t.accountId);
    if (hasLegacy) {
      parsedTrades = parsedTrades.map(t => ({
        ...t,
        accountId: t.accountId || 'default_account'
      }));
    }
    return parsedTrades;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'add' | 'history' | 'ai' | 'integrations' | 'calendar' | 'journal'>('dashboard');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('');

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('tradeflow_trades', JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem('tradeflow_accounts', JSON.stringify(accounts));
  }, [accounts]);

  // --- Computed Data ---
  const activeAccount = useMemo(() => 
    activeAccountId === 'ALL' ? null : accounts.find(a => a.id === activeAccountId)
  , [activeAccountId, accounts]);

  const displayedTrades = useMemo(() => {
    if (activeAccountId === 'ALL') return trades;
    return trades.filter(t => t.accountId === activeAccountId);
  }, [trades, activeAccountId]);

  const activeStartingBalance = useMemo(() => {
    if (activeAccountId === 'ALL') {
      return accounts.reduce((acc, curr) => acc + curr.startingBalance, 0);
    }
    return activeAccount?.startingBalance || 0;
  }, [accounts, activeAccountId, activeAccount]);

  const metrics = useMemo(() => 
    calculateMetrics(displayedTrades, activeStartingBalance)
  , [displayedTrades, activeStartingBalance]);

  // --- Handlers ---
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

  const createAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName) return;
    
    const newAccount: Account = {
      id: crypto.randomUUID(),
      name: newAccountName,
      startingBalance: Number(newAccountBalance) || 0
    };
    
    setAccounts([...accounts, newAccount]);
    setActiveAccountId(newAccount.id);
    setNewAccountName('');
    setNewAccountBalance('');
    setShowAccountModal(false);
  };

  const updateAccountBalance = (newBalance: number) => {
    if (activeAccountId === 'ALL') return; // Can't update aggregate directly
    setAccounts(prev => prev.map(a => a.id === activeAccountId ? { ...a, startingBalance: newBalance } : a));
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
    
    // Assign imported trades to current account if specific one selected, else default
    const targetAccountId = activeAccountId === 'ALL' ? accounts[0].id : activeAccountId;
    const assignedTrades = uniqueNewTrades.map(t => ({ ...t, accountId: targetAccountId }));

    if (assignedTrades.length > 0) {
      setTrades(prev => [...assignedTrades, ...prev]);
      return assignedTrades.length;
    }
    return 0;
  };

  const deleteTrade = (id: string) => {
    setTrades(prev => prev.filter(t => t.id !== id));
  };

  const clearAllTrades = () => {
    if (window.confirm("Are you sure you want to clear ALL data? This includes all accounts and trades.")) {
      setTrades([]);
      setAccounts([{ id: 'default', name: 'Main Portfolio', startingBalance: 0 }]);
      setActiveAccountId('default');
      localStorage.removeItem('tradeflow_trades');
      localStorage.removeItem('tradeflow_accounts');
      localStorage.removeItem('tradeflow_balance'); // cleanup legacy
      setActiveTab('dashboard');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-600 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-700 border border-gray-500 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center text-indigo-400 mx-auto border border-gray-600">
            <Lock size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Access Restricted</h1>
            <p className="text-white text-sm">This journal is private. Enter your security key.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password"
              placeholder="Security Passcode"
              className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-center tracking-widest text-white placeholder-gray-400"
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
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-600 text-gray-100 font-sans">
      <nav className="w-full md:w-64 bg-gray-700 border-b md:border-b-0 md:border-r border-gray-500 flex flex-col shadow-2xl z-20">
        
        {/* Account Switcher Header */}
        <div className="p-4 border-b border-gray-600 bg-gray-800/50">
          <div className="flex items-center gap-2 mb-3">
             <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
               TF
             </div>
             <span className="font-bold text-lg text-white tracking-tight">TradeFlow Pro</span>
          </div>

          <div className="relative group">
            <button className="w-full bg-gray-700 hover:bg-gray-600 border border-gray-500 rounded-xl p-3 flex items-center justify-between transition-all">
              <div className="flex items-center gap-3 overflow-hidden">
                <Briefcase size={16} className="text-indigo-300 shrink-0" />
                <div className="flex flex-col items-start truncate">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Current View</span>
                  <span className="text-sm font-bold text-white truncate w-32 text-left">
                    {activeAccountId === 'ALL' ? 'All Portfolios' : activeAccount?.name}
                  </span>
                </div>
              </div>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            
            {/* Dropdown Menu (Visible on Hover/Focus) */}
            <div className="absolute top-full left-0 w-full pt-2 hidden group-hover:block z-50">
              <div className="bg-gray-700 border border-gray-500 rounded-xl shadow-2xl p-2">
                <button 
                  onClick={() => setActiveAccountId('ALL')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${activeAccountId === 'ALL' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                >
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                  All Portfolios
                </button>
                <div className="my-2 border-t border-gray-600"></div>
                {accounts.map(acc => (
                  <button 
                    key={acc.id}
                    onClick={() => setActiveAccountId(acc.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 mb-1 ${activeAccountId === acc.id ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${activeAccountId === acc.id ? 'bg-emerald-400' : 'bg-gray-500'}`}></div>
                    {acc.name}
                  </button>
                ))}
                <button 
                  onClick={() => setShowAccountModal(true)}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-indigo-300 hover:text-white hover:bg-indigo-900/50 flex items-center gap-2 mt-2"
                >
                  <PlusCircle size={12} />
                  Add Account
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar py-4">
          <p className="px-4 text-[10px] font-bold text-white uppercase tracking-widest mb-2 opacity-50">Analytics</p>
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
            label="Journal" 
          />
          
          <p className="px-4 text-[10px] font-bold text-white uppercase tracking-widest mt-6 mb-2 opacity-50">Execution</p>
          <NavButton 
            active={activeTab === 'add'} 
            onClick={() => setActiveTab('add')} 
            icon={<ListPlus size={18} />} 
            label="Log Trade" 
          />
          <NavButton 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
            icon={<History size={18} />} 
            label="History" 
          />
          
          <p className="px-4 text-[10px] font-bold text-white uppercase tracking-widest mt-6 mb-2 opacity-50">Intelligence</p>
          <NavButton 
            active={activeTab === 'ai'} 
            onClick={() => setActiveTab('ai')} 
            icon={<BrainCircuit size={18} />} 
            label="AI Coach" 
          />
          <NavButton 
            active={activeTab === 'integrations'} 
            onClick={() => setActiveTab('integrations')} 
            icon={<Share2 size={18} />} 
            label="Sync" 
          />
        </div>

        <div className="p-4 border-t border-gray-600 bg-gray-800/30 space-y-4">
          <div className="space-y-2">
            <p className="px-1 text-[10px] font-bold text-white uppercase tracking-widest flex justify-between">
              <span>Initial Balance</span>
              <span className="text-indigo-300">{activeAccountId === 'ALL' ? '(Total)' : ''}</span>
            </p>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white group-focus-within:text-indigo-300 transition-colors">
                <Wallet size={14} />
              </div>
              <input 
                type="number"
                placeholder="Initial Capital"
                disabled={activeAccountId === 'ALL'}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-9 pr-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-gray-500 transition-all focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                value={activeStartingBalance === 0 ? '' : activeStartingBalance}
                onChange={(e) => updateAccountBalance(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3 border border-gray-600 space-y-1">
            <p className="text-[10px] font-bold text-white uppercase tracking-wider">Equity</p>
            <p className={`text-lg font-black ${metrics.totalPnL >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(metrics.currentBalance)}
            </p>
            <div className="flex justify-between items-center text-[9px] font-bold text-white uppercase tracking-tight pt-1 border-t border-gray-600">
              <span>Total PnL</span>
              <span className={metrics.totalPnL >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                {metrics.totalPnL >= 0 ? '+' : ''}{metrics.totalPnL.toFixed(2)}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button 
              type="button"
              onClick={clearAllTrades}
              className="flex items-center justify-center space-x-1 py-2 text-[9px] font-bold uppercase tracking-widest text-rose-400 hover:text-white hover:bg-rose-900/50 transition-colors rounded-lg border border-rose-900/30"
            >
              <Trash2 size={12} />
              <span>Reset</span>
            </button>
            <button 
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center space-x-1 py-2 text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-white hover:bg-gray-600 transition-colors rounded-lg border border-gray-600"
            >
              <Lock size={12} />
              <span>Lock</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto custom-scrollbar h-screen bg-gray-600 relative">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {activeTab === 'dashboard' && <Dashboard metrics={metrics} trades={displayedTrades} />}
          {activeTab === 'calendar' && <PnLCalendar trades={displayedTrades} onAddEntry={addTrade} onUpdateEntry={updateTrade} />}
          {activeTab === 'journal' && <JournalFeed trades={displayedTrades} onAddEntry={addTrade} onUpdateEntry={updateTrade} />}
          {activeTab === 'add' && <TradeForm accounts={accounts} activeAccountId={activeAccountId} onSave={addTrade} onBulkImport={syncTrades} />}
          {activeTab === 'history' && <TradeList trades={displayedTrades} onDelete={deleteTrade} />}
          {activeTab === 'ai' && <AiInsights trades={displayedTrades} />}
          {activeTab === 'integrations' && <Integrations onSync={syncTrades} />}
        </div>

        {/* Create Account Modal */}
        {showAccountModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-gray-700 border border-gray-500 rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                  <Briefcase className="text-indigo-400" size={24} />
                </div>
                <h3 className="text-xl font-bold text-white">New Portfolio</h3>
                <p className="text-sm text-gray-300">Track a new PA or Personal account.</p>
              </div>
              <form onSubmit={createAccount} className="space-y-4">
                <div>
                   <label className="block text-[10px] font-bold text-white uppercase tracking-widest mb-1">Account Name</label>
                   <input 
                    type="text" 
                    placeholder="e.g. Apex 50k #1" 
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-500"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    autoFocus
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-white uppercase tracking-widest mb-1">Starting Balance</label>
                   <input 
                    type="number" 
                    placeholder="e.g. 50000" 
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-500"
                    value={newAccountBalance}
                    onChange={(e) => setNewAccountBalance(e.target.value)}
                   />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAccountModal(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-300 hover:bg-gray-600 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all">Create</button>
                </div>
              </form>
            </div>
          </div>
        )}
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
        ? 'bg-gray-600 text-indigo-300 border border-indigo-500/30 shadow-sm' 
        : 'text-white hover:bg-gray-600 hover:text-white'
    }`}
  >
    {icon}
    <span className="font-semibold text-sm">{label}</span>
  </button>
);

export default App;