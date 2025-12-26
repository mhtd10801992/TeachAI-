// AI Service - Google AI Integration
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from the root of backend
dotenv.config({ path: path.join(__dirname, '../.env') });

// Check if Google AI API key is configured
const apiKey = process.env.GOOGLE_AI_API_KEY;
console.log('🔑 Google AI API Key check:', {
  exists: !!apiKey,
  length: apiKey?.length,
  first10: apiKey?.substring(0, 10)
});

let googleAI;
if (apiKey) {
  try {
    googleAI = new GoogleGenerativeAI(apiKey);
    console.log('✅ Google AI API initialized in aiService [VERIFIED LOADED]');
  } catch (error) {
    console.log('⚠️  Google AI initialization failed:', error.message);
  }
} else {
  console.log('⚠️  Google AI API key not configured. Using mock responses.');
}

async function runGoogleAI(prompt, modelName = "gemini-2.0-flash") {
  if (!googleAI) {
      if (process.env.GOOGLE_AI_API_KEY) {
          googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
      } else {
          throw new Error("Google AI API not initialized");
      }
  }
  const model = googleAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export const processWithAI = async (text, options = {}) => {
  const startTime = Date.now();
  
  try {
    if (!googleAI) {
      if (process.env.GOOGLE_AI_API_KEY) {
          googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
      } else {
          throw new Error('Google AI API Key is missing! Please check .env file.');
      }
    }

    console.log('🤖 Processing FULL document with comprehensive Google AI analysis...');

    // 1. Comprehensive Summarization
    const summary = options.summarize !== false ? await generateSummary(text) : null;
    
    // 2. Detailed Topic Extraction
    const topics = options.extractTopics !== false ? await extractTopics(text) : [];
    
    // 3. Entity Recognition
    const entities = options.findEntities ? await findEntities(text) : [];
    
    // 4. Sentiment Analysis
    const sentiment = options.analyzeSentiment !== false ? await analyzeSentiment(text) : null;
    
    // 5. Key Insights & Findings
    const insights = await extractKeyInsights(text);
    
    // 6. Section Breakdown
    const sections = await analyzeSections(text);
    
    // 7. Validation Points
    const validationPoints = await identifyValidationPoints(text, { summary, topics, entities });
    
    // 8. Full document preservation with highlights
    const documentWithHighlights = await highlightDocument(text, validationPoints);
    
    // 9. Chunk text for vector storage
    const chunks = chunkText(text, 1000);
    
    // 10. Generate embeddings
    const chunksWithEmbeddings = await Promise.all(
      chunks.map(async (chunk, index) => ({
        text: chunk,
        embedding: await generateEmbedding(chunk),
        index: index,
        needsReview: validationPoints.some(vp => 
          vp.location >= index * 1000 && vp.location < (index + 1) * 1000
        )
      }))
    );
    
    return {
      summary,
      topics,
      entities,
      sentiment,
      insights,
      sections,
      validationPoints,
      documentWithHighlights,
      originalText: text,
      confidence: 0.95,
      chunks: chunksWithEmbeddings,
      processingTime: Date.now() - startTime
    };
    
  } catch (error) {
    console.error('❌ AI processing error DETAILED:', error);
    // Return error details instead of mock response to debug
    return {
        summary: `I AM A DEBUG ERROR: ${error.message}`,
        topics: [],
        entities: [],
        sentiment: 'error',
        confidence: 0,
        chunks: [],
        processingTime: 0
    };
  }
};

const generateSummary = async (text) => {
  console.log('📝 Generating comprehensive summary with Google AI...');
  try {
    const prompt = `You are a professional document analyzer. Generate a comprehensive, detailed summary covering all major points, sections, and findings. Include: 1) Main theme/purpose, 2) Key findings/arguments, 3) Important details and data, 4) Conclusions. Be thorough and specific.\n\nDocument Text:\n${text.substring(0, 30000)}`; 
    
    return await runGoogleAI(prompt);
  } catch (error) {
    console.error('❌ Summary generation failed:', error.message);
    throw error;
  }
};

const extractTopics = async (text) => {
  const prompt = `Extract 8-12 comprehensive topics/themes from this text covering all major sections and concepts. Return ONLY a JSON array of strings, no other text or formatting.\n\nText:\n${text.substring(0, 30000)}`;
  
  try {
    const content = await runGoogleAI(prompt);
    const jsonContent = content.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(jsonContent);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    console.error('Topic parsing error:', e.message);
    return [];
  }
};

const findEntities = async (text) => {
  const prompt = `Extract named entities (people, organizations, locations) from this text. Return as JSON array of objects with 'name' and 'type' fields.\n\nText:\n${text.substring(0, 10000)}`;
  
  try {
    const content = await runGoogleAI(prompt);
    const jsonContent = content.replace(/```json\n?|```\n?/g, '').trim();
    return JSON.parse(jsonContent);
  } catch {
    return [];
  }
};

const analyzeSentiment = async (text) => {
  const prompt = `Analyze the sentiment of this text. Return one word: 'positive', 'negative', or 'neutral'.\n\nText:\n${text.substring(0, 5000)}`;
  try {
      const content = await runGoogleAI(prompt);
      return content.toLowerCase().trim();
  } catch {
      return 'neutral';
  }
};

const generateEmbedding = async (text) => {
  try {
    const model = googleAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text.substring(0, 2048)); 
    return result.embedding.values;
  } catch (error) {
    console.error('Embedding generation error:', error.message);
    return Array(768).fill(0); 
  }
};

