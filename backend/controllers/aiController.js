
import { processWithAI } from "../services/aiService.js";

export const aiController = {
  async testAI(req, res) {
    try {
      const prompt = "Say 'ok' if you are working.";
      const aiResult = await processWithAI(prompt, { summarize: false });
      const isSuccess = aiResult && aiResult.summary?.toLowerCase().includes('ok');
      res.json({
        success: isSuccess,
        message: isSuccess ? "AI is working!" : "AI test failed.",
        isMockResponse: false,
        details: aiResult
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "AI test endpoint failed.",
        error: error.message
      });
    }
  },
  
    async listModels(req, res) {
    // OpenAI does not support listing models via API key, so return static info
    res.json({
      success: true,
      models: ["gpt-3.5-turbo", "gpt-4", "text-embedding-ada-002"]
    });
    },

  async askQuestion(req, res) {
    try {
      const { text, options } = req.body;
      const aiResult = await processWithAI(text, options || {});
      res.json({ success: true, result: aiResult });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  async getInsights(req, res) {
    try {
      const { text } = req.body;
      const aiResult = await processWithAI(text, { extractKeyInsights: true });
      res.json({ success: true, insights: aiResult });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  async clarify(req, res) {
    try {
      const { text } = req.body;
      const aiResult = await processWithAI(text, { clarify: true });
      res.json({ success: true, clarification: aiResult });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  async explain(req, res) {
    try {
      const { text } = req.body;
      const aiResult = await processWithAI(text, { explain: true });
      res.json({ success: true, explanation: aiResult });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
