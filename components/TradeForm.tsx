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
    <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white">Log Trade Data</h2>
          <p className="text-white mt-1 font-medium">Choose between manual execution entry or bulk CSV import.</p>
        </div>

        <div className="flex bg-gray-700 border border-gray-600 rounded-2xl p-1 p-1">
          <button 
            onClick={() => setActiveMode('MANUAL')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              activeMode === 'MANUAL' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-white hover:text-white'
            }`}
          >
            <Keyboard size={16} />
            Manual Entry
          </button>
          <button 
            onClick={() => setActiveMode('BULK')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              activeMode === 'BULK' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-white hover:text-white'
            }`}
          >
            <FileSpreadsheet size={16} />
            Bulk Import
          </button>
        </div>
      </header>

      {activeMode === 'MANUAL' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-700 border border-gray-600 rounded-3xl p-8 shadow-xl grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Numeric Details */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                <span className="w-6 h-px bg-indigo-500/50"></span>
                Execution Details
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-white uppercase tracking-widest mb-2">Symbol / Asset</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white placeholder-gray-500"
                    placeholder="e.g. BTC/USDT or NVDA"
                    value={formData.symbol}
                    onChange={e => setFormData({...formData, symbol: e.target.value})}
                  />
                </div>

                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-white uppercase tracking-widest mb-2">Side</label>
                    <select 
                      className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                      value={formData.side}
                      onChange={e => setFormData({...formData, side: e.target.value as TradeSide})}
                    >
                      <option value="LONG">Long</option>
                      <option value="SHORT">Short</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-white uppercase tracking-widest mb-2">Date</label>
                    <input 
                      type="date"
                      className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                      value={formData.entryDate}
                      onChange={e => setFormData({...formData, entryDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-white uppercase tracking-widest mb-2">Entry Price</label>
                    <input 
                      type="number" step="any" required
                      className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                      value={formData.entryPrice}
                      onChange={e => setFormData({...formData, entryPrice: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white uppercase tracking-widest mb-2">Exit Price</label>
                    <input 
                      type="number" step="any" required
                      className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                      value={formData.exitPrice}
                      onChange={e => setFormData({...formData, exitPrice: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-white uppercase tracking-widest mb-2">Quantity</label>
                    <input 
                      type="number" step="any" required
                      className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                      value={formData.quantity}
                      onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white uppercase tracking-widest mb-2">Fees ($)</label>
                    <input 
                      type="number" step="any"
                      className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                      value={formData.fees}
                      onChange={e => setFormData({...formData, fees: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white uppercase tracking-widest mb-2">Risk Amount ($)</label>
                  <input 
                    type="number" step="any" required
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-500"
                    placeholder="Total risk for this setup"
                    value={formData.riskAmount}
                    onChange={e => setFormData({...formData, riskAmount: Number(e.target.value)})}
                  />
                </div>
              </div>
            </div>

            {/* Qualitative Data */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-emerald-300 uppercase tracking-widest flex items-center gap-2">
                <span className="w-6 h-px bg-emerald-500/50"></span>
                Qualitative Context
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-white uppercase tracking-widest mb-2">Trading Plan</label>
                  <textarea 
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 outline-none h-24 focus:ring-2 focus:ring-indigo-500 text-sm transition-all text-white placeholder-gray-500"
                    placeholder="Strategy name, catalysts, setup rules..."
                    value={formData.tradingPlan}
                    onChange={e => setFormData({...formData, tradingPlan: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white uppercase tracking-widest mb-2">Market Analysis</label>
                  <textarea 
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 outline-none h-24 focus:ring-2 focus:ring-indigo-500 text-sm transition-all text-white placeholder-gray-500"
                    placeholder="Price action context, indicators, session volume..."
                    value={formData.analysis}
                    onChange={e => setFormData({...formData, analysis: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-emerald-300 uppercase tracking-widest mb-2">Lessons Learned</label>
                  <textarea 
                    className="w-full bg-emerald-900/10 border border-emerald-900/30 rounded-xl px-4 py-3 outline-none h-24 focus:ring-2 focus:ring-emerald-500 text-sm transition-all text-white placeholder-gray-500"
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
              className="px-8 py-3 rounded-xl text-white font-bold hover:text-white transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-3 rounded-xl font-bold flex items-center transition-all shadow-xl shadow-indigo-600/20"
            >
              <Save className="mr-2" size={20} />
              Commit Trade
            </button>
          </div>
        </form>
      ) : (
        <div className="animate-in fade-in duration-500">
          <CsvImport onImport={onBulkImport} />
          
          <div className="mt-8 bg-gray-700 border border-gray-600 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
            <div className="w-12 h-12 bg-indigo-900/50 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <Info size={24} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h4 className="font-bold text-white mb-1">Deduplication is Automatic</h4>
              <p className="text-sm text-white leading-relaxed">
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