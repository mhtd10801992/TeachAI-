// Document Metadata Service - Extracts and structures all document information for token-based processing

export const extractDocumentMetadata = async (text, analysis) => {
  const metadata = {
    // Text Structure & Content
    content: {
      fullText: text,
      textLength: text.length,
      wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
      sentences: extractSentences(text),
      paragraphs: extractParagraphs(text)
    },

    // AI Analysis Results
    analysis: {
      topics: analysis.topics || [],
      entities: analysis.entities || [],
      summary: analysis.summary || '',
      sentiment: analysis.sentiment || 'neutral'
    },

    // Document Structure
    structure: {
      sections: extractSections(text),
      headings: extractHeadings(text),
      keyPhrases: extractKeyPhrases(text, analysis.topics)
    },

    // Tokens for Processing
    tokens: generateTokens(text, analysis),

    // Metadata Tags
    tags: extractMetadataTags(analysis),

    // Searchable Index
    index: createSearchIndex(text, analysis)
  };

  return metadata;
};

// Extract sentences from text
const extractSentences = (text) => {
  const sentenceRegex = /[^.!?]+[.!?]+/g;
  const sentences = text.match(sentenceRegex) || [];
  return sentences.map(s => s.trim()).filter(s => s.length > 0);
};

// Extract paragraphs
const extractParagraphs = (text) => {
  return text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map((p, idx) => ({
      id: idx,
      text: p,
      length: p.length,
      sentences: p.split(/[.!?]+/).filter(s => s.trim().length > 0).length
    }));
};

// Extract document sections (based on headings or content boundaries)
const extractSections = (text) => {
  const sections = [];
  const lines = text.split('\n');
  let currentSection = null;
  let currentContent = [];

  lines.forEach((line, idx) => {
    // Check if line looks like a heading (short, uppercase, or followed by colon)
    const isHeading = line.length < 100 && 
                      (line.toUpperCase() === line || 
                       line.endsWith(':') ||
                       (idx > 0 && lines[idx - 1].trim() === ''));

    if (isHeading && line.trim().length > 0) {
      if (currentSection) {
        sections.push({
          title: currentSection,
          content: currentContent.join(' ').trim(),
          contentLength: currentContent.join(' ').length
        });
      }
      currentSection = line.trim();
      currentContent = [];
    } else if (line.trim().length > 0) {
      currentContent.push(line);
    }
  });

  if (currentSection && currentContent.length > 0) {
    sections.push({
      title: currentSection,
      content: currentContent.join(' ').trim(),
      contentLength: currentContent.join(' ').length
    });
  }

  return sections;
};

// Extract headings and titles
const extractHeadings = (text) => {
  const headings = [];
  const lines = text.split('\n');
  
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.length > 0 && trimmed.length < 100) {
      // Line is likely a heading if it's short and followed by content
      if (idx < lines.length - 1 && lines[idx + 1].trim().length > 0) {
        headings.push({
          text: trimmed,
          level: determineHeadingLevel(trimmed),
          position: idx
        });
      }
    }
  });

  return headings;
};

// Determine heading level (1 = main, 2 = sub, etc.)
const determineHeadingLevel = (text) => {
  if (text.toUpperCase() === text) return 1; // All caps = main heading
  if (text.length < 50) return 2; // Short text = subheading
  return 3; // Regular text
};

// Extract key phrases based on topics and entities
const extractKeyPhrases = (text, topics) => {
  const phrases = [];
  const textLower = text.toLowerCase();

  if (topics && Array.isArray(topics)) {
    topics.forEach(topic => {
      const topicLower = topic.toLowerCase();
      const regex = new RegExp(`\\b${topicLower}\\b`, 'gi');
      const matches = text.match(regex);
      
      if (matches) {
        phrases.push({
          phrase: topic,
          frequency: matches.length,
          importance: 'high'
        });
      }
    });
  }

  // Sort by frequency
  return phrases.sort((a, b) => b.frequency - a.frequency).slice(0, 20);
};

// Generate tokens for language model processing
const generateTokens = (text, analysis) => {
  const tokens = {
    content: tokenizeText(text),
    entities: analysis.entities ? analysis.entities.map(e => ({
      token: e.name || e,
      type: e.type || 'ENTITY',
      importance: 'high'
    })) : [],
    topics: analysis.topics ? analysis.topics.map(t => ({
      token: t,
      type: 'TOPIC',
      importance: 'high'
    })) : [],
    sentiment: {
      token: analysis.sentiment || 'neutral',
      type: 'SENTIMENT',
      importance: 'medium'
    }
  };

  return tokens;
};

