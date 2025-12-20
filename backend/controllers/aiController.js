import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI only if we have a valid API key
let openai = null;
const apiKey = process.env.OPENAI_API_KEY;
if (apiKey && apiKey !== 'sk-placeholder_get_real_key_from_openai_platform' && apiKey !== 'your_openai_api_key_here') {
  try {
    openai = new OpenAI({
      apiKey: apiKey
    });
    console.log('✅ OpenAI API initialized in aiController');
  } catch (error) {
    console.log('⚠️  OpenAI initialization failed:', error.message);
  }
} else {
  console.log('⚠️  OpenAI API key not configured. AI features will use mock responses.');
}

export const aiController = {
  async askQuestion(req, res) {
    try {
      const { question, context } = req.body;

      if (!question) {
        return res.status(400).json({ error: 'Question is required' });
      }

      // If no OpenAI API key, return mock responses
      if (!openai) {
        const mockResponses = {
          'what is the main topic': 'The main topic of this document appears to be about project management and workflow optimization.',
          'summarize key points': 'Key points include: 1) Process improvement initiatives, 2) Team collaboration strategies, 3) Timeline management, 4) Resource allocation.',
          'what are the important dates': 'Important dates mentioned: Project start (Jan 15), Milestone 1 (Feb 28), Final deadline (June 30).',
          'who are the stakeholders': 'Key stakeholders include: Project Manager John Smith, Development Team Lead Sarah Johnson, Client Representative Mike Davis.',
          'what actions are required': 'Key actions include: 1) Complete initial planning phase, 2) Set up team meetings, 3) Define project milestones.',
          'any missing information': 'To get real AI responses, please configure your OpenAI API key in the .env file.'
        };
        
        let response = 'I can provide more specific information if you ask about: main topics, key points, important dates, stakeholders, or any specific aspect of the document. (Note: Configure OpenAI API key for real AI responses)';
        
        for (const [key, value] of Object.entries(mockResponses)) {
          if (question.toLowerCase().includes(key.split(' ').slice(0, 3).join(' '))) {
            response = value + '\n\n(Mock response - Configure OpenAI API key for real AI analysis)';
            break;
          }
        }

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return res.json({
          answer: response,
          usage: { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 },
          mock: true
        });
      }

      // Build context for the AI
      let contextText = `Document: ${context.filename}\n`;
      
      if (context.summary) {
        contextText += `Summary: ${context.summary}\n`;
      }
      
      if (context.topics && context.topics.length > 0) {
        contextText += `Topics: ${context.topics.join(', ')}\n`;
      }
      
      if (context.entities && context.entities.length > 0) {
        const entityText = context.entities.map(e => `${e.name} (${e.type})`).join(', ');
        contextText += `Entities: ${entityText}\n`;
      }
      
      if (context.sentiment) {
        contextText += `Sentiment: ${context.sentiment.value} (${Math.round(context.sentiment.confidence * 100)}% confidence)\n`;
      }

      // Create the prompt for OpenAI
      const prompt = `You are an AI assistant helping analyze a document. Based on the following document information, please answer the user's question accurately and helpfully.

Document Information:
${contextText}

User Question: ${question}

Please provide a clear, concise, and helpful answer based on the document information provided. If the information isn't sufficient to answer the question, let the user know what additional details might be needed.`;

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant that analyzes documents and answers questions about their content. Be concise, accurate, and helpful in your responses."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      const answer = completion.choices[0].message.content;

      res.json({
        answer: answer,
        usage: completion.usage,
        mock: false
      });

    } catch (error) {
      console.error('OpenAI API Error:', error);
      
      if (error.status === 401) {
        res.status(401).json({ error: 'Invalid OpenAI API key. Please check your configuration.' });
      } else if (error.status === 429) {
        res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
      } else {
        res.status(500).json({ error: 'Failed to process AI request' });
      }
    }
  },

  async getInsights(req, res) {
    try {
      const { analysis } = req.body;

      // If no OpenAI API key, return mock insights
      if (!openai) {
        const mockInsights = `Analysis Quality Assessment:

1. **Content Completeness**: The document analysis appears comprehensive with identified topics and entities.

2. **Analysis Accuracy**: Current confidence levels suggest good automated processing, but human review is recommended.

3. **Missing Information**: Consider adding more specific domain terminology and checking for overlooked key concepts.

4. **Suggested Improvements**: 
   - Review entity classifications for accuracy
   - Validate topic relevance to document content
   - Confirm sentiment analysis matches document tone

5. **Potential Issues**: Some technical terms may need manual verification for proper categorization.

(Mock response - Configure OpenAI API key for real AI insights)`;

        await new Promise(resolve => setTimeout(resolve, 800));
        
        return res.json({
          insights: mockInsights,
          usage: { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 },
          mock: true
        });
      }

      const prompt = `Analyze this document analysis and provide 3-5 key insights or suggestions for improvement:

Summary: ${analysis.summary?.text || 'No summary provided'}
Topics: ${analysis.topics?.items?.join(', ') || 'No topics identified'}
Entities: ${analysis.entities?.items?.map(e => `${e.name} (${e.type})`).join(', ') || 'No entities identified'}
Sentiment: ${analysis.sentiment?.value || 'Unknown'} (${Math.round((analysis.sentiment?.confidence || 0) * 100)}% confidence)

Please provide actionable insights about:
1. Content completeness
2. Analysis accuracy
3. Missing information
4. Suggested improvements
5. Potential issues or concerns`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert document analyst. Provide concise, actionable insights about document analysis quality and completeness."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.7
      });

      const insights = completion.choices[0].message.content;

      res.json({
        insights: insights,
        usage: completion.usage,
        mock: false
      });

    } catch (error) {
      console.error('OpenAI Insights Error:', error);
      res.status(500).json({ error: 'Failed to generate insights' });
    }
  }
};
