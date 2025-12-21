// AI Service - OpenAI Integration with Fallback
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables (only works locally, Cloud Run uses secrets directly)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Check if OpenAI API key is configured
const apiKey = process.env.OPENAI_API_KEY;
console.log('🔑 OpenAI API Key check:', {
  exists: !!apiKey,
  length: apiKey?.length,
  startsWithSk: apiKey?.startsWith('sk-'),
  first10: apiKey?.substring(0, 10)
});
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

    console.log('🤖 Processing FULL document with comprehensive AI analysis...');

    // 1. Comprehensive Summarization (full document)
    const summary = options.summarize !== false ? await generateSummary(text) : null;
    
    // 2. Detailed Topic Extraction (more topics)
    const topics = options.extractTopics !== false ? await extractTopics(text) : [];
    
    // 3. Entity Recognition
    const entities = options.findEntities ? await findEntities(text) : [];
    
    // 4. Sentiment Analysis
    const sentiment = options.analyzeSentiment !== false ? await analyzeSentiment(text) : null;
    
    // 5. NEW: Key Insights & Findings
    const insights = await extractKeyInsights(text);
    
    // 6. NEW: Section Breakdown
    const sections = await analyzeSections(text);
    
    // 7. NEW: Validation Points (AI highlights uncertain/important parts)
    const validationPoints = await identifyValidationPoints(text, { summary, topics, entities });
    
    // 8. NEW: Full document preservation with highlights
    const documentWithHighlights = await highlightDocument(text, validationPoints);
    
    // 9. Chunk text for vector storage (more chunks for full coverage)
    const chunks = chunkText(text, 1000);
    
    // 10. Generate embeddings for ALL chunks (not just first 5)
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
      insights, // NEW
      sections, // NEW
      validationPoints, // NEW
      documentWithHighlights, // NEW: Full document with AI highlights
      originalText: text, // NEW: Preserve full document
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
  console.log('📝 Generating comprehensive summary with OpenAI...');
  try {
    // Process FULL document, not just first 4000 chars
    // For very long documents, we'll chunk and summarize
    const maxChunkSize = 12000; // ~3000 tokens
    
    if (text.length <= maxChunkSize) {
      // Single pass for smaller documents
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional document analyzer. Generate a comprehensive, detailed summary covering all major points, sections, and findings. Include: 1) Main theme/purpose, 2) Key findings/arguments, 3) Important details and data, 4) Conclusions. Be thorough and specific."
          },
          {
            role: "user",
            content: text
          }
        ],
        max_tokens: 800 // Much longer, detailed summary
      });
      
      return response.choices[0].message.content;
    } else {
      // Multi-pass for longer documents
      const chunks = chunkText(text, maxChunkSize);
      const chunkSummaries = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are analyzing part ${i + 1} of ${chunks.length} of a document. Summarize this section in detail, preserving key information.`
            },
            {
              role: "user",
              content: chunks[i]
            }
          ],
          max_tokens: 400
        });
        chunkSummaries.push(response.choices[0].message.content);
      }
      
      // Synthesize all chunk summaries into final comprehensive summary
      const finalResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Synthesize these section summaries into a comprehensive document summary covering all key points."
          },
          {
            role: "user",
            content: chunkSummaries.join('\n\n---\n\n')
          }
        ],
        max_tokens: 800
      });
      
      return finalResponse.choices[0].message.content;
    }
    
    console.log('✅ Comprehensive summary generated successfully');
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
        content: "Extract 8-12 comprehensive topics/themes from this text covering all major sections and concepts. Return ONLY a JSON array of strings, no other text or formatting."
      },
      {
        role: "user",
        content: text.substring(0, 8000) // Analyze much more of the document
      }
    ],
    max_tokens: 250 // More tokens for more topics
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
// NEW: Extract key insights and findings from document
const extractKeyInsights = async (text) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Extract 5-8 key insights, findings, or conclusions from this document. Focus on actionable information, important data points, and critical conclusions. Return as JSON array of objects with 'insight' and 'importance' (high/medium/low) fields."
        },
        {
          role: "user",
          content: text.substring(0, 8000)
        }
      ],
      max_tokens: 400
    });
    
    const content = response.choices[0].message.content.trim();
    const jsonContent = content.replace(/```json\n?|```\n?/g, '').trim();
    return JSON.parse(jsonContent);
  } catch (error) {
    console.error('Insights extraction error:', error.message);
    return [];
  }
};

// NEW: Analyze document sections and structure
const analyzeSections = async (text) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Analyze the document structure and identify major sections. For each section, provide: 'title', 'summary' (brief), and 'keyPoints' (array). Return as JSON array."
        },
        {
          role: "user",
          content: text.substring(0, 10000)
        }
      ],
      max_tokens: 600
    });
    
    const content = response.choices[0].message.content.trim();
    const jsonContent = content.replace(/```json\n?|```\n?/g, '').trim();
    return JSON.parse(jsonContent);
  } catch (error) {
    console.error('Section analysis error:', error.message);
    return [];
  }
};

// NEW: Identify validation points (AI highlights uncertain or important parts)
const identifyValidationPoints = async (text, analysis) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are reviewing a document analysis. Identify parts that need human validation:
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

Return as JSON array of validation points.`
        },
        {
          role: "user",
          content: `Document excerpt:\n${text.substring(0, 8000)}\n\nAnalysis:\nSummary: ${analysis.summary}\nTopics: ${JSON.stringify(analysis.topics)}`
        }
      ],
      max_tokens: 800
    });
    
    const content = response.choices[0].message.content.trim();
    const jsonContent = content.replace(/```json\n?|```\n?/g, '').trim();
    const validationPoints = JSON.parse(jsonContent);
    
    // Add suggestions for each validation point
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

// NEW: Highlight document with validation markers
const highlightDocument = async (text, validationPoints) => {
  // Return document with markers for validation points
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