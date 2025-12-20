// AI Service - OpenAI Integration with Fallback
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check if OpenAI API key is configured
const apiKey = process.env.OPENAI_API_KEY;
const hasOpenAI = apiKey && apiKey !== 'your_openai_api_key_here' && apiKey.startsWith('sk-');

let openai;
if (hasOpenAI) {
  try {
    openai = new OpenAI({
      apiKey: apiKey
    });
    console.log('✅ OpenAI API initialized in aiService');
  } catch (error) {
    console.log('⚠️  OpenAI initialization failed:', error.message);
  }
} else {
  console.log('⚠️  OpenAI API key not configured. Using mock responses.');
  console.log('   Current API key status:', apiKey ? 'Present but invalid' : 'Missing');
}

export const processWithAI = async (text, options = {}) => {
  const startTime = Date.now();
  
  try {
    if (!openai) {
      // Return mock data when OpenAI is not configured
      console.log('⚠️  OpenAI not available, using mock response');
      return generateMockResponse(text);
    }

    console.log('🤖 Processing with real OpenAI API...');

    // 1. Summarization
    const summary = options.summarize !== false ? await generateSummary(text) : null;
    
    // 2. Topic Extraction
    const topics = options.extractTopics !== false ? await extractTopics(text) : [];
    
    // 3. Entity Recognition
    const entities = options.findEntities ? await findEntities(text) : [];
    
    // 4. Sentiment Analysis
    const sentiment = options.analyzeSentiment !== false ? await analyzeSentiment(text) : null;
    
    // 5. Chunk text for vector storage
    const chunks = chunkText(text, 1000); // 1000 char chunks
    
    // 6. Generate embeddings for each chunk (limited to first 5 chunks)
    const chunksWithEmbeddings = await Promise.all(
      chunks.slice(0, 5).map(async (chunk) => ({
        text: chunk,
        embedding: await generateEmbedding(chunk),
        topics: []
      }))
    );
    
    return {
      summary,
      topics,
      entities,
      sentiment,
      confidence: 0.95,
      chunks: chunksWithEmbeddings,
      processingTime: Date.now() - startTime
    };
    
  } catch (error) {
    console.error('❌ AI processing error:', error.message);
    console.error('Error details:', error.response?.data || error.stack);
    // Return mock response on error
    return generateMockResponse(text);
  }
};

const generateMockResponse = (text) => {
  const wordCount = text.split(/\s+/).length;
  return {
    summary: `This document contains approximately ${wordCount} words. To enable full AI analysis with OpenAI, please configure your API key in the .env file.`,
    topics: ['Document Analysis', 'Content Overview', 'Text Processing'],
    entities: [],
    sentiment: 'neutral',
    confidence: 0.75,
    chunks: [{
      text: text.substring(0, 1000),
      embedding: Array(1536).fill(0).map(() => Math.random() - 0.5),
      topics: []
    }],
    processingTime: 100
  };
};

const generateSummary = async (text) => {
  console.log('📝 Generating summary with OpenAI...');
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional document analyzer. Generate a clear, informative 2-3 sentence summary. Do NOT say you cannot access the document - provide analysis based on the information given. Be confident and specific."
        },
        {
          role: "user",
          content: text.substring(0, 4000) // Limit token usage
        }
      ],
      max_tokens: 150
    });
    
    console.log('✅ Summary generated successfully');
    return response.choices[0].message.content;
  } catch (error) {
    console.error('❌ Summary generation failed:', error.message);
    throw error;
  }
};

const extractTopics = async (text) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system", 
        content: "Extract 3-5 main topics/themes from this text. Return ONLY a JSON array of strings, no other text or formatting."
      },
      {
        role: "user",
        content: text.substring(0, 2000)
      }
    ],
    max_tokens: 100
  });
  
  try {
    const content = response.choices[0].message.content.trim();
    // Remove markdown code blocks if present
    const jsonContent = content.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(jsonContent);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    console.error('Topic parsing error:', e.message);
    // Fallback: split by comma and clean up
    const content = response.choices[0].message.content.replace(/[\[\]"]/g, '');
    return content.split(',').map(t => t.trim()).filter(t => t.length > 0);
  }
};

const findEntities = async (text) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Extract named entities (people, organizations, locations) from this text. Return as JSON array of objects with 'name' and 'type' fields."
      },
      {
        role: "user", 
        content: text.substring(0, 2000)
      }
    ],
    max_tokens: 200
  });
  
  try {
    return JSON.parse(response.choices[0].message.content);
  } catch {
    return [];
  }
};

const analyzeSentiment = async (text) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Analyze the sentiment of this text. Return one word: 'positive', 'negative', or 'neutral'."
      },
      {
        role: "user",
        content: text.substring(0, 1000)
      }
    ],
    max_tokens: 10
  });
  
  return response.choices[0].message.content.toLowerCase().trim();
};

const generateEmbedding = async (text) => {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.substring(0, 8000) // Limit input length
  });
  
  return response.data[0].embedding;
};

const chunkText = (text, maxLength) => {
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.substring(i, i + maxLength));
  }
  return chunks;
};
