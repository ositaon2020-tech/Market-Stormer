import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API route: AI Suggestion for Complaint Resolution
app.post("/api/ai/suggest-resolution", async (req, res) => {
  const { title, description, category, severity, vendorName } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: "Missing complaint title or description." });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // Fallback response for offline or unconfigured environment
      console.warn("GEMINI_API_KEY is not configured. Serving high-fidelity simulated response.");
      return res.json({
        resolution: `Dear ${vendorName},\n\nWe understand your concern regarding "${title}". As a valued MamiHubs micro-merchant, we want to ensure your operations run smoothly.\n\nSimulated Action Plan:\n1. Dedicated field assistance will reach out within 2 hours to clear any pipeline blocks.\n2. Technical support will trace physical or cache errors corresponding to your ${category} issue.\n3. We have marked this ticket as ${severity.toUpperCase()} and notified your direct hub supervisor.`,
        suggestedTraining: "Marketplace Organic & Family Standards Audit",
        greetingHint: "Empathetic Community Tone"
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      You are an expert Onboarding Director for MamiHubs (a community-focused family and mom-merchant marketplace.
      A micro-merchant named "${vendorName}" has logged a complaint. Here are the details:
      - Title: ${title}
      - Category: ${category}
      - Severity: ${severity}
      - Description: ${description}

      A supervisor needs to resolve this complaint. Provide:
      1. A professional, highly empathetic response to draft and send to the maternal merchant. Match the warm, community-first tone of MamiHubs.
      2. A concise 3-step action roadmap for the field officer to execute physically or digitally.
      3. Recommend which of these 4 training modules the officer should take to prevent this issue in the future:
         - "High-Touch Micro-Merchant Empathy"
         - "Marketplace Organic & Family Standards Audit"
         - "Instructing First-Order Fulfilment"
         - "Safeguarding Merchant Bank Data & PII"

      Respond strictly in JSON format matching this schema:
      {
        "resolution": "Full response draft for the merchant with greeting and closing",
        "steps": ["Step 1", "Step 2", "Step 3"],
        "recommendedTraining": "Exact title of recommended training from the list"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const solutionText = response.text || "{}";
    const solutionJson = JSON.parse(solutionText.trim());
    return res.json(solutionJson);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({
      error: "Failed to generate suggestion",
      details: error.message
    });
  }
});

// API route: Funnel evaluation report generator
app.post("/api/ai/onboarding-brief", async (req, res) => {
  const { funnelStats, activeCount, inactiveCount, registeredCount } = req.body;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.json({
        executiveSummary: "Onboarding performance remains steady across all hubs. The major conversion bottleneck continues to reside between Step 3 (First Product Uploaded) and Step 4 (Minimum 10 Products Uploaded), where micro-merchants experience difficulty arranging photography and stock inventory labels. East Hub is currently outperforming Central Hub in total completions.",
        directives: [
          "Organize localized content-creation hubs where supervisors can assist mompreneurs with standard product photo snapshots.",
          "Dispatch Jessica Chen to coordinate with Sarah Jenkins for high-touch focus sessions for inactive textiles vendors.",
          "Release the revised 'Instructing First-Order Fulfilment' guidelines to expedite Step 5 and Step 6 transitions."
        ]
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      You are the Global Admin Strategist of MamiHubs (family/maternity focused marketplace).
      Analyze these aggregate vendor onboarding performance statistics:
      - Total Registered Vendors: ${registeredCount}
      - Currently Active (order logged): ${activeCount}
      - Currently Flagged Inactive (>10 days idle): ${inactiveCount}
      - Funnel distribution details: ${JSON.stringify(funnelStats)}

      Generate:
      1. A brief 1-paragraph community executive summary.
      2. 3 concrete strategic directives for supervisors to optimize onboarding velocity. Focus on helping home-based mompreneurs overcome technical barriers.

      Respond strictly in JSON format matching this schema:
      {
        "executiveSummary": "1-paragraph summary text here",
        "directives": ["Directive A", "Directive B", "Directive C"]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const solutionText = response.text || "{}";
    const solutionJson = JSON.parse(solutionText.trim());
    return res.json(solutionJson);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({
      error: "Failed to generate strategy report",
      details: error.message
    });
  }
});

// Serve frontend assets
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
