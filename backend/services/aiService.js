// Extract linked information as Mermaid code
export const extractMermaidGraph = async (text) => {
  const prompt = `Read the following document and extract all possible linked information, relationships, or dependencies as a node-link diagram. Output the result as a valid Mermaid 'graph TD' code block. Use clear, concise node names and show all relevant links.\n\nDocument Text:\n${text.substring(0, 30000)}\n\nReturn ONLY the Mermaid code, nothing else.`;
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 512
    });
    // Extract only the code block
    const content = response.choices[0].message.content;
    const match = content.match(/```mermaid([\s\S]*?)```/i);
    if (match) return match[1].trim();
    return content.trim();
  } catch (e) {
    console.error('Mermaid graph extraction error:', e.message);
    return '';
  }
};

// Extract factor list as a design of experiment
export const extractDOEFactors = async (text) => {
  const prompt = `Read the following document and extract all factors, variables, or parameters that could be used in a design of experiments (DOE) for process or product optimization. For each factor, provide its name, possible levels/values, and a brief description if available. Return ONLY a JSON array of objects: [{ name, levels, description }], no other text.\n\nDocument Text:\n${text.substring(0, 30000)}`;
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 512
    });
    const content = response.choices[0].message.content;
    const jsonContent = content.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(jsonContent);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    console.error('DOE factor extraction error:', e.message);
    return [];
  }
};
// Extract actionable steps from a document, with industry-specific and cost-saving focus
export const extractActionableSteps = async (text) => {
  const prompt = `You are an expert business analyst for the automobile industry. Carefully read the entire document and extract all important, practical, and workable actions, strategies, or recommendations that a user or company can implement. Focus especially on:
- Cost-saving strategies
- Operational efficiency improvements
- Process optimizations
- Any actionable steps relevant to the automobile industry
- Any general business actions that can be applied

For each action, be thorough and specific. If the document contains information that can be used for cost reduction, process improvement, or strategic advantage, include it as an actionable item. Return ONLY a JSON array of strings, no other text or formatting.

Document Text:\n${text.substring(0, 30000)}`;
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 512
    });
    const content = response.choices[0].message.content;
    const jsonContent = content.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(jsonContent);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    console.error('Actionable steps extraction error:', e.message);
    return [];
  }
};
// AI Service - OpenAI Integration

import OpenAI from 'openai';

export const processWithAI = async (text, options = {}) => {
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Input text is required and must be a non-empty string.');
  }
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
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = `You are a professional document analyzer. Generate a comprehensive, detailed summary covering all major points, sections, and findings. Include: 1) Main theme/purpose, 2) Key findings/arguments, 3) Important details and data, 4) Conclusions. Be thorough and specific.\n\nDocument Text:\n${text.substring(0, 30000)}`;
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 512
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('❌ Summary generation failed:', error.message);
    throw error;
  }
};

const extractTopics = async (text) => {
  const prompt = `Extract 8-12 comprehensive topics/themes from this text covering all major sections and concepts. Return ONLY a JSON array of strings, no other text or formatting.\n\nText:\n${text.substring(0, 30000)}`;
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 256
    });
    const content = response.choices[0].message.content;
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
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 256
    });
    const content = response.choices[0].message.content;
    const jsonContent = content.replace(/```json\n?|```\n?/g, '').trim();
    return JSON.parse(jsonContent);
  } catch {
    return [];
  }
};

const analyzeSentiment = async (text) => {
  const prompt = `Analyze the sentiment of this text. Return one word: 'positive', 'negative', or 'neutral'.\n\nText:\n${text.substring(0, 5000)}`;
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 10
    });
    return response.choices[0].message.content.toLowerCase().trim();
  } catch {
    return 'neutral';
  }
};

const generateEmbedding = async (text) => {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text.substring(0, 2048)
    });
    return response.data[0].embedding;
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
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 256
    });
    const content = response.choices[0].message.content;
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
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 512
    });
    const content = response.choices[0].message.content;
    const jsonContent = content.replace(/```json\n?|```\n?/g, '').trim();
    return JSON.parse(jsonContent);
  } catch (error) {
    console.error('Section analysis error:', error.message);
    return [];
  }
};

const identifyValidationPoints = async (text, analysis) => {
  const prompt = `You are reviewing a document analysis. Identify parts that need human validation:\n1. Ambiguous or unclear statements\n2. Critical data/numbers that should be verified\n3. Conflicting information\n4. Important dates, names, or figures\n5. Technical terms needing clarification\n\nFor each point, provide:\n- 'text': the exact text snippet (keep it short, 10-20 words)\n- 'reason': why it needs validation\n- 'suggestion': what to check or possible interpretations\n- 'priority': high/medium/low\n- 'location': approximate character position in document\n\nReturn as JSON array of validation points.\n\nDocument excerpt:\n${text.substring(0, 15000)}\n\nAnalysis Summary: ${analysis.summary}`;
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 512
    });
    const content = response.choices[0].message.content;
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