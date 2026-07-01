
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const openAiKey = env.OPENAI_API_KEY || env.API_KEY || process.env.OPENAI_API_KEY || process.env.API_KEY || '';

  return {
    plugins: [react(), openAiInsightsPlugin(openAiKey)],
    server: {
      port: 5173,
      host: true,
    },
    preview: {
      port: 4173,
      host: true,
    },
  };
});

function openAiInsightsPlugin(apiKey: string) {
  return {
    name: 'openai-ai-insights',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.method !== 'POST' || req.url !== '/api/ai-insights') {
          return next();
        }

        try {
          const body = await readJsonBody(req);
          const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
          if (!prompt) {
            return sendJson(res, 400, { error: 'Prompt is required.' });
          }

          if (!apiKey) {
            return sendJson(res, 500, {
              error: 'Missing OPENAI_API_KEY. Add it to .env.local and restart the dev server.',
            });
          }

          const aiResponse = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-5.5',
              input: [
                {
                  role: 'system',
                  content: [
                    {
                      type: 'input_text',
                      text: 'You are an elite trading journal coach. Use the provided trade history, current metrics, and evaluation config to give concise, practical feedback. Return markdown only with headings and bullets. Focus on behavior, risk control, and next actions. Do not mention that you are an AI model.',
                    },
                  ],
                },
                {
                  role: 'user',
                  content: [
                    {
                      type: 'input_text',
                      text: buildInsightPrompt(body),
                    },
                  ],
                },
              ],
            }),
          });

          if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            return sendJson(res, aiResponse.status, {
              error: errorText || 'OpenAI request failed.',
            });
          }

          const payload = await aiResponse.json();
          const text = extractResponseText(payload);
          if (!text) {
            return sendJson(res, 500, { error: 'OpenAI returned an empty response.' });
          }

          return sendJson(res, 200, { text });
        } catch (error: any) {
          return sendJson(res, 500, {
            error: error?.message || 'Failed to generate AI insight.',
          });
        }
      });
    },
    configurePreviewServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.method !== 'POST' || req.url !== '/api/ai-insights') {
          return next();
        }

        try {
          const body = await readJsonBody(req);
          const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
          if (!prompt) {
            return sendJson(res, 400, { error: 'Prompt is required.' });
          }

          if (!apiKey) {
            return sendJson(res, 500, {
              error: 'Missing OPENAI_API_KEY. Add it to .env.local and restart the preview server.',
            });
          }

          const aiResponse = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-5.5',
              input: [
                {
                  role: 'system',
                  content: [
                    {
                      type: 'input_text',
                      text: 'You are an elite trading journal coach. Use the provided trade history, current metrics, and evaluation config to give concise, practical feedback. Return markdown only with headings and bullets. Focus on behavior, risk control, and next actions. Do not mention that you are an AI model.',
                    },
                  ],
                },
                {
                  role: 'user',
                  content: [
                    {
                      type: 'input_text',
                      text: buildInsightPrompt(body),
                    },
                  ],
                },
              ],
            }),
          });

          if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            return sendJson(res, aiResponse.status, {
              error: errorText || 'OpenAI request failed.',
            });
          }

          const payload = await aiResponse.json();
          const text = extractResponseText(payload);
          if (!text) {
            return sendJson(res, 500, { error: 'OpenAI returned an empty response.' });
          }

          return sendJson(res, 200, { text });
        } catch (error: any) {
          return sendJson(res, 500, {
            error: error?.message || 'Failed to generate AI insight.',
          });
        }
      });
    },
  };
}

function buildInsightPrompt(body: any) {
  return [
    `User prompt: ${body.prompt ?? ''}`,
    '',
    `Current metrics: ${JSON.stringify(body.metrics ?? {}, null, 2)}`,
    '',
    `Evaluation config: ${JSON.stringify(body.evaluationConfig ?? {}, null, 2)}`,
    '',
    `Recent trades: ${JSON.stringify(summarizeTrades(body.trades ?? []), null, 2)}`,
  ].join('\n');
}

function summarizeTrades(trades: any[]) {
  return trades
    .filter(trade => trade && trade.symbol !== 'JOURNAL')
    .slice(0, 30)
    .map(trade => ({
      symbol: trade.symbol,
      side: trade.side,
      pnl: trade.pnl,
      entryDate: trade.entryDate,
      exitDate: trade.exitDate,
      tradingPlan: trade.tradingPlan,
      results: trade.results,
      lessons: trade.lessons,
    }));
}

function extractResponseText(payload: any) {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const parts: string[] = [];
  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (typeof content?.text === 'string' && content.text.trim()) {
        parts.push(content.text.trim());
      }
    }
  }

  return parts.join('\n').trim();
}

async function readJsonBody(req: any) {
  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res: any, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}
