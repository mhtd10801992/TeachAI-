import dotenv from 'dotenv';
dotenv.config();

import OpenAI from 'openai';
import { loadDocumentsFromFirebase } from '../services/firebaseStorageService.js';
import { suggestChartsFromMetadata } from '../services/chartGenerationService.js';
import fs from 'fs/promises';
import path from 'path';

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  console.log('✅ OpenAI initialized in presentationController');
} else {
  console.warn('⚠️  OPENAI_API_KEY not found in presentationController');
}

// Load global abbreviation dictionary
async function loadAbbreviationDictionary() {
  try {
    const dictPath = path.join(process.cwd(), 'data', 'global-dictionary.json');
    const data = await fs.readFile(dictPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.warn('⚠️ Could not load abbreviation dictionary:', error.message);
    return {};
  }
}

export async function generatePresentationSlides(req, res) {
  try {
    const { documentId, forceRefresh } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: 'Document ID is required'
      });
    }

    if (!openai) {
      return res.status(503).json({
        success: false,
        error: 'OpenAI API is not configured. Please set OPENAI_API_KEY environment variable.'
      });
    }

    console.log('🎯 Generating presentation slides for document:', documentId);

    // Load document data
    const allDocuments = await loadDocumentsFromFirebase();
    
    // Documents might have ID at different levels
    const document = allDocuments.find(doc => 
      doc.id === documentId || 
      doc.document?.id === documentId ||
      doc.document?.document?.id === documentId
    );
    
    if (!document) {
      console.error('❌ Document not found:', documentId);
      console.log('📋 Available documents:', allDocuments.map(d => ({
        id: d.id || d.document?.id || d.document?.document?.id,
        filename: d.filename || d.document?.filename
      })));
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        hint: 'Check available document IDs'
      });
    }

    // Normalize document structure - handle nested document object
    const normalizedDoc = document.document?.document || document.document || document;
    
    console.log('✅ Document found:', {
      id: normalizedDoc.id,
      hasAnalysis: !!normalizedDoc.analysis,
      hasMetadata: !!normalizedDoc.metadata
    });

    // Check if we have cached presentation slides
    if (!forceRefresh && normalizedDoc.metadata?.presentationCache) {
      const cached = normalizedDoc.metadata.presentationCache;
      console.log('✅ Returning cached presentation slides');
      return res.json({
        success: true,
        slides: cached.slides,
        chartSuggestions: cached.chartSuggestions || [],
        abbreviations: cached.abbreviations || {},
        fromCache: true,
        cachedAt: cached.cachedAt
      });
    }

    const analysis = normalizedDoc.analysis || {};
    const metadata = normalizedDoc.metadata || {};
    
    // Extract relevant data
    const documentText = analysis.originalText || '';
    const summary = analysis.summary?.text || analysis.summary || '';
    const topics = analysis.topics || [];
    const keyTerms = analysis.keyTerms || analysis.entities || [];
    
    // Get equations and numbers from metadata
    const equations = metadata.equations || [];
    const numbers = metadata.numericData || metadata.numbers || [];
    const mindMapTopics = analysis.mindMapTopics || [];
    const imageAnalysis = analysis.imageAnalysis || [];
    const tables = analysis.tables || [];
    
    // Generate chart suggestions from metadata
    let chartSuggestions = [];
    try {
      chartSuggestions = await suggestChartsFromMetadata(metadata);
      console.log(`📊 Generated ${chartSuggestions.length} chart suggestions`);
    } catch (chartError) {
      console.warn('⚠️ Chart suggestion error:', chartError.message);
    }
    
    // Load abbreviation dictionary
    const abbreviationDict = await loadAbbreviationDictionary();

    // Prepare context for OpenAI
    const contextData = {
      summary,
      topics: topics.slice(0, 10),
      keyTerms: keyTerms.slice(0, 15),
      equations: equations.slice(0, 10),
      importantNumbers: (Array.isArray(numbers) ? numbers : [])
        .filter(n => n && (n.confidence === undefined || n.confidence > 0.5))
        .slice(0, 15),
      mindMapTopics: mindMapTopics.slice(0, 8),
      chartSuggestions: chartSuggestions.slice(0, 5),
      imageDescriptions: imageAnalysis.slice(0, 10).map((img, idx) => ({
        index: idx + 1,
        description: img.description || 'Image',
        page: img.pageNumber
      })),
      tableCount: tables.length,
      abbreviations: abbreviationDict
    };

    console.log('📊 Slide generation context:', {
      topicsCount: contextData.topics.length,
      equationsCount: contextData.equations.length,
      numbersCount: contextData.importantNumbers.length,
      mindMapTopicsCount: contextData.mindMapTopics.length,
      chartsCount: contextData.chartSuggestions.length,
      imagesCount: contextData.imageDescriptions.length,
      tablesCount: contextData.tableCount
    });

    // Create prompt for OpenAI
    const systemPrompt = `You are a presentation assistant that creates clear, professional slide content with visual elements.

Use the provided document analysis data to generate slide content that is:
- Clear, detailed, and informative
- Well-structured with bullet points
- Includes key metrics, equations, insights, and visual elements
- Uses consistent terminology from the abbreviation dictionary
- Incorporates charts, diagrams, and images where appropriate

For equations, provide LaTeX format that can be rendered with MathJax.
For charts, specify Chart.js configuration (type, data, labels).
For process flows and relationships, provide Mermaid diagram syntax.
For numbers, highlight important costs, metrics, and values with context.`;

    const userPrompt = `Generate a comprehensive presentation outline with detailed slide content based on this document analysis:

DOCUMENT SUMMARY:
${summary}

KEY TOPICS (${contextData.topics.length}):
${contextData.topics.map(t => `- ${t}`).join('\n')}

MIND MAP CLUSTERS (${contextData.mindMapTopics.length}):
${contextData.mindMapTopics.map(t => `- ${t.topic || t}`).join('\n')}

KEY TERMS & ENTITIES (${contextData.keyTerms.length}):
${contextData.keyTerms.map(k => `- ${k}`).join('\n')}

IMPORTANT NUMBERS & METRICS (${contextData.importantNumbers.length}):
${contextData.importantNumbers.map(n => `- ${n.value} ${n.unit || ''} (${n.context || 'value'})`).join('\n')}

EQUATIONS (${contextData.equations.length}):
${contextData.equations.map((eq, idx) => `${idx + 1}. ${eq.latex || eq.text || eq.composedEquation}`).join('\n')}

CHART SUGGESTIONS (${contextData.chartSuggestions.length}):
${contextData.chartSuggestions.map((chart, idx) => `${idx + 1}. ${chart.type}: ${chart.title} - ${chart.description}`).join('\n')}

IMAGES IN DOCUMENT (${contextData.imageDescriptions.length}):
${contextData.imageDescriptions.map(img => `- Image ${img.index} (Page ${img.page}): ${img.description}`).join('\n')}

TABLES: ${contextData.tableCount} detected

ABBREVIATION DICTIONARY:
${Object.entries(abbreviationDict).slice(0, 20).map(([abbr, def]) => `${abbr}: ${def}`).join('\n')}

Generate a comprehensive presentation with 6-10 slides. For each slide, provide:
1. Slide title
2. Detailed description (2-3 sentences about the slide content)
3. 4-6 bullet points with key insights and data
4. Relevant equations (in LaTeX format, e.g., "E = mc^2")
5. Important numbers/metrics with context
6. Chart specification (if data visualization would help):
   - type: "bar", "line", "pie", "scatter", etc.
   - title: chart title
   - data: sample data structure
   - labels: axis/data labels
7. Mermaid diagram (if showing process/flow/relationship):
   - Use Mermaid syntax (graph TD, flowchart, sequenceDiagram, etc.)
   - Show processes, relationships, or hierarchies
8. Image references (mention which document images are relevant)

Format your response as a JSON array of slide objects with this structure:
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "slide title",
      "description": "Brief description of what this slide covers",
      "bullets": ["detailed point 1", "detailed point 2", "detailed point 3"],
      "equations": ["LaTeX equation if applicable"],
      "metrics": ["important numbers with full context"],
      "chart": {
        "type": "bar|line|pie|scatter",
        "title": "Chart Title",
        "data": [10, 20, 30],
        "labels": ["Label1", "Label2", "Label3"],
        "description": "What this chart shows"
      },
      "mermaidDiagram": "graph TD\\nA[Start] --> B[Process]\\nB --> C[End]",
      "imageReferences": ["Image 1: description of how it relates"],
      "mindMapTopic": "related mind map cluster if applicable",
      "notes": "Additional speaker notes or context"
    }
  ]
}`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 3000
    });

    const responseText = completion.choices[0].message.content;
    let slidesData;
    
    try {
      slidesData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response:', parseError);
      return res.status(500).json({
        success: false,
        error: 'Failed to parse AI response'
      });
    }

    console.log('✅ Generated slides:', slidesData.slides?.length || 0);

    // Cache the presentation data for future requests
    try {
      if (!normalizedDoc.metadata) normalizedDoc.metadata = {};
      normalizedDoc.metadata.presentationCache = {
        slides: slidesData.slides || [],
        chartSuggestions,
        abbreviations: abbreviationDict,
        cachedAt: new Date().toISOString(),
        slideCount: slidesData.slides?.length || 0
      };
      
      // Save back to Firebase
      const { saveDocumentToFirebase } = await import('../services/firebaseStorageService.js');
      await saveDocumentToFirebase(documentId, { document: normalizedDoc });
      console.log('💾 Cached presentation slides');
    } catch (cacheError) {
      console.warn('⚠️ Failed to cache presentation:', cacheError.message);
    }

    res.json({
      success: true,
      slides: slidesData.slides || [],
      chartSuggestions,
      abbreviations: abbreviationDict,
      metadata: {
        documentId,
        documentTitle: normalizedDoc.filename,
        generatedAt: new Date().toISOString(),
        slideCount: slidesData.slides?.length || 0
      },
      fromCache: false
    });

  } catch (error) {
    console.error('❌ Error generating presentation slides:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate slides'
    });
  }
}
