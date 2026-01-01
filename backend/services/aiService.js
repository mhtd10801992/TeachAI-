import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { chunkDocument } from './chunkingService.js';

// Provider / model configuration
const AI_PROVIDER = (process.env.AI_PROVIDER || 'openai').toLowerCase();
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229';

// Simple chat abstraction that can talk to OpenAI or Anthropic
const runChat = async (prompt, { maxTokens = 512 } = {}) => {
  if (AI_PROVIDER === 'anthropic') {
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const anthropic = new Anthropic({ apiKey: anthropicApiKey });
    const msg = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    const textParts = (msg.content || [])
      .filter((c) => c.type === 'text')
      .map((c) => c.text || '');

    return textParts.join('').trim();
  }

  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const openai = new OpenAI({ apiKey: openaiApiKey });
  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
  });

  return response.choices[0].message.content.trim();
};

// Extract linked information as Mermaid code
export const extractMermaidGraph = async (text) => {
  const prompt = `Read the following document and extract all possible linked information, relationships, or dependencies as a node-link diagram. Output the result as a valid Mermaid 'graph TD' code block. Use clear, concise node names and show all relevant links.\n\nDocument Text:\n${text.substring(0, 30000)}\n\nReturn ONLY the Mermaid code, nothing else.`;
  try {
    const content = await runChat(prompt, { maxTokens: 512 });
    // Extract only the code block
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
    const content = await runChat(prompt, { maxTokens: 512 });
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
  const prompt = `You are an expert process engineer and business analyst specializing in case study analysis and experimental design. Analyze the provided document for case studies, experiments, research findings, or practical implementations.

Your task is to create a comprehensive ACTIONABLE PROCESS FLOW that transforms the insights from case studies and experiments into implementable business processes.

Focus on:
1. **Case Study Analysis**: Identify successful methodologies, experimental results, and proven approaches
2. **Process Flow Creation**: Design step-by-step implementation processes based on the findings
3. **Experimental Validation**: Extract validated methods and experimental procedures that can be replicated
4. **Business Implementation**: Create actionable workflows that companies can follow
5. **Optimization Strategies**: Identify process improvements and efficiency gains from the case studies

Structure your response as a JSON array where each item represents a complete process flow with:
- A descriptive title for the process
- Step-by-step implementation guide
- Expected outcomes and success metrics
- Required resources or prerequisites
- Risk mitigation strategies

Return ONLY a JSON array of objects with this structure:
[
  {
    "title": "Process Flow Title",
    "steps": ["Step 1", "Step 2", "Step 3"],
    "outcomes": ["Expected outcome 1", "Expected outcome 2"],
    "resources": ["Required resource 1", "Required resource 2"],
    "risks": ["Potential risk 1", "Mitigation strategy"]
  }
]

Document Text:\n${text.substring(0, 30000)}`;
  try {
    const content = await runChat(prompt, { maxTokens: 512 });
    let jsonContent = content.replace(/```json\n?|```\n?/g, '').trim();

    // Try to isolate the main JSON array if there is extra text
    const arrayMatch = jsonContent.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      jsonContent = arrayMatch[0];
    }

    // Remove trailing commas before closing braces/brackets
    jsonContent = jsonContent.replace(/,\s*([}\]])/g, '$1');

    let parsed;
    try {
      parsed = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Actionable steps JSON parse error, attempting recovery:', parseError.message);

      // Fallback: extract individual objects and parse them one by one
      const objects = jsonContent.match(/\{[\s\S]*?\}/g) || [];
      const items = [];
      for (const obj of objects) {
        try {
          const cleanedObj = obj.replace(/,\s*([}\]])/g, '$1');
          const parsedObj = JSON.parse(cleanedObj);
          items.push(parsedObj);
        } catch {
          // Skip objects that still fail to parse
        }
      }
      return items;
    }

    const array = Array.isArray(parsed) ? parsed : [parsed];
    return array;
  } catch (e) {
    console.error('Actionable steps extraction error:', e.message);
    return [];
  }
};