const chunkText = (text, maxLength) => {
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.substring(i, i + maxLength));
  }
  return chunks;
};

const extractKeyInsights = async (text) => {
  const prompt = `Extract 5-8 key insights, findings, or conclusions from this document. Focus on actionable information, important data points, and critical conclusions. Return as JSON array of objects with 'insight' and 'importance' (high/medium/low) fields.\n\nText:\n${text.substring(0, 30000)}`;
  try {
    const content = await runGoogleAI(prompt);
    const jsonContent = content.replace(/```json\n?|```\n?/g, '').trim();
    return JSON.parse(jsonContent);
  } catch (error) {
    console.error('Insights extraction error:', error.message);
    return [];
  }
};

const analyzeSections = async (text) => {
  const prompt = `Analyze the document structure and identify major sections. For each section, provide: 'title', 'summary' (brief), and 'keyPoints' (array). Return as JSON array.\n\nText:\n${text.substring(0, 30000)}`;
  try {
    const content = await runGoogleAI(prompt);
    const jsonContent = content.replace(/```json\n?|```\n?/g, '').trim();
    return JSON.parse(jsonContent);
  } catch (error) {
    console.error('Section analysis error:', error.message);
    return [];
  }
};

const identifyValidationPoints = async (text, analysis) => {
  const prompt = `You are reviewing a document analysis. Identify parts that need human validation:
1. Ambiguous or unclear statements
2. Critical data/numbers that should be verified
3. Conflicting information
4. Important dates, names, or figures
5. Technical terms needing clarification

For each point, provide:
- 'text': the exact text snippet (keep it short, 10-20 words)
- 'reason': why it needs validation
- 'suggestion': what to check or possible interpretations
- 'priority': high/medium/low
- 'location': approximate character position in document

Return as JSON array of validation points.

Document excerpt:\n${text.substring(0, 15000)}\n\nAnalysis Summary: ${analysis.summary}`;

  try {
    const content = await runGoogleAI(prompt);
    const jsonContent = content.replace(/```json\n?|```\n?/g, '').trim();
    const validationPoints = JSON.parse(jsonContent);
    
    return validationPoints.map(vp => ({
      ...vp,
      id: Math.random().toString(36).substr(2, 9),
      resolved: false
    }));
  } catch (error) {
    console.error('Validation points error:', error.message);
    return [];
  }
};

const highlightDocument = async (text, validationPoints) => {
  return {
    fullText: text,
    highlights: validationPoints.map(vp => ({
      id: vp.id,
      start: vp.location,
      end: vp.location + (vp.text?.length || 50),
      text: vp.text,
      reason: vp.reason,
      priority: vp.priority
    }))
  };
};