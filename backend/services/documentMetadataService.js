// Document Metadata Service - Extracts and structures all document information for token-based processing
import OpenAI from 'openai';

// Initialize OpenAI (if API key is available)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ================ EQUATION COMPOSER LAYER ================
// Step 1: Compose complete equations from metadata
const composeEquation = (equationMeta) => {
  // Defensive: Check if equationMeta is valid
  if (!equationMeta || typeof equationMeta !== 'object') {
    console.warn('Invalid equation metadata:', equationMeta);
    return 'Unknown equation';
  }
  
  const { variables, equation } = equationMeta;
  
  // Already has a full equation string
  if (equation && equation.length > 0) {
    return equation;
  }
  
  // Try to reconstruct from variables and operators
  if (variables && Array.isArray(variables) && variables.length >= 2) {
    // Simple composition: var1 = var2 + var3...
    return `${variables[0]} = ${variables.slice(1).join(' + ')}`;
  }
  
  return equation || 'Unknown equation';
};

// Step 2: Generate meaningful explanation for equation
const explainEquation = (equation, sentence, variables) => {
  // Defensive: Check inputs
  if (!equation || typeof equation !== 'string') {
    console.warn('Invalid equation for explanation:', equation);
    return {
      short: 'Equation data unavailable',
      context: sentence || '',
      mathematical: 'Unable to explain this equation due to missing data.'
    };
  }
  
  // Extract relationship type from equation
  let relationship = 'is calculated from';
  
  if (equation.includes('+')) relationship = 'is the sum of';
  else if (equation.includes('-')) relationship = 'is the difference between';
  else if (equation.includes('×') || equation.includes('*')) relationship = 'is the product of';
  else if (equation.includes('÷') || equation.includes('/')) relationship = 'is the ratio of';
  else if (equation.includes('^')) relationship = 'is raised to the power of';
  
  const leftSide = variables && Array.isArray(variables) && variables.length > 0 ? variables[0] : equation.split('=')[0]?.trim() || 'variable';
  const rightSide = variables && Array.isArray(variables) && variables.length > 1 ? variables.slice(1).join(', ') : equation.split('=')[1]?.trim() || 'expression';
  
  return {
    short: `**${leftSide}** ${relationship} ${rightSide}`,
    context: sentence || '',
    mathematical: `The equation **${equation}** defines the relationship between ${variables && Array.isArray(variables) ? variables.join(', ') : 'variables'}.`
  };
};

// Step 3: Generate AI-powered explanation for equation
const explainEquationWithAI = async (equation, sentence) => {
  if (!openai) {
    return explainEquation(equation, sentence, []).mathematical;
  }
  
  try {
    const prompt = `Explain the mathematical relationship in the equation "${equation}" using this context:
"${sentence}"

Provide a clear, concise explanation (max 30 words) of what this equation represents and calculates.`;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 80
    });
    
    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error('Error generating AI equation explanation:', err.message);
    return explainEquation(equation, sentence, []).mathematical;
  }
};

// Step 4: Compose and enhance all equations
const composeAndExplainEquations = async (equations, generateAIExplanations = false) => {
  if (!equations || !Array.isArray(equations) || equations.length === 0) {
    return [];
  }
  
  const composedEquations = [];
  
  for (const eq of equations) {
    // Skip invalid equation entries
    if (!eq || typeof eq !== 'object') {
      console.warn('Skipping invalid equation entry:', eq);
      continue;
    }
    
    try {
      const composedEq = composeEquation(eq);
      const basicExplanation = explainEquation(composedEq, eq.sentence, eq.variables);
      
      const enhanced = {
        ...eq,
        composedEquation: composedEq,
        explanation: basicExplanation,
        displayEquation: formatEquationForDisplay(composedEq)
      };
      
      // Optionally generate AI explanation
      if (generateAIExplanations && openai) {
        try {
          enhanced.aiExplanation = await explainEquationWithAI(composedEq, eq.sentence);
        } catch (err) {
          console.error('Error in AI explanation:', err.message);
        }
      }
      
      composedEquations.push(enhanced);
    } catch (err) {
      console.error('Error processing equation:', err.message, eq);
      // Continue with next equation instead of crashing
    }
  }
  
  return composedEquations;
};

