import React, { useState } from 'react';
import { Trade } from '../types';
import { Trash2, Clock, Search, Filter } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

interface Props {
  trades: Trade[];
  onDelete: (id: string) => void;
}

const TradeList: React.FC<Props> = ({ trades, onDelete }) => {
  const [search, setSearch] = useState('');

  const filteredTrades = trades.filter(t => 
    t.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white">Trade History</h2>
          <p className="text-white font-medium">Total of {trades.length} recorded operations.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white" size={16} />
            <input 
              type="text" 
              placeholder="Search symbol..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64 text-sm font-medium transition-all text-white placeholder-gray-400"
            />
          </div>
          <button className="p-2.5 bg-gray-700 border border-gray-600 rounded-xl text-white hover:text-white transition-colors">
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-600 shadow-xl">
        <table className="w-full text-left bg-gray-700 border-collapse">
          <thead className="bg-gray-800 text-white text-[10px] uppercase font-black tracking-widest border-b border-gray-600">
            <tr>
              <th className="px-6 py-5">Symbol</th>
              <th className="px-6 py-5">Side</th>
              <th className="px-6 py-5">Price (In/Out)</th>
              <th className="px-6 py-5">Gross PnL</th>
              <th className="px-6 py-5">Fees</th>
              <th className="px-6 py-5">Net PnL</th>
              <th className="px-6 py-5">Date</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-600">
            {filteredTrades.map((trade) => {
              const netPnl = trade.pnl - (trade.fees || 0);
              return (
                <tr key={trade.id} className="hover:bg-gray-600 transition-all group">
                  <td className="px-6 py-4 font-black text-white">
                    {trade.symbol}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                      trade.side === 'LONG' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/20' : 'bg-rose-900/30 text-rose-400 border border-rose-500/20'
                    }`}>
                      {trade.side}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white text-xs font-mono">
                    {trade.entryPrice} <span className="text-white">→</span> {trade.exitPrice}
                  </td>
                  <td className={`px-6 py-4 text-xs font-bold ${trade.pnl >= 0 ? 'text-white' : 'text-white'}`}>
                    {formatCurrency(trade.pnl)}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-rose-400">
                    {trade.fees > 0 ? `-${formatCurrency(trade.fees)}` : '—'}
                  </td>
                  <td className={`px-6 py-4 text-sm font-black ${netPnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {formatCurrency(netPnl)}
                  </td>
                  <td className="px-6 py-4 text-white text-[10px] font-bold uppercase">
                    <div className="flex items-center space-x-2">
                      <Clock size={12} />
                      <span>{new Date(trade.entryDate).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onDelete(trade.id)}
                      className="p-2 text-white hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredTrades.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3 opacity-30">
                    <Search size={48} className="text-white" />
                    <p className="text-sm font-bold uppercase tracking-widest text-white">No matching trades found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TradeList;