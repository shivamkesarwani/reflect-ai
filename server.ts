import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

let genAIClient: GoogleGenAI | null = null;
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing. Please add it to your environment or AI Studio Secrets.");
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

const CANDIDATE_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-3.1-pro-preview",
  "gemini-flash-latest",
];

async function generateContentWithFallback(ai: GoogleGenAI, params: {
  contents: any;
  config?: any;
}) {
  let lastError: any = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} failed, trying next candidate. Cause:`, err?.message || err);
    }
  }
  throw lastError;
}

// System instruction for reflection & journaling partner
const DEFAULT_JOURNAL_SYSTEM_INSTRUCTION = `You are a thoughtful, empathetic, and insightful journaling companion and reflection guide.
Your purpose is to help the user unpack their thoughts, articulate their feelings, gain clarity, and brainstorm ideas or solutions.
Guidelines:
1. Be warm, attentive, and validating, without being overly verbose or cliché.
2. Offer thoughtful reflections and alternative perspectives to help them look deeper.
3. When appropriate, offer 1 or 2 gentle exploratory questions to prompt further discovery.
4. When they are problem-solving or brainstorming, suggest creative, constructive ideas.
5. Format your response cleanly using Markdown (paragraphs, bullet points when helpful). Keep responses focused, typically 100 to 250 words unless they ask for detailed analysis.`;

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Multi-turn reflection chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, customPrompt } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const ai = getGenAI();

    // Format messages for @google/genai
    const formattedContents = messages.map((m: { role: string; text: string }) => ({
      role: m.role === "model" || m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    }));

    // If customPrompt is provided, append as user input
    if (customPrompt) {
      formattedContents.push({
        role: "user",
        parts: [{ text: customPrompt }],
      });
    }

    const response = await generateContentWithFallback(ai, {
      contents: formattedContents,
      config: {
        systemInstruction: DEFAULT_JOURNAL_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const replyText = response.text || "I'm reflecting on what you shared. Could you say a bit more?";
    return res.json({ text: replyText });
  } catch (error: unknown) {
    console.error("Gemini Chat Error:", error);
    const msg = error instanceof Error ? error.message : "Failed to generate reflection";
    return res.status(500).json({ error: msg });
  }
});

// Structured reflection summarizer
app.post("/api/summarize", async (req, res) => {
  try {
    const { messages, title } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const ai = getGenAI();

    const formattedContents = messages.map((m: { role: string; text: string }) => ({
      role: m.role === "model" || m.role === "assistant" ? "model" : "user",
      parts: [{ text: `${m.role === "user" ? "User" : "Gemini"}: ${m.text}` }],
    }));

    formattedContents.push({
      role: "user",
      parts: [{
        text: `Based on the journal conversation above, generate a reflective summary.
${title ? `Existing draft title: "${title}".` : ""}
Return valid JSON adhering to this structure:
{
  "title": "A concise, evocative title (3 to 6 words) reflecting the essence of this journal entry",
  "summary": "A 2 to 3 sentence synthesis of the user's thoughts, emotions, and breakthroughs.",
  "keyThemes": ["Theme 1", "Theme 2", "Theme 3"],
  "actionableTakeaways": ["A gentle practical reflection point or next step", "Another practical takeaway"],
  "sentiment": "Calm" | "Inspired" | "Contemplative" | "Challenged" | "Grateful"
}`
      }],
    });

    const response = await generateContentWithFallback(ai, {
      contents: formattedContents,
      config: {
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    let data;
    try {
      data = JSON.parse(response.text || "{}");
    } catch {
      data = {
        title: title || "Personal Reflection",
        summary: response.text || "Reflection session completed.",
        keyThemes: ["Mindfulness", "Self-Reflection"],
        actionableTakeaways: ["Take a quiet moment to absorb today's realizations."],
        sentiment: "Contemplative"
      };
    }

    return res.json(data);
  } catch (error: unknown) {
    console.error("Gemini Summarize Error:", error);
    const msg = error instanceof Error ? error.message : "Failed to summarize reflection";
    return res.status(500).json({ error: msg });
  }
});

// Daily or contextual reflection prompts
app.get("/api/prompts", async (_req, res) => {
  try {
    const ai = getGenAI();
    const response = await generateContentWithFallback(ai, {
      contents: "Generate 5 inspiring, diverse, and introspective journal reflection prompts for today. Return as JSON array of objects with keys: id (string), category (e.g. 'Mindfulness', 'Personal Growth', 'Gratitude', 'Creativity', 'Challenges'), prompt (string, 1-2 thoughtful sentences), starterThought (string, a gentle opening sentence to help them start typing).",
      config: {
        responseMimeType: "application/json",
        temperature: 0.8,
      },
    });

    let prompts = [];
    try {
      prompts = JSON.parse(response.text || "[]");
    } catch {
      prompts = [
        {
          id: "p1",
          category: "Mindfulness",
          prompt: "What is demanding the most mental energy from you right now, and how does your body feel when you hold onto it?",
          starterThought: "Today my mind keeps circling back to..."
        },
        {
          id: "p2",
          category: "Gratitude",
          prompt: "Think about an unexpected small moment of peace or beauty you encountered in the last 24 hours.",
          starterThought: "A quiet moment I appreciate was..."
        }
      ];
    }
    return res.json({ prompts });
  } catch (err) {
    // Fallback static prompts if offline or key not yet injected
    return res.json({
      prompts: [
        {
          id: "p1",
          category: "Mindfulness",
          prompt: "What is demanding the most mental energy from you right now, and what would letting go look like?",
          starterThought: "Today, what's taking up space in my thoughts is..."
        },
        {
          id: "p2",
          category: "Gratitude",
          prompt: "Reflect on a subtle kindness, a restful moment, or an insight that felt grounding recently.",
          starterThought: "One thing that brought me warmth was..."
        },
        {
          id: "p3",
          category: "Growth & Focus",
          prompt: "If today were an opportunity to practice one virtue (patience, courage, curiosity), which would you choose?",
          starterThought: "I want to bring more intentionality to..."
        },
        {
          id: "p4",
          category: "Decision Making",
          prompt: "What is an intuition you've been having that you haven't yet put into clear words?",
          starterThought: "Deep down, I feel that..."
        }
      ]
    });
  }
});

// Vite middleware in dev; static file serving in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Journal app server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
