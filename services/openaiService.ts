import { EvaluationConfig, Trade, TradingMetrics } from '../types';

export interface AiCoachRequest {
  prompt: string;
  trades: Trade[];
  metrics: TradingMetrics;
  evaluationConfig: EvaluationConfig;
}

export const getAiInsight = async (request: AiCoachRequest): Promise<string> => {
  const response = await fetch('/api/ai-insights', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || 'Failed to generate AI insight');
  }

  const data = await response.json() as { text?: string };
  if (!data.text) {
    throw new Error('AI returned an empty response');
  }

  return data.text;
};
