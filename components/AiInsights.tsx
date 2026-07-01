
import React, { useMemo, useState } from 'react';
import { EvaluationConfig, Trade, TradingMetrics } from '../types';
import { getAiInsight } from '../services/openaiService';
import { BrainCircuit, Loader2, AlertCircle, Send } from 'lucide-react';

interface Props {
  trades: Trade[];
  metrics: TradingMetrics;
  evaluationConfig: EvaluationConfig;
}

const AiInsights: React.FC<Props> = ({ trades, metrics, evaluationConfig }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(
    'Review my trading journal and give me the 3 highest-impact changes I should make next.'
  );

  const quickPrompts = useMemo(() => ([
    'Review my last 30 trades and tell me where my execution is leaking money.',
    'Find the biggest behavioral mistake I keep repeating.',
    'Give me a plan to improve consistency over the next 10 trades.',
  ]), []);

  const handleAnalyze = async () => {
    if (trades.length < 3) {
      setError("Please log at least 3 trades for meaningful AI analysis.");
      return;
    }
    if (!prompt.trim()) {
      setError("Ask a question or pick a suggested prompt first.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getAiInsight({
        prompt,
        trades,
        metrics,
        evaluationConfig,
      });
      setAnalysis(result);
    } catch (err) {
      setError("Failed to generate AI analysis. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in duration-500">
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950 p-8 text-white shadow-2xl dark:border-neutral-800">
        <div className="relative z-10">
          <div className="mb-4 flex items-center space-x-3">
            <BrainCircuit size={32} />
            <h2 className="text-3xl font-bold">AI Trading Coach</h2>
          </div>
          <p className="mb-6 max-w-xl text-lg text-neutral-300">
            Ask questions about your trading behavior, risk, or execution. The assistant uses your journal data, current metrics, and eval settings to answer in context.
          </p>

          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            {[
              `Trades ${metrics.totalTrades}`,
              `PnL ${metrics.totalPnL >= 0 ? '+' : ''}${metrics.totalPnL.toFixed(2)}`,
              `Win rate ${metrics.winRate.toFixed(1)}%`,
            ].map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-200">
                {item}
              </div>
            ))}
          </div>

          <textarea
            className="min-h-28 w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none transition-all placeholder:text-neutral-400 focus:border-white/30"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ask the assistant about your trading..."
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {quickPrompts.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPrompt(item)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-neutral-200 transition-colors hover:bg-white/10"
              >
                {item}
              </button>
            ))}
          </div>

          <button
            disabled={loading}
            onClick={handleAnalyze}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-neutral-950 transition-all hover:bg-neutral-100 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            <span>{loading ? 'Analyzing...' : 'Ask AI Coach'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-4 rounded-xl flex items-center space-x-3">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {analysis && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-xl dark:border-neutral-800 dark:bg-neutral-900 animate-in slide-in-from-top-4 duration-500">
          <div className="prose max-w-none prose-neutral dark:prose-invert">
            {/* Split markdown-like response for basic rendering if no markdown lib is used */}
            {analysis.split('\n').map((line, idx) => {
              if (line.startsWith('#')) return <h3 key={idx} className="mb-2 mt-4 text-xl font-bold text-neutral-950 dark:text-neutral-100">{line.replace(/#/g, '')}</h3>;
              if (line.startsWith('*') || line.startsWith('-')) return <li key={idx} className="ml-4 text-neutral-700 dark:text-neutral-300">{line.substring(1).trim()}</li>;
              return <p key={idx} className="mb-2 text-neutral-700 dark:text-neutral-300">{line}</p>;
            })}
          </div>
        </div>
      )}

      {!analysis && !loading && !error && (
        <div className="rounded-2xl border-2 border-dashed border-neutral-300 py-20 text-center dark:border-neutral-800">
          <BrainCircuit className="mx-auto mb-4 text-neutral-500 dark:text-neutral-700" size={48} />
          <h3 className="font-medium text-neutral-700 dark:text-neutral-300">Ready to ask the assistant?</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-500">Use your trades, journal notes, and eval settings to get targeted feedback.</p>
        </div>
      )}
    </div>
  );
};

export default AiInsights;