// Extract concepts and relationships in a strict knowledge-graph JSON schema
export const extractConceptGraph = async (text) => {
  const prompt = `You are an expert research analyst. Extract all meaningful concepts from the following text and return them in the JSON schema provided.

Guidelines:
- Use short, precise concept names.
- Only include concepts that are meaningful and non-trivial.
- Include definitions only if explicitly stated or strongly implied.
- Include examples only if they appear in the text.
- Use "related_to" for conceptual similarity.
- Use "depends_on" for prerequisites or logical dependencies.
- Use "contrasts_with" for opposing ideas.
- Use "evidence" for data, citations, or arguments that support the concept.
- Use "open_questions" for unresolved issues or future research directions.
- Do NOT invent information.
- Return ONLY valid JSON.

JSON Schema:
{
  "concepts": [
    {
      "name": "",
      "type": "core | supporting | example | definition | method | metric | assumption | limitation",
      "definition": "",
      "examples": [],
      "related_to": [],
      "depends_on": [],
      "contrasts_with": [],
      "evidence": [],
      "open_questions": []
    }
  ]
}

IMPORTANT:
- "type" must be one of: core, supporting, example, definition, method, metric, assumption, limitation
- All array fields must be arrays of strings (may be empty)
- Focus on the 10-25 most important concepts
- Ensure all JSON is properly formatted with no trailing commas

Text (truncated to first 30k characters):
${text.substring(0, 30000)}

Return ONLY the JSON, no additional text or markdown.`;

  try {
    const content = await runChat(prompt, { maxTokens: 900 });

    // Strip markdown fences and try to isolate the JSON object
    let jsonContent = content.replace(/```json\n?|```\n?/g, '').trim();

    // If there is extra prose around the JSON, grab the first {...} block
    const braceMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      jsonContent = braceMatch[0];
    }

    // Remove common trailing commas that can break JSON.parse
    jsonContent = jsonContent.replace(/,\s*([}\]])/g, '$1');

    let parsed;
    try {
      parsed = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Concept graph JSON parse error, attempting recovery:', parseError.message);

      // Fallback: try to recover concepts array manually
      const conceptsMatch = jsonContent.match(/"concepts"\s*:\s*\[([\s\S]*)\]/);
      if (conceptsMatch) {
        const arrayBody = conceptsMatch[1];
        const objectStrings = arrayBody.match(/\{[\s\S]*?\}/g) || [];
        const concepts = [];
        for (const objStr of objectStrings) {
          try {
            const cleanedObj = objStr.replace(/,\s*([}\]])/g, '$1');
            const c = JSON.parse(cleanedObj);
            concepts.push(c);
          } catch {
            // Skip invalid concept objects
          }
        }
        return { concepts };
      }

      // If we can't recover, rethrow to be handled by outer catch
      throw parseError;
    }

    // Basic shape enforcement
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.concepts)) {
      return { concepts: [] };
    }

    // Normalize each concept to ensure required keys exist
    const normalizeArray = (value) => {
      if (!Array.isArray(value)) return [];
      return value.map((v) => (typeof v === 'string' ? v : String(v))).filter((v) => v.trim().length > 0);
    };

    const allowedTypes = [
      'core',
      'supporting',
      'example',
      'definition',
      'method',
      'metric',
      'assumption',
      'limitation',
    ];

    const concepts = parsed.concepts.map((c) => {
      const name = (c && typeof c.name === 'string' ? c.name : '').trim();
      const definition = (c && typeof c.definition === 'string' ? c.definition : '').trim();
      const type = allowedTypes.includes(c?.type) ? c.type : 'supporting';

      return {
        name,
        type,
        definition,
        examples: normalizeArray(c?.examples),
        related_to: normalizeArray(c?.related_to),
        depends_on: normalizeArray(c?.depends_on),
        contrasts_with: normalizeArray(c?.contrasts_with),
        evidence: normalizeArray(c?.evidence),
        open_questions: normalizeArray(c?.open_questions),
      };
    });

    return { concepts };
  } catch (error) {
    console.error('Concept graph extraction error:', error.message);
    return { concepts: [] };
  }
};

