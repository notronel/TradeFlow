
import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Trade, TradeSide } from '../types';
import { FileUp, Download, CheckCircle2, AlertCircle, FileSpreadsheet, Info } from 'lucide-react';

interface Props {
  onImport: (trades: Trade[]) => number;
}

const CsvImport: React.FC<Props> = ({ onImport }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'SUCCESS' | 'ERROR' | 'INFO', message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * High-reliability numeric cleaner for financial CSVs.
   * Corrects for: $1,234.56, (100.00), $(50.00), -25.00, " 10.00 "
   */
  const cleanNumeric = (val: any): number => {
    if (typeof val === 'number') return val;
    if (val === null || val === undefined || val === '') return 0;
    
    const s = String(val).trim();
    
    // 1. Detect if it's negative. Look for leading minus or presence of parentheses
    const isNegative = s.startsWith('-') || (s.includes('(') && s.includes(')'));
    
    // 2. Strip all non-numeric characters EXCEPT the decimal point
    const cleaned = s.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    
    if (isNaN(parsed)) return 0;
    
    // 3. Apply the sign
    return isNegative ? -Math.abs(parsed) : parsed;
  };

  const downloadTemplate = () => {
    const headers = "Symbol,Side,EntryPrice,ExitPrice,Quantity,PnL,Date,Fees,RiskAmount\nAAPL,LONG,150.00,155.00,10,50.00,2023-10-27,2.00,100.00";
    const blob = new Blob([headers], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tradeflow_template.csv';
    a.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setFeedback(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rawRows = results.data as any[];
          
          if (rawRows.length === 0) {
            setFeedback({ type: 'ERROR', message: 'The CSV file appears to be empty.' });
            setIsProcessing(false);
            return;
          }

          const parsedTrades: Trade[] = rawRows.map((row: any) => {
            const getVal = (keys: string[]) => {
              const foundKey = Object.keys(row).find(k => 
                keys.some(key => k.toLowerCase().trim() === key.toLowerCase())
              );
              return foundKey ? row[foundKey] : undefined;
            };

            const symbol = getVal(['symbol', 'ticker', 'asset', 'instrument']) || 'UNKNOWN';
            const sideRaw = String(getVal(['side', 'type', 'direction']) || 'LONG').toUpperCase();
            
            // Guess side based on buy/sell fill existence if column is missing
            const buyFill = getVal(['buyFillId']);
            const sellFill = getVal(['sellFillId']);
            let side: TradeSide = 'LONG';
            if (sideRaw.includes('SHORT') || sideRaw.startsWith('S')) {
              side = 'SHORT';
            }

            const entryPrice = cleanNumeric(getVal(['entryprice', 'entry', 'buyprice', 'price']));
            const exitPrice = cleanNumeric(getVal(['exitprice', 'exit', 'sellprice']));
            const quantity = cleanNumeric(getVal(['quantity', 'qty', 'size', 'amount']));
            const pnl = cleanNumeric(getVal(['pnl', 'profit', 'gain', 'netpnl']));
            
            const rawDate = getVal(['date', 'entrydate', 'time', 'opened', 'boughtTimestamp', 'soldTimestamp']);
            const date = rawDate || new Date().toISOString();
            
            const fees = cleanNumeric(getVal(['fees', 'commission', 'cost']));
            const risk = cleanNumeric(getVal(['riskamount', 'risk', 'stoploss']));

            // Improved unique ID to prevent collisions while allowing similar trades
            const externalId = `csv_${symbol}_${date}_${pnl}_${quantity}`.replace(/[^a-zA-Z0-9]/g, '');

            return {
              id: crypto.randomUUID(),
              symbol: symbol.toString(),
              side,
              status: 'CLOSED',
              entryPrice,
              exitPrice,
              quantity,
              pnl,
              fees,
              riskAmount: risk,
              entryDate: new Date(date).toISOString(),
              tradingPlan: 'Imported via CSV',
              analysis: '',
              results: pnl >= 0 ? 'Win' : 'Loss',
              lessons: '',
              source: 'CSV',
              externalId
            };
          });

          const totalParsed = parsedTrades.length;
          const importedCount = onImport(parsedTrades);

          if (importedCount > 0) {
            setFeedback({ 
              type: 'SUCCESS', 
              message: `Successfully imported ${importedCount} trades. Total Net: ${parsedTrades.reduce((acc, t) => acc + t.pnl, 0).toFixed(2)}` 
            });
          } else {
            setFeedback({ 
              type: 'INFO', 
              message: `No new trades found. All ${totalParsed} trades were duplicates.` 
            });
          }
        } catch (err) {
          console.error("CSV Parse Error:", err);
          setFeedback({ type: 'ERROR', message: 'Failed to parse CSV format.' });
        } finally {
          setIsProcessing(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: (err) => {
        setFeedback({ type: 'ERROR', message: 'Error reading file.' });
        setIsProcessing(false);
      }
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
            <FileSpreadsheet className="text-indigo-400" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">CSV Bulk Import</h3>
            <p className="text-sm text-slate-500">Enhanced for accounting-style formatting</p>
          </div>
        </div>
        <button 
          onClick={downloadTemplate}
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center bg-indigo-400/10 px-3 py-2 rounded-lg transition-colors"
        >
          <Download size={14} className="mr-2" />
          Template
        </button>
      </div>

      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isProcessing ? 'border-slate-700 bg-slate-800/50' : 'border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/30'
        }`}
      >
        <input 
          type="file" 
          accept=".csv" 
          hidden 
          ref={fileInputRef} 
          onChange={handleFileUpload}
        />
        <FileUp className={`mx-auto mb-3 ${isProcessing ? 'animate-bounce text-slate-500' : 'text-slate-600'}`} size={32} />
        <p className="text-sm font-medium text-slate-300">
          {isProcessing ? 'Processing data...' : 'Click to upload or drag & drop CSV'}
        </p>
        <p className="text-xs text-slate-500 mt-1">Handles $(PnL) and -PnL formats automatically.</p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl flex items-start space-x-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
          feedback.type === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/50' : 
          feedback.type === 'INFO' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/50' :
          'bg-rose-500/10 text-rose-400 border border-rose-500/50'
        }`}>
          <div className="mt-0.5">
            {feedback.type === 'SUCCESS' ? <CheckCircle2 size={18} /> : 
             feedback.type === 'INFO' ? <Info size={18} /> : 
             <AlertCircle size={18} />}
          </div>
          <span className="text-sm font-medium">{feedback.message}</span>
        </div>
      )}
    </div>
  );
};

export default CsvImport;
