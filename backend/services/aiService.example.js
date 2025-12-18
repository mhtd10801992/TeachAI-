// AI Service - OpenAI Integration Example
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const processWithAI = async (text, options = {}) => {
  const startTime = Date.now();
  
  try {
    // 1. Summarization
    const summary = options.summarize ? await generateSummary(text) : null;
    
    // 2. Topic Extraction
    const topics = options.extractTopics ? await extractTopics(text) : [];
    
    // 3. Entity Recognition
    const entities = options.findEntities ? await findEntities(text) : [];
    
    // 4. Sentiment Analysis
    const sentiment = options.analyzeSentiment ? await analyzeSentiment(text) : null;
    
    // 5. Chunk text for vector storage
    const chunks = chunkText(text, 1000); // 1000 char chunks
    
    // 6. Generate embeddings for each chunk
    const chunksWithEmbeddings = await Promise.all(
      chunks.map(async (chunk) => ({
        text: chunk,
        embedding: await generateEmbedding(chunk),
        topics: await extractTopics(chunk)
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
    console.error('AI processing error:', error);
    throw error;
  }
};

const generateSummary = async (text) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "Summarize the following document in 2-3 concise sentences, focusing on key points and main themes."
      },
      {
        role: "user",
        content: text.substring(0, 4000) // Limit token usage
      }
    ],
    max_tokens: 150
  });
  
  return response.choices[0].message.content;
};

const extractTopics = async (text) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system", 
        content: "Extract 3-5 main topics/themes from this text. Return as JSON array of strings."
      },
      {
        role: "user",
        content: text.substring(0, 2000)
      }
    ],
    max_tokens: 100
  });
  
  try {
    return JSON.parse(response.choices[0].message.content);
  } catch {
    return response.choices[0].message.content.split(',').map(t => t.trim());
  }
};

const findEntities = async (text) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
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
    model: "gpt-4",
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
    input: text
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