// Export for on-demand processing
export { composeAndExplainEquations, generateNumericExplanations };

// Step 5: Format equation for MathJax display
const formatEquationForDisplay = (equation) => {
  // Convert to LaTeX-style formatting for MathJax
  let formatted = equation
    .replace(/\*/g, '\\times')
    .replace(/\//g, '\\div')
    .replace(/\^(\d+)/g, '^{$1}')
    .replace(/\^([A-Za-z])/g, '^{$1}');
  
  return formatted;
};

// ================ END EQUATION COMPOSER LAYER ================

// Step 5: Generate AI explanations for numeric data
const generateNumericExplanations = async (numericData) => {
  if (!openai || numericData.length === 0) return numericData;
  
  try {
    // Process in batches to avoid rate limits
    const batchSize = 5;
    const results = [];
    
    for (let i = 0; i < numericData.length; i += batchSize) {
      const batch = numericData.slice(i, i + batchSize);
      
      // Generate explanations for each item
      const promises = batch.map(async (item) => {
        try {
          const prompt = `Explain what the measurement/number "${item.value}" refers to in this context:\n"${item.sentence}"\n\nProvide a SHORT explanation (max 15 words) of what this number represents.`;
          
          const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 50
          });
          
          return {
            ...item,
            explanation: response.choices[0].message.content.trim()
          };
        } catch (err) {
          console.error('Error generating explanation:', err.message);
          return { ...item, explanation: 'No explanation available' };
        }
      });
      
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + batchSize < numericData.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error in batch explanation generation:', error.message);
    return numericData.map(item => ({ ...item, explanation: 'Explanation unavailable' }));
  }
};

// Step 5: Generate AI explanations for equations
const generateEquationExplanations = async (equations) => {
  if (!openai || equations.length === 0) return equations;
  
  try {
    const batchSize = 5;
    const results = [];
    
    for (let i = 0; i < equations.length; i += batchSize) {
      const batch = equations.slice(i, i + batchSize);
      
      const promises = batch.map(async (item) => {
        try {
          const prompt = `Explain what this scientific equation means: "${item.equation}"\nContext: "${item.sentence}"\n\nProvide a SHORT explanation (max 20 words) of what this equation represents.`;
          
          const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 60
          });
          
          return {
            ...item,
            explanation: response.choices[0].message.content.trim()
          };
        } catch (err) {
          console.error('Error generating equation explanation:', err.message);
          return { ...item, explanation: 'No explanation available' };
        }
      });
      
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
      
      if (i + batchSize < equations.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error in equation explanation generation:', error.message);
    return equations.map(item => ({ ...item, explanation: 'Explanation unavailable' }));
  }
};

export const extractDocumentMetadata = async (text, analysis, skipEquationComposer = false) => {
  const cleanText = text || '';
  const sentences = extractSentences(cleanText);
  const paragraphs = extractParagraphs(cleanText);
  
  // Extract numeric and scientific data (RAW ONLY - no processing)
  let numericData = extractNumericData(cleanText, sentences, paragraphs);
  let equations = extractScientificEquations(cleanText, sentences);
  
  // NOTE: Equation composition and AI explanations are now ON-DEMAND only
  // Users can trigger processing via UI buttons in EquationExplorer/NumericDataExplorer
  console.log(`📊 Extracted ${equations.length} raw equations and ${numericData.length} numeric items (no auto-processing)`);
  
  // Step 5: Generate AI explanations for numeric data only (optional, only if OpenAI is available)
  if (openai && numericData.length > 0) {
    console.log('🤖 Generating AI explanations for numeric data...');
    numericData = await generateNumericExplanations(numericData);
    console.log('✅ AI explanations generated for numeric data');
  }
  
  const metadata = {
    // Text Structure & Content
    content: {
      fullText: cleanText,
      textLength: cleanText.length,
      wordCount: cleanText.split(/\s+/).filter(w => w.length > 0).length,
      sentences: sentences,
      paragraphs: paragraphs
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
      sections: extractSections(cleanText),
      headings: extractHeadings(cleanText),
      keyPhrases: extractKeyPhrases(cleanText, analysis.topics)
    },

    // Numeric and Scientific Data (with Equation Composer enhancements)
    numericData: numericData,
    equations: equations,

    // Tokens for Processing
    tokens: generateTokens(cleanText, analysis),

    // Metadata Tags
    tags: extractMetadataTags(analysis),

    // Searchable Index
    index: createSearchIndex(cleanText, analysis)
  };

  return metadata;
};

