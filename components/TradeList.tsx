
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
    <div className="space-y-6 rounded-3xl bg-stone-100 p-4 animate-in fade-in duration-500 dark:bg-neutral-950">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-neutral-950 dark:text-neutral-50">Trade History</h2>
          <p className="font-medium text-neutral-500">Total of {trades.length} recorded operations.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input 
              type="text" 
              placeholder="Search symbol..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium outline-none transition-all focus:ring-1 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 md:w-64"
            />
          </div>
          <button className="rounded-xl border border-neutral-200 bg-white p-2.5 text-neutral-500 transition-colors hover:text-neutral-950 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:text-neutral-100">
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 shadow-sm dark:border-neutral-800">
        <table className="w-full border-collapse text-left bg-white dark:bg-neutral-900">
          <thead className="border-b border-neutral-200 bg-stone-50 text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950">
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
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {filteredTrades.map((trade) => {
              const netPnl = trade.pnl - (trade.fees || 0);
              return (
                <tr key={trade.id} className="group transition-all hover:bg-stone-50 dark:hover:bg-neutral-800/40">
                  <td className="px-6 py-4 font-black text-neutral-900 dark:text-neutral-100">
                    {trade.symbol}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                      trade.side === 'LONG' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {trade.side}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-neutral-500">
                    {trade.entryPrice} <span className="text-slate-700">→</span> {trade.exitPrice}
                  </td>
                  <td className={`px-6 py-4 text-xs font-bold ${trade.pnl >= 0 ? 'text-neutral-500' : 'text-neutral-500'}`}>
                    {formatCurrency(trade.pnl)}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-rose-600/70">
                    {trade.fees > 0 ? `-${formatCurrency(trade.fees)}` : '—'}
                  </td>
                  <td className={`px-6 py-4 text-sm font-black ${netPnl >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {formatCurrency(netPnl)}
                  </td>
                  <td className="px-6 py-4 text-[10px] font-bold uppercase text-neutral-500">
                    <div className="flex items-center space-x-2">
                      <Clock size={12} />
                      <span>{new Date(trade.entryDate).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onDelete(trade.id)}
                      className="rounded-lg p-2 text-neutral-500 opacity-0 transition-all hover:bg-rose-500/10 hover:text-rose-600 group-hover:opacity-100"
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
                  <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                    <Search size={48} />
                    <p className="text-sm font-bold uppercase tracking-widest">No matching trades found</p>
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
