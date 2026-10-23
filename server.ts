import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini client initialization with mandatory User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API: Generate AI-assisted Monthly Sales Executive Summary
app.post('/api/gemini/summary', async (req: Request, res: Response) => {
  try {
    const { datasetSummary, focusArea = 'general', tone = 'executive' } = req.body;

    if (!datasetSummary) {
      return res.status(400).json({ error: 'Missing dataset summary payload' });
    }

    const prompt = `
You are the Chief Commercial Officer & Senior Sales Strategy Analyst reviewing monthly SaaS sales performance data.
Analyze the provided sales summary and produce a high-impact, plain-language executive summary for the monthly management review meeting.

Context / Dataset Metrics:
${JSON.stringify(datasetSummary, null, 2)}

Parameters:
- Focus Mode: ${focusArea}
- Target Tone: ${tone}

Requirements:
1. Be direct, authoritative, and data-driven (cite specific numbers, percentages, regions, reps, and product names).
2. Clearly identify:
   - Which regions are performing best vs lagging and why.
   - Which sales persons are leading vs falling behind (highlight quota gaps and deal velocity).
   - Which categories and products drive the lion's share of revenue vs underperforming.
3. Highlight specific red flags (e.g. heavy discounting, stalled deals, low win rates).
4. Provide concrete, actionable coaching recommendations for sales management in the upcoming month.
`;

    const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let lastError: any = null;
    let text: string | undefined;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: 'You are an elite enterprise SaaS sales VP who turns raw sales spreadsheets into clear, decisive executive briefings. Output clean structured JSON matching the requested schema.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                executiveOverview: { type: Type.STRING },
                regionalBreakdown: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      region: { type: Type.STRING },
                      verdict: { type: Type.STRING },
                      commentary: { type: Type.STRING },
                    },
                    required: ['region', 'verdict', 'commentary'],
                  },
                },
                topPerformers: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      highlight: { type: Type.STRING },
                      tacticsToReplicate: { type: Type.STRING },
                    },
                    required: ['name', 'highlight', 'tacticsToReplicate'],
                  },
                },
                attentionAreas: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      subject: { type: Type.STRING },
                      severity: { type: Type.STRING },
                      issue: { type: Type.STRING },
                      action: { type: Type.STRING },
                    },
                    required: ['subject', 'severity', 'issue', 'action'],
                  },
                },
                productInsights: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING },
                      status: { type: Type.STRING },
                      observation: { type: Type.STRING },
                    },
                    required: ['category', 'status', 'observation'],
                  },
                },
                managerActionItems: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: [
                'headline',
                'executiveOverview',
                'regionalBreakdown',
                'topPerformers',
                'attentionAreas',
                'productInsights',
                'managerActionItems',
              ],
            },
          },
        });

        if (response.text) {
          text = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} failed, trying fallback:`, err.message || err);
      }
    }

    if (!text) {
      throw lastError || new Error('All model attempts failed');
    }

    const parsed = JSON.parse(text);
    return res.json({ success: true, summary: parsed });
  } catch (error: any) {
    console.error('Error generating executive summary:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate executive summary',
    });
  }
});

// API: Q&A / Ask Sales Assistant
app.post('/api/gemini/ask', async (req: Request, res: Response) => {
  try {
    const { question, datasetSummary } = req.body;

    if (!question || !datasetSummary) {
      return res.status(400).json({ error: 'Missing question or datasetSummary' });
    }

    const prompt = `
A sales manager is asking a specific question during their monthly review meeting.
Answer directly, concisely, and cite actual figures from the provided dataset summary.

User Question: "${question}"

Sales Summary Context:
${JSON.stringify(datasetSummary, null, 2)}

Provide a structured, helpful answer formatted with bullet points and bold metrics where appropriate. Max 3-4 paragraphs.
`;

    const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let answerText = '';

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: 'You are an expert sales operations analyst. Be concise, direct, and factually grounded in the sales data provided.',
          },
        });
        if (response.text) {
          answerText = response.text;
          break;
        }
      } catch (err) {
        console.warn(`Ask model ${model} failed, trying next.`);
      }
    }

    if (!answerText) {
      throw new Error('Could not generate an answer from AI models');
    }

    return res.json({ success: true, answer: answerText });
  } catch (error: any) {
    console.error('Error answering sales query:', error);
    return res.status(500).json({
      error: error.message || 'Failed to answer query',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sales Pulse server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