// Step 1: Clean text before extraction
const cleanForMetadata = (text) => {
  return text
    .replace(/¶\d+/g, "")        // remove paragraph markers
    .replace(/§\d+/g, "")        // remove section markers
    .replace(/\b000\s?[°C|°F]/g, "") // remove 000 °C artifacts
    .replace(/\b\d{3}\s?[°C|°F]/g, (match) => {
      // Only remove if it's clearly an artifact (3 digits followed by temp)
      return match.startsWith('000') ? '' : match;
    })
    .replace(/-\s*\n/g, "")      // fix hyphenated line breaks
    .replace(/\n+/g, " ")        // flatten broken lines
    .replace(/\s{2,}/g, " ")     // collapse multiple spaces
    .trim();
};

// Step 3: Semantic validation - Check if measurement is valid
const isValidMeasurement = (sentence) => {
  // Must contain scientific/technical nouns
  return /\b(temperature|pressure|speed|velocity|mass|weight|load|force|volume|density|rate|efficiency|height|width|length|distance|time|duration|power|energy|frequency|wavelength|concentration|pH|voltage|current|resistance|capacity|flow|stress|strain|torque|momentum|acceleration)\b/i.test(sentence);
};

// Step 3: Semantic validation - Check if equation structure is valid
const isValidEquationStructure = (sentence) => {
  // Must contain operators, equals, or Greek letters
  return /[=+\-×÷/]/.test(sentence) || /[α-ωΑ-Ω]/.test(sentence) || /\^/.test(sentence);
};

// Step 3: Semantic validation - Check if variable is valid
const isValidVariable = (token) => {
  // Single letter to 3 letters, or Greek letters, or known combinations
  return /^[A-Za-z]{1,3}$/.test(token) || 
         /[α-ωΑ-Ω]/.test(token) ||
         /^(PV|RT|ΔH|ΔG|ΔS|kT)$/.test(token);
};