// Infer explicit relationships between previously extracted concepts (Layer 3)
export const inferConceptRelationships = async (concepts, text = '') => {
  const safeConcepts = Array.isArray(concepts) ? concepts.slice(0, 40) : [];

  // Prepare concept list for prompt - only include essential fields
  const conceptList = safeConcepts.map(c => ({
    name: c.name,
    type: c.type,
    definition: c.definition || ''
  }));

  const prompt = `You are an expert in knowledge graph construction. Given the following list of concepts extracted from a document, infer additional relationships between them.

Guidelines:
- Identify parent-child relationships (hierarchical structure).
- Identify cause-effect relationships (one concept leads to or influences another).
- Identify example-of relationships (one concept is an instance or example of another).
- Identify part-of relationships (one concept is a component of another).
- Identify contradictions or contrasts (opposing or conflicting concepts).
- Identify dependencies or prerequisites (one concept requires another).
- Use "related_to" for general conceptual similarity.
- Do NOT invent new concepts; only link existing ones from the list below.
- Use the concept "name" field exactly as written for source and target.
- Return ONLY valid JSON with no markdown, comments, or extra text.

JSON Schema:
{
  "relationships": [
    {
      "from": "Concept name A",
      "to": "Concept name B",
      "type": "related_to | depends_on | contrasts_with | example_of | part_of | causes | caused_by | parent_child",
      "description": "Brief explanation of the relationship",
      "evidence": "Supporting evidence from the document if available"
    }
  ]
}

Concept List:
${JSON.stringify(conceptList, null, 2)}

Optional document context (truncated):
${(text || '').substring(0, 12000)}

Return ONLY the JSON, no additional text.`;

  try {
    const content = await runChat(prompt, { maxTokens: 900 });
    const jsonContent = content.replace(/```json\n?|```\n?/g, '').trim();
    
    // Try to extract JSON from the response
    const braceMatch = jsonContent.match(/\{[\s\S]*\}/);
    const cleanJson = braceMatch ? braceMatch[0] : jsonContent;
    
    const parsed = JSON.parse(cleanJson);

    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.relationships)) {
      return { relationships: [] };
    }

    const allowedTypes = [
      'related_to',
      'depends_on',
      'contrasts_with',
      'example_of',
      'part_of',
      'causes',
      'caused_by',
      'parent_child'
    ];

    const normalizeString = (value) => {
      if (typeof value === 'string') return value.trim();
      if (value == null) return '';
      return String(value).trim();
    };

    // Build concept index for enrichment
    const conceptIndex = new Map();
    for (const concept of safeConcepts) {
      if (concept && concept.name) {
        if (!conceptIndex.has(concept.name)) {
          conceptIndex.set(concept.name, []);
        }
        conceptIndex.get(concept.name).push(concept);
      }
    }

    const relationships = parsed.relationships
      .map((rel) => {
        const from = normalizeString(rel?.from);
        const to = normalizeString(rel?.to);
        if (!from || !to) return null;

        const type = allowedTypes.includes(rel?.type) ? rel.type : 'related_to';
        const description = normalizeString(rel?.description);
        const evidence = normalizeString(rel?.evidence);

        // Enrich with metadata from concepts
        const sourceMeta = conceptIndex.get(from) || [];
        const targetMeta = conceptIndex.get(to) || [];

        return { 
          from, 
          to, 
          type, 
          description, 
          evidence,
          sourceMeta: sourceMeta.map(c => ({
            type: c.type,
            definition: c.definition,
            sourceChunk: c.sourceChunk
          })),
          targetMeta: targetMeta.map(c => ({
            type: c.type,
            definition: c.definition,
            sourceChunk: c.sourceChunk
          }))
        };
      })
      .filter(Boolean);

    return { relationships };
  } catch (error) {
    console.error('Concept relationship inference error:', error.message);
    return { relationships: [] };
  }
};

// Explain a single section in the context of the whole document
export const explainSectionInContext = async ({
  sectionTitle,
  sectionText,
  documentTitle,
  documentSummary
}) => {
  const prompt = `You are a senior research mentor helping a learner understand one section of a technical document.

Document title: ${documentTitle || 'Unknown'}
Overall summary (if available): ${documentSummary || 'Not provided'}

Section title: ${sectionTitle || 'Untitled section'}
Section content:
"""
${(sectionText || '').substring(0, 8000)}
"""

Explain this section in the context of the whole document. Your response should have three parts:
1. Overview – 2-3 sentences in plain language describing what this section is about and why it matters.
2. Key Points – a bullet list of the 3-6 most important ideas or claims in this section.
3. Relation to Document – 1-2 sentences explaining how this section connects to the overall document purpose or argument.

Use clear, non-academic language but keep the technical meaning correct.`;

  try {
    const content = await runChat(prompt, { maxTokens: 600 });
    return content.trim();
  } catch (error) {
    console.error('Section explanation error:', error.message);
    throw error;
  }
};

