// API route for accessing document metadata for chat and AI processing
import express from 'express';
import { getDocumentFromFirebase } from '../services/firebaseStorageService.js';
import { queryMetadataForContext, getTopicDetails } from '../services/documentMetadataService.js';
import OpenAI from 'openai';

const router = express.Router();

// Initialize OpenAI
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Helper to find document
const findDocument = async (id) => {
  try {
    return await getDocumentFromFirebase(id);
  } catch (error) {
    return null;
  }
};

// Get metadata for a specific document
router.get('/documents/:id/metadata', async (req, res) => {
  try {
    const { id } = req.params;
    
    const document = await findDocument(id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const metadata = document.document?.metadata;
    if (!metadata) {
      return res.status(404).json({ error: 'Metadata not available for this document' });
    }

    res.json({
      success: true,
      metadata: metadata
    });
  } catch (error) {
    console.error('Error fetching metadata:', error);
    res.status(500).json({ error: 'Failed to fetch metadata' });
  }
});

// Query metadata for context-aware responses
router.post('/documents/:id/metadata/query', async (req, res) => {
  try {
    const { id } = req.params;
    const { query, limit = 5 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const document = await findDocument(id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const metadata = document.document?.metadata;
    if (!metadata) {
      return res.status(404).json({ error: 'Metadata not available' });
    }

    const results = queryMetadataForContext(metadata, query, limit);

    res.json({
      success: true,
      query: query,
      results: results
    });
  } catch (error) {
    console.error('Error querying metadata:', error);
    res.status(500).json({ error: 'Failed to query metadata' });
  }
});

// Get detailed information about a specific topic
router.get('/documents/:id/topics/:topicName', async (req, res) => {
  try {
    const { id, topicName } = req.params;
    const decodedTopic = decodeURIComponent(topicName);

    const document = await findDocument(id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const metadata = document.document?.metadata;
    if (!metadata) {
      return res.status(404).json({ error: 'Metadata not available' });
    }

    const details = getTopicDetails(metadata, decodedTopic);

    res.json({
      success: true,
      topicDetails: details
    });
  } catch (error) {
    console.error('Error fetching topic details:', error);
    res.status(500).json({ error: 'Failed to fetch topic details' });
  }
});

// Get all extracted tokens from a document
router.get('/documents/:id/tokens', async (req, res) => {
  try {
    const { id } = req.params;

    const document = await findDocument(id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const metadata = document.document?.metadata;
    if (!metadata) {
      return res.status(404).json({ error: 'Metadata not available' });
    }

    res.json({
      success: true,
      tokens: metadata.tokens,
      tags: metadata.tags
    });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    res.status(500).json({ error: 'Failed to fetch tokens' });
  }
});

// Get document structure (sections, headings, key phrases)
router.get('/documents/:id/structure', async (req, res) => {
  try {
    const { id } = req.params;

    const document = await findDocument(id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const metadata = document.document?.metadata;
    if (!metadata) {
      return res.status(404).json({ error: 'Metadata not available' });
    }

    res.json({
      success: true,
      structure: metadata.structure
    });
  } catch (error) {
    console.error('Error fetching structure:', error);
    res.status(500).json({ error: 'Failed to fetch structure' });
  }
});

// Get searchable index for a document
router.get('/documents/:id/index', async (req, res) => {
  try {
    const { id } = req.params;

    const document = await findDocument(id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const metadata = document.document?.metadata;
    if (!metadata) {
      return res.status(404).json({ error: 'Metadata not available' });
    }

    res.json({
      success: true,
      index: metadata.index
    });
  } catch (error) {
    console.error('Error fetching index:', error);
    res.status(500).json({ error: 'Failed to fetch index' });
  }
});

// Get extracted numeric data from a document
router.get('/documents/:id/numbers', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📊 Fetching numeric data for document: ${id}`);

    const document = await findDocument(id);
    if (!document) {
      console.log(`❌ Document not found: ${id}`);
      return res.status(404).json({ error: 'Document not found' });
    }

    console.log(`✅ Document found:`, {
      id: document.id,
      hasDocument: !!document.document,
      hasMetadata: !!document.document?.metadata,
      metadataKeys: document.document?.metadata ? Object.keys(document.document.metadata) : []
    });

    const metadata = document.document?.metadata;
    if (!metadata) {
      console.log(`⚠️ No metadata available for document ${id}`);
      return res.status(404).json({ 
        error: 'Metadata not available',
        message: 'This document was uploaded before numeric extraction was implemented. Please re-upload the document.'
      });
    }

    const numericData = metadata.numericData || [];
    console.log(`✅ Numeric data found: ${numericData.length} items`);

    res.json({
      success: true,
      numericData: numericData,
      statistics: {
        total: numericData.length,
        byType: numericData.reduce((acc, item) => {
          acc[item.type] = (acc[item.type] || 0) + 1;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('❌ Error fetching numeric data:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch numeric data',
      details: error.message 
    });
  }
});

// Get extracted scientific equations from a document
router.get('/documents/:id/equations', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🧮 Fetching equations for document: ${id}`);

    const document = await findDocument(id);
    if (!document) {
      console.log(`❌ Document not found: ${id}`);
      return res.status(404).json({ error: 'Document not found' });
    }

    console.log(`✅ Document found:`, {
      id: document.id,
      hasDocument: !!document.document,
      hasMetadata: !!document.document?.metadata
    });

    const metadata = document.document?.metadata;
    if (!metadata) {
      console.log(`⚠️ No metadata available for document ${id}`);
      return res.status(404).json({ 
        error: 'Metadata not available',
        message: 'This document was uploaded before equation extraction was implemented. Please re-upload the document.'
      });
    }

    const equations = metadata.equations || [];
    console.log(`✅ Equations found: ${equations.length} items`);

    res.json({
      success: true,
      equations: equations,
      statistics: {
        total: equations.length,
        withGreekLetters: equations.filter(e => e.features?.hasGreekLetters).length,
        withSuperscripts: equations.filter(e => e.features?.hasSuperscripts).length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching equations:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch equations',
      details: error.message 
    });
  }
});

// Process equations and numeric data on-demand
router.post('/documents/:id/process-analysis', async (req, res) => {
  try {
    const { id } = req.params;
    const { processEquations = true, processNumeric = true } = req.body;

    // Get document from Firebase
    const { getDocumentFromFirebase, saveDocumentToFirebase } = await import('../services/firebaseStorageService.js');
    const document = await getDocumentFromFirebase(id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    let updated = false;
    const results = { equations: null, numeric: null };

    // Process equations if requested
    if (processEquations && document.document?.metadata?.equations) {
      const { composeAndExplainEquations } = await import('../services/documentMetadataService.js');
      const rawEquations = document.document.metadata.equations;
      const processedEquations = await composeAndExplainEquations(rawEquations, false);
      
      document.document.metadata.equations = processedEquations;
      results.equations = processedEquations.length;
      updated = true;
    }

    // Process numeric data if requested
    if (processNumeric && document.document?.metadata?.numericData) {
      const { generateNumericExplanations } = await import('../services/documentMetadataService.js');
      const rawNumeric = document.document.metadata.numericData;
      const processedNumeric = await generateNumericExplanations(rawNumeric);
      
      document.document.metadata.numericData = processedNumeric;
      results.numeric = processedNumeric.length;
      updated = true;
    }

    // Save updated document back to Firebase
    if (updated) {
      await saveDocumentToFirebase(document);
    }

    res.json({
      success: true,
      message: 'Analysis processed successfully',
      processed: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing analysis:', error);
    res.status(500).json({ error: 'Failed to process analysis', message: error.message });
  }
});

// Generate AI explanation for a specific equation
router.post('/documents/:id/equations/explain', async (req, res) => {
  try {
    const { id } = req.params;
    const { equation, sentence } = req.body;
    
    if (!equation) {
      return res.status(400).json({ error: 'Equation is required' });
    }
    
    if (!openai) {
      return res.status(503).json({ 
        error: 'AI service not available',
        message: 'OpenAI API key not configured' 
      });
    }
    
    console.log(`🤖 Generating AI explanation for equation: ${equation}`);
    
    const prompt = `Explain the mathematical relationship in the equation "${equation}"${sentence ? ` using this context:\n"${sentence}"` : ''}

Provide a clear, concise explanation (max 30 words) of what this equation represents and calculates.`;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 80
    });
    
    const explanation = response.choices[0].message.content.trim();
    console.log(`✅ Generated explanation: ${explanation}`);
    
    res.json({
      success: true,
      equation,
      explanation,
      context: sentence || 'No context provided'
    });
  } catch (error) {
    console.error('❌ Error generating equation explanation:', error);
    res.status(500).json({ 
      error: 'Failed to generate explanation',
      details: error.message 
    });
  }
});

export default router;
