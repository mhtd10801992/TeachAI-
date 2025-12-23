
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables strictly from the root of backend
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize Google AI only if we have a valid API key
let googleAI = null;
const apiKey = process.env.GOOGLE_API_KEY;

console.log('🔑 aiController API Key check:', {
  exists: !!apiKey,
  length: apiKey?.length,
  first10: apiKey?.substring(0, 10)
});

if (apiKey) {
  try {
    googleAI = new GoogleGenerativeAI(apiKey);
    console.log('✅ Google AI API initialized in aiController');
  } catch (error) {
    console.log('⚠️  Google AI initialization failed:', error.message);
  }
} else {
  console.log('⚠️  Google AI API key not configured. AI features will use mock responses.');
}

async function runGoogleAI(prompt, modelName = "gemini-2.0-flash") {
    // Lazy initialization check
    if (!googleAI && process.env.GOOGLE_API_KEY) {
        googleAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    }

    if (!googleAI) {
        throw new Error("Google AI API not initialized");
    }
    try {
        console.log(`🤖 Calling Gemini (${modelName})...`);
        const model = googleAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("❌ runGoogleAI Error:", error);
        throw error;
    }
}

export const aiController = {
  async askQuestion(req, res) {
    try {
      console.log("📝 Received askQuestion request");
      const { question, context } = req.body;

      if (!question) {
        return res.status(400).json({ error: 'Question is required' });
      }

      // Check Google AI availability
      if (!googleAI && process.env.GOOGLE_API_KEY) {
          googleAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
      }

      // If no Google AI API key, return mock responses
      if (!googleAI) {
          console.log("⚠️ No Google AI instance, returning mock.");
        const mockResponses = {
          'what is the main topic': 'The main topic of this document appears to be about project management and workflow optimization.',
          'summarize key points': 'Key points include: 1) Process improvement initiatives, 2) Team collaboration strategies, 3) Timeline management, 4) Resource allocation.',
          'what are the important dates': 'Important dates mentioned: Project start (Jan 15), Milestone 1 (Feb 28), Final deadline (June 30).',
          'who are the stakeholders': 'Key stakeholders include: Project Manager John Smith, Development Team Lead Sarah Johnson, Client Representative Mike Davis.',
          'what actions are required': 'Key actions include: 1) Complete initial planning phase, 2) Set up team meetings, 3) Define project milestones.',
          'any missing information': 'To get real AI responses, please configure your Google AI API key in the .env file.'
        };
        
        let response = 'I can provide more specific information if you ask about: main topics, key points, important dates, stakeholders, or any specific aspect of the document. (Note: Configure Google AI API key for real AI responses)';
        
        for (const [key, value] of Object.entries(mockResponses)) {
          if (question.toLowerCase().includes(key.split(' ').slice(0, 3).join(' '))) {
            response = value + '\n\n(Mock response - Configure Google AI API key for real AI analysis)';
            break;
          }
        }

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return res.json({
          answer: response,
          mock: true
        });
      }

      // Build context for the AI
      let contextText = '';
      if (context) {
          if (context.mode === 'all' && context.documents) {
            contextText = `You have access to ${context.documentCount} documents. Here's the information:\n\n`;
            context.documents.forEach((doc, index) => {
              contextText += `Document ${index + 1}: ${doc.filename}\n`;
              if (doc.summary) {
                contextText += `Summary: ${doc.summary}\n`;
              }
              if (doc.topics) {
                const topicsStr = Array.isArray(doc.topics) ? doc.topics.join(', ') : doc.topics;
                contextText += `Topics: ${topicsStr}\n`;
              }
              contextText += `\n`;
            });
          } else if (context.mode === 'single') {
            contextText = `Document: ${context.filename}\n`;
            if (context.summary) {
              contextText += `Summary: ${context.summary}\n`;
            }
            if (context.topics && context.topics.length > 0) {
              const topicsStr = Array.isArray(context.topics) ? context.topics.join(', ') : context.topics;
              contextText += `Topics: ${topicsStr}\n`;
            }
          }
      } else {
          console.warn("⚠️ No context provided in request");
      }

      const prompt = `Based on the following information, please answer the user's question accurately and helpfully.\n\n${contextText}\n\nUser Question: ${question}`;

      console.log("🚀 Sending prompt to Google AI...");
      const answer = await runGoogleAI(prompt);
      console.log("✅ Received answer from Google AI");

      res.json({
        answer: answer,
        mock: false
      });

    } catch (error) {
      console.error('❌ Google AI API Error in askQuestion:', error);
      res.status(500).json({ error: 'Failed to process AI request', details: error.message });
    }
  },

  async getInsights(req, res) {
    try {
      const { analysis } = req.body;

      // Lazy check
      if (!googleAI && process.env.GOOGLE_API_KEY) {
        googleAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
      }

      if (!googleAI) {
        const mockInsights = `Analysis Quality Assessment:\n\n1. **Content Completeness**: The document analysis appears comprehensive...\n\n(Mock response - Configure Google AI API key for real AI insights)`;
        await new Promise(resolve => setTimeout(resolve, 800));
        return res.json({
          insights: mockInsights,
          mock: true
        });
      }

      const prompt = `Analyze this document analysis and provide 3-5 key insights or suggestions for improvement:\n\nSummary: ${analysis.summary?.text || 'No summary'}\nTopics: ${analysis.topics?.items?.join(', ') || 'No topics'}\n\nPlease provide actionable insights.`;
      const insights = await runGoogleAI(prompt);
      res.json({
        insights: insights,
        mock: false
      });

    } catch (error) {
      console.error('Google AI Insights Error:', error);
      res.status(500).json({ error: 'Failed to generate insights' });
    }
  },

  async clarify(req, res) {
    try {
      const { text, context } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Text is required for clarification' });
      }

      if (!googleAI && process.env.GOOGLE_API_KEY) {
        googleAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
      }

      if (!googleAI) {
        return res.json({
          clarification: `This text requires clarification: \"${text}\". (Configure Google AI API key for detailed AI clarification)`,
          suggestions: ['Verify accuracy', 'Add sources'],
          mock: true
        });
      }

      const prompt = `As an AI document analyst, I need clarification about the following text from a document:\n\nText: \"${text}\"\nContext: ${context || 'None'}\n\nPlease provide: 1. Why this might need clarification. 2. Possible alternative interpretations. 3. What additional information would help.`;
      const clarification = await runGoogleAI(prompt);
      res.json({
        clarification: clarification,
        mock: false
      });

    } catch (error) {
      console.error('Google AI Clarification Error:', error);
      res.status(500).json({ error: 'Failed to generate clarification' });
    }
  },

  async explain(req, res) {
    try {
      const { section } = req.body;

      if (!section) {
        return res.status(400).json({ error: 'Section is required for explanation' });
      }

      if (!googleAI && process.env.GOOGLE_API_KEY) {
        googleAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
      }

      if (!googleAI) {
        return res.json({
          explanation: `This section explains the ${section}. (Configure Google AI API key for detailed explanations)`,
          mock: true
        });
      }

      const prompt = `Explain how the AI analyzed and generated the ${section} section for this document. Include: 1. Analysis techniques used. 2. Why this information is important. 3. How to improve the analysis.`;
      const explanation = await runGoogleAI(prompt);
      res.json({
        explanation: explanation,
        mock: false
      });

    } catch (error) {
      console.error('Google AI Explanation Error:', error);
      res.status(500).json({ error: 'Failed to generate explanation' });
    }
  }
};
