// Query/Search Service - How users interact with processed documents
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const index = pinecone.index(process.env.PINECONE_INDEX);

export const searchDocuments = async (query, options = {}) => {
  try {
    // 1. Convert user question to embedding
    const queryEmbedding = await generateQueryEmbedding(query);
    
    // 2. Search similar content in vector database
    const searchResults = await index.query({
      vector: queryEmbedding,
      topK: options.topK || 5,
      includeMetadata: true,
      includeValues: false
    });
    
    // 3. Get relevant text chunks
    const relevantChunks = searchResults.matches.map(match => ({
      text: match.metadata.text,
      document: match.metadata.filename,
      similarity: match.score,
      topics: match.metadata.topics
    }));
    
    // 4. Generate AI answer using retrieved context
    const aiAnswer = await generateAnswer(query, relevantChunks);
    
    return {
      query,
      answer: aiAnswer,
      sources: relevantChunks,
      confidence: calculateConfidence(searchResults.matches),
      processingTime: Date.now() - startTime
    };
    
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
};

const generateQueryEmbedding = async (query) => {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query
  });
  
  return response.data[0].embedding;
};

const generateAnswer = async (question, context) => {
  const contextText = context
    .map(chunk => `[${chunk.document}]: ${chunk.text}`)
    .join('\n\n');
    
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant that answers questions based on provided document context. 
        Use only the information from the context to answer questions. 
        If the context doesn't contain enough information, say so.
        Always cite which document(s) you're referencing.`
      },
      {
        role: "user",
        content: `Context:\n${contextText}\n\nQuestion: ${question}`
      }
    ],
    max_tokens: 500
  });
  
  return response.choices[0].message.content;
};

const calculateConfidence = (matches) => {
  if (matches.length === 0) return 0;
  
  const avgScore = matches.reduce((sum, match) => sum + match.score, 0) / matches.length;
  return Math.round(avgScore * 100) / 100;
};

// Example usage in route:
/*
app.post('/api/search', async (req, res) => {
  try {
    const { query, topK = 5 } = req.body;
    
    const results = await searchDocuments(query, { topK });
    
    res.json({
      success: true,
      results
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Search failed',
      details: error.message
    });
  }
});
*/
