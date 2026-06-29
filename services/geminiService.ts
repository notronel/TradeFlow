
import { GoogleGenAI } from "@google/genai";
import { Trade } from "../types";

export const getAiAnalysis = async (trades: Trade[]): Promise<string> => {
  try {
    // API Key is exclusively handled via process.env.API_KEY as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Create a simplified version of trades for the AI to analyze performance
    const tradeDataSummary = trades
      .filter(t => t.symbol !== 'JOURNAL')
      .slice(0, 30) 
      .map(t => ({
        symbol: t.symbol,
        pnl: t.pnl,
        side: t.side,
        lessons: t.lessons || "No lessons logged"
      }));

    const prompt = `
      As an elite trading psychologist and performance coach, analyze my recent trading journal data. 
      Identify specific patterns, flaws in risk management, and psychological biases.
      
      Recent Trade Data:
      ${JSON.stringify(tradeDataSummary, null, 2)}
      
      Please provide a structured response in Markdown:
      1. **Performance Audit**: Brief summary of recent results.
      2. **Psychological Profile**: What do my "Lessons Learned" suggest about my state of mind?
      3. **Strategic Adjustments**: 3 high-impact steps to improve my sharpe ratio and consistency.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "AI generated an empty response. Please try again.";
  } catch (error: any) {
    console.error("Gemini AI error:", error);
    return "### ⚠️ AI Insight Unavailable\n\nFailed to generate analysis. Ensure your environment is configured correctly and you have sufficient trade history.";
  }
};
