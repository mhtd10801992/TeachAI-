// Enhanced AI Service with Confidence Scoring and Question Generation
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const processWithAI = async (text, options = {}) => {
  const startTime = Date.now();
  
  try {
    // 1. Generate analysis with confidence scores
    const [summary, topics, entities, sentiment] = await Promise.all([
      generateSummaryWithConfidence(text),
      extractTopicsWithConfidence(text),
      findEntitiesWithConfidence(text),
      analyzeSentimentWithConfidence(text)
    ]);
    
    // 2. Generate questions for uncertain areas
    const questions = await generateClarifyingQuestions(text, {
      summary,
      topics,
      entities,
      sentiment
    });
    
    // 3. Calculate overall confidence
    const overallConfidence = calculateOverallConfidence({
      summary,
      topics,
      entities,
      sentiment
    });
    
    // 4. Chunk text for potential vectorization
    const chunks = chunkText(text, 1000);
    
    return {
      summary: summary.text,
      summaryConfidence: summary.confidence,
      
      topics: topics.items,
      topicsConfidence: topics.confidence,
      
      entities: entities.items,
      entitiesConfidence: entities.confidence,
      
      sentiment: sentiment.value,
      sentimentConfidence: sentiment.confidence,
      
      overallConfidence,
      questions,
      chunks,
      processingTime: Date.now() - startTime
    };
    
  } catch (error) {
    console.error('AI processing error:', error);
    throw error;
  }
};

const generateSummaryWithConfidence = async (text) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `Summarize the document in 2-3 sentences. Then rate your confidence (0.0-1.0) based on:
        - Text clarity and completeness
        - Ability to identify main themes
        - Document structure quality
        
        Return JSON: {"summary": "text", "confidence": 0.85, "reasoning": "why this confidence level"}`
      },
      {
        role: "user",
        content: text.substring(0, 4000)
      }
    ],
    max_tokens: 200
  });
  
  try {
    const result = JSON.parse(response.choices[0].message.content);
    return {
      text: result.summary,
      confidence: result.confidence,
      reasoning: result.reasoning
    };
  } catch {
    return {
      text: response.choices[0].message.content,
      confidence: 0.5,
      reasoning: "Could not parse confidence score"
    };
  }
};

const extractTopicsWithConfidence = async (text) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `Extract 3-5 main topics. Rate confidence based on:
        - Topic clarity in the text
        - Frequency of topic-related terms
        - Context strength
        
        Return JSON: {"topics": ["topic1", "topic2"], "confidence": 0.90, "reasoning": "explanation"}`
      },
      {
        role: "user",
        content: text.substring(0, 2000)
      }
    ],
    max_tokens: 150
  });
  
  try {
    const result = JSON.parse(response.choices[0].message.content);
    return {
      items: result.topics,
      confidence: result.confidence,
      reasoning: result.reasoning
    };
  } catch {
    return {
      items: [],
      confidence: 0.3,
      reasoning: "Could not extract topics reliably"
    };
  }
};

const findEntitiesWithConfidence = async (text) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4", 
    messages: [
      {
        role: "system",
        content: `Extract named entities (people, organizations, locations). Rate confidence based on:
        - Entity name clarity
        - Context providing entity type
        - Proper noun identification certainty
        
        Return JSON: {"entities": [{"name": "John", "type": "person", "confidence": 0.95}], "overall_confidence": 0.85}`
      },
      {
        role: "user",
        content: text.substring(0, 2000)
      }
    ],
    max_tokens: 200
  });
  
  try {
    const result = JSON.parse(response.choices[0].message.content);
    return {
      items: result.entities,
      confidence: result.overall_confidence,
      reasoning: "Based on context clarity and proper noun identification"
    };
  } catch {
    return {
      items: [],
      confidence: 0.4,
      reasoning: "Could not reliably identify entities"
    };
  }
};

const analyzeSentimentWithConfidence = async (text) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system", 
        content: `Analyze sentiment. Consider:
        - Clear emotional indicators
        - Consistent tone throughout
        - Context ambiguity
        
        Return JSON: {"sentiment": "positive/negative/neutral", "confidence": 0.80, "indicators": ["excited language", "growth terms"]}`
      },
      {
        role: "user",
        content: text.substring(0, 1000)
      }
    ],
    max_tokens: 100
  });
  
  try {
    const result = JSON.parse(response.choices[0].message.content);
    return {
      value: result.sentiment,
      confidence: result.confidence,
      indicators: result.indicators
    };
  } catch {
    return {
      value: "neutral",
      confidence: 0.5,
      indicators: ["Unable to determine clear sentiment"]
    };
  }
};

const generateClarifyingQuestions = async (text, analysis) => {
  const lowConfidenceAreas = [];
  
  if (analysis.summary.confidence < 0.8) lowConfidenceAreas.push("summary");
  if (analysis.topics.confidence < 0.7) lowConfidenceAreas.push("topics");  
  if (analysis.entities.confidence < 0.75) lowConfidenceAreas.push("entities");
  if (analysis.sentiment.confidence < 0.6) lowConfidenceAreas.push("sentiment");
  
  if (lowConfidenceAreas.length === 0) return [];
  
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `The AI has low confidence in these areas: ${lowConfidenceAreas.join(", ")}.
        Generate 2-3 specific questions that would help a human reviewer clarify these uncertainties.
        
        Return JSON array: ["Question 1?", "Question 2?"]`
      },
      {
        role: "user",
        content: `Document excerpt: ${text.substring(0, 1000)}\n\nLow confidence analysis: ${JSON.stringify(analysis, null, 2)}`
      }
    ],
    max_tokens: 150
  });
  
  try {
    return JSON.parse(response.choices[0].message.content);
  } catch {
    return [
      `The AI has uncertainty in: ${lowConfidenceAreas.join(", ")}. Please review these areas.`
    ];
  }
};

const calculateOverallConfidence = (analysis) => {
  const scores = [
    analysis.summary.confidence,
    analysis.topics.confidence,
    analysis.entities.confidence,
    analysis.sentiment.confidence
  ];
  
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
};

const chunkText = (text, maxLength) => {
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.substring(i, i + maxLength));
  }
  return chunks;
};
