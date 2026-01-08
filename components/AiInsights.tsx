
import React, { useState } from 'react';
import { Trade } from '../types';
import { getAiAnalysis } from '../services/geminiService';
import { BrainCircuit, Sparkles, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  trades: Trade[];
}

const AiInsights: React.FC<Props> = ({ trades }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (trades.length < 3) {
      setError("Please log at least 3 trades for meaningful AI analysis.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getAiAnalysis(trades);
      setAnalysis(result);
    } catch (err) {
      setError("Failed to generate AI analysis. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <BrainCircuit size={32} />
            <h2 className="text-3xl font-bold">AI Trading Coach</h2>
          </div>
          <p className="text-indigo-100 text-lg mb-6 max-w-xl">
            Our specialized Gemini-powered engine analyzes your trade history, 
            lessons, and performance to identify patterns you might have missed.
          </p>
          <button 
            disabled={loading}
            onClick={handleAnalyze}
            className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold flex items-center space-x-2 hover:bg-indigo-50 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            <span>{loading ? 'Analyzing Data...' : 'Generate New Insight'}</span>
          </button>
        </div>
        {/* Decorative background circle */}
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-4 rounded-xl flex items-center space-x-3">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {analysis && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl animate-in slide-in-from-top-4 duration-500">
          <div className="prose prose-invert prose-indigo max-w-none">
            {/* Split markdown-like response for basic rendering if no markdown lib is used */}
            {analysis.split('\n').map((line, idx) => {
              if (line.startsWith('#')) return <h3 key={idx} className="text-xl font-bold mt-4 mb-2 text-indigo-400">{line.replace(/#/g, '')}</h3>;
              if (line.startsWith('*') || line.startsWith('-')) return <li key={idx} className="ml-4 text-slate-300">{line.substring(1).trim()}</li>;
              return <p key={idx} className="text-slate-400 mb-2">{line}</p>;
            })}
          </div>
        </div>
      )}

      {!analysis && !loading && !error && (
        <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl">
          <BrainCircuit className="mx-auto text-slate-700 mb-4" size={48} />
          <h3 className="text-slate-500 font-medium">Ready to uncover your trading biases?</h3>
          <p className="text-slate-600 text-sm">Log your trades then click "Generate New Insight" above.</p>
        </div>
      )}
    </div>
  );
};

export default AiInsights;
