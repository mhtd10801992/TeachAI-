import { GoogleGenerativeAI } from "@google/generative-ai";

let googleAI = null;

async function runGoogleAI(prompt, modelName = "gemini-pro") {
    if (!googleAI) {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (apiKey) {
            try {
                googleAI = new GoogleGenerativeAI(apiKey);
                console.log('✅ Google AI API initialized in runGoogleAI');
            } catch (error) {
                console.log('⚠️  Google AI initialization failed:', error.message);
                throw new Error("Google AI API not initialized");
            }
        } else {
            console.log('⚠️ [runGoogleAI] GOOGLE_API_KEY is not.env');
            throw new Error("AI is not configured. API key is missing.");
        }
    }

    try {
        const model = googleAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("❌ runGoogleAI Error:", error);
        throw error;
    }
}

export const aiController = {
  async testAI(req, res) {
    try {
      const prompt = "Say 'ok' if you are working.";
      const result = await runGoogleAI(prompt, "gemini-pro");
      
      const isSuccess = result.toLowerCase().includes('ok');

      res.json({
        success: isSuccess,
        message: isSuccess ? "AI is working!" : "AI test failed.",
        isMockResponse: false,
        details: result
      });
    } catch (error) {
        if(error.message === "AI is not configured. API key is missing."){
            return res.status(401).json({
              success: false,
              message: "AI is not configured. API key is missing.",
              isMockResponse: true
            });
        }
      res.status(500).json({
        success: false,
        message: "AI test endpoint failed.",
        error: error.message
      });
    }
  },
  
  async listModels(req, res) {
    try {
        if (!googleAI) {
            const apiKey = process.env.GOOGLE_API_KEY;
            if (apiKey) {
                googleAI = new GoogleGenerativeAI(apiKey);
            } else {
                return res.status(401).json({
                    success: false,
                    message: "AI is not configured. API key is missing."
                });
            }
        }
        
        const models = await googleAI.getGenerativeModel({ model: "gemini-pro" }).listModels();
        
        res.json({
            success: true,
            models: models.map(m => m.name)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to list AI models.",
            error: error.message
        });
    }
  },

  async askQuestion(req, res) {
    // ... existing function
  },
  async getInsights(req, res) {
    // ... existing function
  },
  async clarify(req, res) {
    // ... existing function
  },
  async explain(req, res) {
    // ... existing function
  }
};
