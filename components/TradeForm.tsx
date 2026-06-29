
import React, { useState } from 'react';
import { Trade, TradeSide, TradeStatus } from '../types';
import { Save, X, Info, FileSpreadsheet, Keyboard } from 'lucide-react';
import CsvImport from './CsvImport';

interface Props {
  onSave: (trade: Trade) => void;
  onBulkImport: (trades: Trade[]) => number;
}

const TradeForm: React.FC<Props> = ({ onSave, onBulkImport }) => {
  const [activeMode, setActiveMode] = useState<'MANUAL' | 'BULK'>('MANUAL');
  const [formData, setFormData] = useState<Partial<Trade>>({
    symbol: '',
    side: 'LONG',
    status: 'CLOSED',
    entryPrice: 0,
    exitPrice: 0,
    quantity: 0,
    riskAmount: 0,
    fees: 0,
    entryDate: new Date().toISOString().split('T')[0],
    tradingPlan: '',
    analysis: '',
    results: '',
    lessons: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pnl = formData.side === 'LONG' 
      ? (Number(formData.exitPrice) - Number(formData.entryPrice)) * Number(formData.quantity)
      : (Number(formData.entryPrice) - Number(formData.exitPrice)) * Number(formData.quantity);

    const newTrade: Trade = {
      ...(formData as Trade),
      id: crypto.randomUUID(),
      pnl: pnl - (formData.fees || 0),
    };

    onSave(newTrade);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 rounded-3xl bg-stone-100 p-4 animate-in slide-in-from-bottom-4 duration-500 dark:bg-neutral-950">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-neutral-950 dark:text-neutral-50">Log Trade Data</h2>
          <p className="mt-1 font-medium text-neutral-500">Choose between manual execution entry or bulk CSV import.</p>
        </div>

        <div className="flex rounded-2xl border border-neutral-200 bg-white p-1 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <button 
            onClick={() => setActiveMode('MANUAL')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              activeMode === 'MANUAL' 
                ? 'bg-neutral-950 text-white shadow-sm dark:bg-neutral-100 dark:text-neutral-950' 
                : 'text-neutral-500 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-neutral-100'
            }`}
          >
            <Keyboard size={16} />
            Manual Entry
          </button>
          <button 
            onClick={() => setActiveMode('BULK')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              activeMode === 'BULK' 
                ? 'bg-neutral-950 text-white shadow-sm dark:bg-neutral-100 dark:text-neutral-950' 
                : 'text-neutral-500 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-neutral-100'
            }`}
          >
            <FileSpreadsheet size={16} />
            Bulk Import
          </button>
        </div>
      </header>

      {activeMode === 'MANUAL' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-12 rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 lg:grid-cols-2">
            {/* Numeric Details */}
            <div className="space-y-6">
              <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-500">
                <span className="h-px w-6 bg-neutral-300 dark:bg-neutral-700"></span>
                Execution Details
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">Symbol / Asset</label>
                  <input 
                    type="text" 
                    required
                    className="w-full rounded-xl border border-neutral-200 bg-stone-50 px-4 py-3 outline-none transition-all focus:ring-1 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                    placeholder="e.g. BTC/USDT or NVDA"
                    value={formData.symbol}
                    onChange={e => setFormData({...formData, symbol: e.target.value})}
                  />
                </div>

                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">Side</label>
                    <select 
                      className="w-full rounded-xl border border-neutral-200 bg-stone-50 px-4 py-3 outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                      value={formData.side}
                      onChange={e => setFormData({...formData, side: e.target.value as TradeSide})}
                    >
                      <option value="LONG">Long</option>
                      <option value="SHORT">Short</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">Date</label>
                    <input 
                      type="date"
                      className="w-full rounded-xl border border-neutral-200 bg-stone-50 px-4 py-3 outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                      value={formData.entryDate}
                      onChange={e => setFormData({...formData, entryDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">Entry Price</label>
                    <input 
                      type="number" step="any" required
                      className="w-full rounded-xl border border-neutral-200 bg-stone-50 px-4 py-3 outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                      value={formData.entryPrice}
                      onChange={e => setFormData({...formData, entryPrice: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">Exit Price</label>
                    <input 
                      type="number" step="any" required
                      className="w-full rounded-xl border border-neutral-200 bg-stone-50 px-4 py-3 outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                      value={formData.exitPrice}
                      onChange={e => setFormData({...formData, exitPrice: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">Quantity</label>
                    <input 
                      type="number" step="any" required
                      className="w-full rounded-xl border border-neutral-200 bg-stone-50 px-4 py-3 outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                      value={formData.quantity}
                      onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">Fees ($)</label>
                    <input 
                      type="number" step="any"
                      className="w-full rounded-xl border border-neutral-200 bg-stone-50 px-4 py-3 outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                      value={formData.fees}
                      onChange={e => setFormData({...formData, fees: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">Risk Amount ($)</label>
                  <input 
                    type="number" step="any" required
                    className="w-full rounded-xl border border-neutral-200 bg-stone-50 px-4 py-3 outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                    placeholder="Total risk for this setup"
                    value={formData.riskAmount}
                    onChange={e => setFormData({...formData, riskAmount: Number(e.target.value)})}
                  />
                </div>
              </div>
            </div>

            {/* Qualitative Data */}
            <div className="space-y-6">
              <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-500">
                <span className="h-px w-6 bg-neutral-300 dark:bg-neutral-700"></span>
                Qualitative Context
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">Trading Plan</label>
                  <textarea 
                    className="h-24 w-full rounded-xl border border-neutral-200 bg-stone-50 px-4 py-3 text-sm transition-all outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                    placeholder="Strategy name, catalysts, setup rules..."
                    value={formData.tradingPlan}
                    onChange={e => setFormData({...formData, tradingPlan: e.target.value})}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">Market Analysis</label>
                  <textarea 
                    className="h-24 w-full rounded-xl border border-neutral-200 bg-stone-50 px-4 py-3 text-sm transition-all outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                    placeholder="Price action context, indicators, session volume..."
                    value={formData.analysis}
                    onChange={e => setFormData({...formData, analysis: e.target.value})}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">Lessons Learned</label>
                  <textarea 
                    className="h-24 w-full rounded-xl border border-neutral-200 bg-stone-50 px-4 py-3 text-sm transition-all outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                    placeholder="What did this trade teach you about your edge?"
                    value={formData.lessons}
                    onChange={e => setFormData({...formData, lessons: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button 
              type="button"
              className="px-8 py-3 rounded-xl font-bold text-neutral-500 transition-all hover:text-neutral-950 dark:hover:text-neutral-100"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex items-center rounded-xl bg-neutral-950 px-12 py-3 font-bold text-white transition-all shadow-sm hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-white"
            >
              <Save className="mr-2" size={20} />
              Commit Trade
            </button>
          </div>
        </form>
      ) : (
        <div className="animate-in fade-in duration-500">
          <CsvImport onImport={onBulkImport} />
          
          <div className="mt-8 flex flex-col items-center gap-6 rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:flex-row">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
              <Info size={24} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h4 className="mb-1 font-bold text-neutral-950 dark:text-neutral-50">Deduplication is Automatic</h4>
              <p className="text-sm leading-relaxed text-neutral-500">
                Our system generates a unique fingerprint for every trade based on its symbol, date, PnL, and quantity. 
                Importing the same CSV twice will not result in duplicate entries.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeForm;