// AI Service - uses OpenAI by default, Anthropic (Claude) when configured
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
    // 5. Advanced chunking pipeline (fallbacks to simple chunking when structural blocks are unavailable)
    let finalChunks = [];
    try {
      // For now we treat the whole document as a single paragraph block; later this
      // can be replaced with real parser blocks when available.
      const pseudoBlocks = [
        {
          id: 'block_1',
          type: 'paragraph',
          text,
          level: 1,
          page: 1
        }
      ];

      const advancedChunks = await chunkDocument(pseudoBlocks, {
        minTokens: 80,
        maxTokens: 400,
        similarityThreshold: 0.75
      });

      if (Array.isArray(advancedChunks) && advancedChunks.length > 0) {
        finalChunks = advancedChunks;
      }
    } catch (chunkError) {
      console.error('Advanced chunking failed, falling back to simple chunking:', chunkError.message);
    }

    if (!finalChunks.length) {
      const chunks = chunkText(text, 1000); // 1000 char fallback chunks
      finalChunks = chunks.map((chunk, index) => ({
        chunkId: `fallback_${index + 1}`,
        text: chunk,
        tokenCount: chunk.length,
        headingPath: [],
        pageRange: [],
        blockIds: []
      }));
    }

    // 6. Generate embeddings for each chunk (using finalChunks)
    const chunksWithEmbeddings = await Promise.all(
      finalChunks.map(async (chunk) => ({
        ...chunk,
        embedding: await generateEmbedding(chunk.text || ''),
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
    const prompt = `You are a professional document analyzer. Generate a comprehensive, detailed summary covering all major points, sections, and findings. Include: 1) Main theme/purpose, 2) Key findings/arguments, 3) Important details and data, 4) Conclusions. Be thorough and specific.\n\nDocument Text:\n${text.substring(0, 30000)}`;
    const content = await runChat(prompt, { maxTokens: 512 });
    return content.trim();
  } catch (error) {
    console.error('❌ Summary generation failed:', error.message);
    throw error;
  }
};

const extractTopics = async (text) => {
  const prompt = `Extract 8-12 comprehensive topics/themes from this text covering all major sections and concepts. Return ONLY a JSON array of strings, no other text or formatting.\n\nText:\n${text.substring(0, 30000)}`;
  try {
    const content = await runChat(prompt, { maxTokens: 256 });
    console.log('📝 Raw topic response:', content);
    const jsonContent = content.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(jsonContent);
    const result = Array.isArray(parsed) ? parsed : [parsed];
    console.log('✅ Topics extracted:', result);
    return result;
  } catch (e) {
    console.error('❌ Topic parsing error:', e.message);
    return [];
  }
};

const findEntities = async (text) => {
  const prompt = `Extract named entities (people, organizations, locations) from this text. Return as JSON array of objects with 'name' and 'type' fields.\n\nText:\n${text.substring(0, 10000)}`;
  try {
    const content = await runChat(prompt, { maxTokens: 256 });
    const jsonContent = content.replace(/```json\n?|```\n?/g, '').trim();
    return JSON.parse(jsonContent);
  } catch {
    return [];
  }
};

const analyzeSentiment = async (text) => {
  const prompt = `Analyze the sentiment of this text. Return one word: 'positive', 'negative', or 'neutral'.\n\nText:\n${text.substring(0, 5000)}`;
  try {
    const content = await runChat(prompt, { maxTokens: 10 });
    return content.toLowerCase().trim();
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
    const content = await runChat(prompt, { maxTokens: 256 });
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
    const content = await runChat(prompt, { maxTokens: 512 });
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
    const content = await runChat(prompt, { maxTokens: 512 });
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