// Step 2 & 3: Extract numeric data with validation (from sentences only)
const extractNumericData = (text, sentences, paragraphs) => {
  const numericData = [];
  const cleanedText = cleanForMetadata(text);
  
  // Regex patterns for different numeric types
  const patterns = {
    temperature: /(\d+\.?\d*)\s*[°]?[CF]\b/gi,
    percentage: /(\d+\.?\d*)\s*%/g,
    currency: /[$€£¥₹]\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g,
    scientificNotation: /(\d+\.?\d*)\s*[×x]\s*10\^?(-?\d+)/gi,
    measurement: /(\d+\.?\d*)\s*(mm|cm|m|km|kg|g|mg|tons?|ml|l|gal|mph|kmh?|kph|Hz|MHz|GHz|V|mV|A|mA|W|kW|MW|J|kJ|Pa|kPa|MPa|bar|psi|mol|M|N|kN)/gi,
    ratio: /(\d+\.?\d*)\s*:\s*(\d+\.?\d*)\b/g,
    range: /(\d+\.?\d*)\s*[-–—]\s*(\d+\.?\d*)\b/g,
    decimal: /\b(\d+\.\d+)\b/g
  };
  
  // Step 2: Process each sentence (not raw text)
  sentences.forEach((sentence, sentenceIdx) => {
    const cleanSentence = cleanForMetadata(sentence);
    
    // Skip empty or too short sentences
    if (cleanSentence.length < 10) return;
    
    // Find paragraph index and text
    let paragraphIdx = 0;
    let paragraphText = '';
    for (let i = 0; i < paragraphs.length; i++) {
      if (paragraphs[i].text.includes(sentence.substring(0, 50))) {
        paragraphIdx = i;
        paragraphText = paragraphs[i].text;
        break;
      }
    }
    
    // Extract temperature measurements (special handling)
    patterns.temperature.lastIndex = 0;
    let match;
    while ((match = patterns.temperature.exec(cleanSentence)) !== null) {
      // Step 3: Validate - must have scientific context
      if (isValidMeasurement(cleanSentence)) {
        numericData.push({
          value: match[0],
          numericValue: parseFloat(match[1]),
          unit: match[0].includes('C') ? '°C' : '°F',
          type: 'temperature',
          sentenceIndex: sentenceIdx,
          paragraphIndex: paragraphIdx,
          sentence: cleanSentence,
          paragraph: paragraphText,
          context: cleanSentence
        });
      }
    }
    
    // Extract percentages
    patterns.percentage.lastIndex = 0;
    while ((match = patterns.percentage.exec(cleanSentence)) !== null) {
      numericData.push({
        value: match[0],
        numericValue: parseFloat(match[1]),
        type: 'percentage',
        sentenceIndex: sentenceIdx,
        paragraphIndex: paragraphIdx,
        sentence: cleanSentence,
        paragraph: paragraphText,
        context: cleanSentence
      });
    }
    
    // Extract currency
    patterns.currency.lastIndex = 0;
    while ((match = patterns.currency.exec(cleanSentence)) !== null) {
      numericData.push({
        value: match[0],
        numericValue: parseFloat(match[1].replace(/,/g, '')),
        type: 'currency',
        sentenceIndex: sentenceIdx,
        paragraphIndex: paragraphIdx,
        sentence: cleanSentence,
        paragraph: paragraphText,
        context: cleanSentence
      });
    }
    
    // Extract scientific notation
    patterns.scientificNotation.lastIndex = 0;
    while ((match = patterns.scientificNotation.exec(cleanSentence)) !== null) {
      if (isValidMeasurement(cleanSentence)) {
        numericData.push({
          value: match[0],
          numericValue: parseFloat(match[1]) * Math.pow(10, parseInt(match[2])),
          type: 'scientific_notation',
          sentenceIndex: sentenceIdx,
          paragraphIndex: paragraphIdx,
          sentence: cleanSentence,
          paragraph: paragraphText,
          context: cleanSentence
        });
      }
    }
    
    // Extract measurements (with validation)
    patterns.measurement.lastIndex = 0;
    while ((match = patterns.measurement.exec(cleanSentence)) !== null) {
      if (isValidMeasurement(cleanSentence)) {
        numericData.push({
          value: match[0],
          numericValue: parseFloat(match[1]),
          unit: match[2],
          type: 'measurement',
          sentenceIndex: sentenceIdx,
          paragraphIndex: paragraphIdx,
          sentence: cleanSentence,
          paragraph: paragraphText,
          context: cleanSentence
        });
      }
    }
    
    // Extract ratios
    patterns.ratio.lastIndex = 0;
    while ((match = patterns.ratio.exec(cleanSentence)) !== null) {
      // Avoid extracting time formats (e.g., "3:45")
      if (!/\d+:\d{2}/.test(match[0])) {
        numericData.push({
          value: match[0],
          numericValue: parseFloat(match[1]) / parseFloat(match[2]),
          type: 'ratio',
          sentenceIndex: sentenceIdx,
          paragraphIndex: paragraphIdx,
          sentence: cleanSentence,
          paragraph: paragraphText,
          context: cleanSentence
        });
      }
    }
    
    // Extract ranges
    patterns.range.lastIndex = 0;
    while ((match = patterns.range.exec(cleanSentence)) !== null) {
      // Must have units or scientific context
      if (isValidMeasurement(cleanSentence) || /\d+\.?\d*\s*-\s*\d+\.?\d*\s*(years?|months?|days?|hours?|minutes?|seconds?|%)/i.test(match[0] + cleanSentence.substring(match.index + match[0].length, match.index + match[0].length + 20))) {
        numericData.push({
          value: match[0],
          min: parseFloat(match[1]),
          max: parseFloat(match[2]),
          type: 'range',
          sentenceIndex: sentenceIdx,
          paragraphIndex: paragraphIdx,
          sentence: cleanSentence,
          paragraph: paragraphText,
          context: cleanSentence
        });
      }
    }
  });
  
  // Remove duplicates
  const uniqueData = [];
  const seen = new Set();
  numericData.forEach(item => {
    const key = `${item.value}-${item.sentenceIndex}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueData.push(item);
    }
  });
  
  return uniqueData;
};

// Step 2 & 3: Extract scientific equations with validation (from sentences only)
const extractScientificEquations = (text, sentences) => {
  const equations = [];
  
  // Patterns for equation detection
  const equationPatterns = [
    // Variable = expression (e.g., σ = F/A, E = mc²)
    /([A-Za-zΔσμπρθλφψωαβγδεζηκνξστυχΩΣΠΛΦΨ][A-Za-z0-9_]*)\s*=\s*([^.!?\n;,]{1,50})/g,
    // Expression with operators and variables
    /([A-Za-zΔσμπρθλφψωαβγδεζηκνξστυχΩΣΠΛΦΨ][A-Za-z0-9_]*)\s*[+\-×÷*/]\s*([A-Za-zΔσμπρθλφψωαβγδεζηκνξστυχΩΣΠΛΦΨ][A-Za-z0-9_]*)/g
  ];
  
  // Step 2: Process each sentence (not raw text)
  sentences.forEach((sentence, sentenceIdx) => {
    const cleanSentence = cleanForMetadata(sentence);
    
    // Step 3: Validate - must have equation structure
    if (!isValidEquationStructure(cleanSentence)) return;
    
    // Skip if sentence is too short or contains common non-equation patterns
    if (cleanSentence.length < 5) return;
    if (/^(No|Yes|Action|Fuel|Cost|Name|Type|Date|Time|Page)\s*[-:]/i.test(cleanSentence)) return;
    
    equationPatterns.forEach(pattern => {
      pattern.lastIndex = 0;
      let match;
      
      while ((match = pattern.exec(cleanSentence)) !== null) {
        const fullEquation = match[0].trim();
        
        // Skip if it's just a simple number comparison or assignment
        if (/^\d+\s*=\s*\d+/.test(fullEquation)) continue;
        if (fullEquation.length < 3 || fullEquation.length > 100) continue;
        
        // Extract variables (letters, Greek letters, subscripts)
        const variablePattern = /[A-Za-zΔσμπρθλφψωαβγδεζηκνξστυχΩΣΠΛΦΨ][A-Za-z0-9_]*/g;
        const allVariables = fullEquation.match(variablePattern) || [];
        
        // Step 3: Validate each variable
        const validVariables = allVariables.filter(v => isValidVariable(v));
        
        // Must have at least 2 valid variables
        if (validVariables.length < 2) continue;
        
        // Check features
        const hasOperators = /[+\-×÷*/=^]/.test(fullEquation);
        const hasGreekLetters = /[ΔσμπρθλφψωαβγδεζηκνξστυχΩΣΠΛΦΨ]/.test(fullEquation);
        const hasSuperscripts = /\^|\u00B2|\u00B3/.test(fullEquation);
        const hasNumbers = /\d/.test(fullEquation);
        
        // Must have operators or Greek letters or superscripts
        if (!hasOperators && !hasGreekLetters && !hasSuperscripts) continue;
        
        equations.push({
          equation: fullEquation,
          variables: [...new Set(validVariables)],
          sentenceIndex: sentenceIdx,
          sentence: cleanSentence,
          context: cleanSentence,
          features: {
            hasGreekLetters,
            hasSuperscripts,
            hasNumbers,
            variableCount: validVariables.length
          }
        });
      }
    });
  });
  
  // Remove duplicates
  const uniqueEquations = [];
  const seen = new Set();
  
  equations.forEach(eq => {
    const key = eq.equation.replace(/\s/g, '').toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueEquations.push(eq);
    }
  });
  
  return uniqueEquations;
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