// Tokenize text into meaningful chunks
const tokenizeText = (text) => {
  // Simple tokenization - split by spaces and punctuation
  const words = text.match(/\b\w+\b/g) || [];
  const uniqueWords = [...new Set(words.map(w => w.toLowerCase()))];
  
  return {
    totalTokens: words.length,
    uniqueTokens: uniqueWords.length,
    averageTokenLength: (words.reduce((sum, w) => sum + w.length, 0) / words.length).toFixed(2),
    topTokens: uniqueWords
      .map(word => ({
        token: word,
        frequency: words.filter(w => w.toLowerCase() === word).length
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 50)
  };
};

// Extract metadata tags for classification and search
const extractMetadataTags = (analysis) => {
  const tags = [];

  // Add topic tags
  if (analysis.topics && Array.isArray(analysis.topics)) {
    tags.push(...analysis.topics.map(t => ({
      tag: t,
      category: 'topic',
      weight: 1.0
    })));
  }

  // Add entity tags
  if (analysis.entities && Array.isArray(analysis.entities)) {
    tags.push(...analysis.entities.map(e => ({
      tag: e.name || e,
      category: e.type ? e.type.toLowerCase() : 'entity',
      weight: 0.8
    })));
  }

  // Add sentiment tag
  if (analysis.sentiment) {
    tags.push({
      tag: analysis.sentiment,
      category: 'sentiment',
      weight: 0.5
    });
  }

  return tags;
};

// Create searchable index for document
const createSearchIndex = (text, analysis) => {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const index = {};

  words.forEach((word, position) => {
    if (word.length > 2) { // Only index words > 2 chars
      if (!index[word]) {
        index[word] = [];
      }
      index[word].push(position);
    }
  });

  return {
    totalIndexedWords: Object.keys(index).length,
    sampleIndex: Object.fromEntries(
      Object.entries(index)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 100)
    )
  };
};

// Convert extracted metadata to JSON for storage
export const serializeMetadata = (metadata) => {
  return JSON.stringify(metadata, null, 2);
};

// Deserialize metadata from JSON
export const deserializeMetadata = (metadataJson) => {
  try {
    return JSON.parse(metadataJson);
  } catch (error) {
    console.error('Error deserializing metadata:', error);
    return null;
  }
};

// Query metadata for chat context
export const queryMetadataForContext = (metadata, query, limit = 5) => {
  const results = {
    relevantSections: [],
    relevantTopics: [],
    relevantEntities: [],
    relevantPhrases: []
  };

  const queryLower = query.toLowerCase();

  // Find relevant sections
  if (metadata.structure && metadata.structure.sections) {
    results.relevantSections = metadata.structure.sections
      .filter(s => s.content.toLowerCase().includes(queryLower))
      .slice(0, limit);
  }

  // Find relevant topics
  if (metadata.analysis && metadata.analysis.topics) {
    results.relevantTopics = metadata.analysis.topics
      .filter(t => t.toLowerCase().includes(queryLower))
      .slice(0, limit);
  }

  // Find relevant entities
  if (metadata.analysis && metadata.analysis.entities) {
    results.relevantEntities = metadata.analysis.entities
      .filter(e => {
        const name = e.name || e;
        return name.toLowerCase().includes(queryLower);
      })
      .slice(0, limit);
  }

  // Find relevant key phrases
  if (metadata.structure && metadata.structure.keyPhrases) {
    results.relevantPhrases = metadata.structure.keyPhrases
      .filter(p => p.phrase.toLowerCase().includes(queryLower))
      .slice(0, limit);
  }

  return results;
};

// Extract topic details with supporting evidence
export const getTopicDetails = (metadata, topicName) => {
  const details = {
    topic: topicName,
    mentioned: 0,
    relevantSections: [],
    supportingEvidence: [],
    relatedEntities: [],
    relatedTopics: []
  };

  const topicLower = topicName.toLowerCase();

  // Count mentions
  if (metadata.content && metadata.content.fullText) {
    const regex = new RegExp(`\\b${topicName.split(' ').join('\\b.*\\b')}\\b`, 'gi');
    const matches = metadata.content.fullText.match(regex);
    details.mentioned = matches ? matches.length : 0;
  }

  // Find sections mentioning the topic
  if (metadata.structure && metadata.structure.sections) {
    details.relevantSections = metadata.structure.sections
      .filter(s => s.content.toLowerCase().includes(topicLower))
      .map(s => ({
        title: s.title,
        preview: s.content.substring(0, 200) + '...'
      }));
  }

  // Find supporting sentences
  if (metadata.content && metadata.content.sentences) {
    details.supportingEvidence = metadata.content.sentences
      .filter(s => s.toLowerCase().includes(topicLower))
      .slice(0, 5);
  }

  // Find related entities
  if (metadata.analysis && metadata.analysis.entities) {
    details.relatedEntities = metadata.analysis.entities
      .slice(0, 5)
      .map(e => e.name || e);
  }

  // Find related topics
  if (metadata.analysis && metadata.analysis.topics) {
    details.relatedTopics = metadata.analysis.topics
      .filter(t => t.toLowerCase() !== topicLower)
      .slice(0, 5);
  }

  return details;
};
