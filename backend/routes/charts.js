// Chart Generation Routes
import express from 'express';
import { 
  suggestChartsFromMetadata,
  generateEquationPlot,
  compareDocumentsMetadata
} from '../services/chartGenerationService.js';
import { getDocumentFromFirebase } from '../services/firebaseStorageService.js';

const router = express.Router();

/**
 * POST /api/charts/suggest
 * Analyze document metadata and suggest charts
 */
router.post('/suggest', async (req, res) => {
  try {
    const { metadata } = req.body;
    
    if (!metadata) {
      return res.status(400).json({ 
        error: 'Missing metadata',
        message: 'Please provide document metadata' 
      });
    }
    
    console.log('📊 Generating chart suggestions...');
    const suggestions = await suggestChartsFromMetadata(metadata);
    
    console.log(`✅ Generated ${suggestions.length} chart suggestions`);
    res.json({
      success: true,
      suggestions,
      count: suggestions.length
    });
    
  } catch (error) {
    console.error('❌ Error suggesting charts:', error);
    res.status(500).json({ 
      error: 'Chart suggestion failed',
      details: error.message 
    });
  }
});

/**
 * POST /api/charts/suggest-from-document
 * Get chart suggestions for a specific document
 */
router.post('/suggest-from-document', async (req, res) => {
  try {
    const { documentId } = req.body;
    
    if (!documentId) {
      return res.status(400).json({ 
        error: 'Missing documentId',
        message: 'Please provide a document ID' 
      });
    }
    
    console.log(`📊 Fetching document ${documentId} for chart generation...`);
    const document = await getDocumentFromFirebase(documentId);
    
    if (!document || !document.document) {
      return res.status(404).json({ 
        error: 'Document not found',
        message: `Document ${documentId} not found` 
      });
    }
    
    const metadata = document.document.metadata;
    
    if (!metadata) {
      return res.status(400).json({ 
        error: 'No metadata found',
        message: 'Document does not have metadata. Please re-upload the document.' 
      });
    }
    
    console.log('📊 Generating chart suggestions from document...');
    const suggestions = await suggestChartsFromMetadata(metadata);
    
    console.log(`✅ Generated ${suggestions.length} chart suggestions`);
    res.json({
      success: true,
      documentId,
      filename: document.document.filename,
      suggestions,
      count: suggestions.length
    });
    
  } catch (error) {
    console.error('❌ Error suggesting charts from document:', error);
    res.status(500).json({ 
      error: 'Chart suggestion failed',
      details: error.message 
    });
  }
});

/**
 * POST /api/charts/plot-equation
 * Generate a plot for a specific equation
 */
router.post('/plot-equation', async (req, res) => {
  try {
    const { equation, variables, range } = req.body;
    
    if (!equation || !variables) {
      return res.status(400).json({ 
        error: 'Missing parameters',
        message: 'Please provide equation and variables' 
      });
    }
    
    console.log(`📊 Generating plot for equation: ${equation}`);
    const plot = await generateEquationPlot(equation, variables, range);
    
    if (!plot) {
      return res.status(400).json({ 
        error: 'Plot generation failed',
        message: 'Could not generate plot for this equation' 
      });
    }
    
    console.log('✅ Plot generated successfully');
    res.json({
      success: true,
      plot
    });
    
  } catch (error) {
    console.error('❌ Error plotting equation:', error);
    res.status(500).json({ 
      error: 'Equation plot failed',
      details: error.message 
    });
  }
});

/**
 * POST /api/charts/compare-documents
 * Generate comparison charts for multiple documents
 */
router.post('/compare-documents', async (req, res) => {
  try {
    const { documentIds } = req.body;
    
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length < 2) {
      return res.status(400).json({ 
        error: 'Invalid documentIds',
        message: 'Please provide at least 2 document IDs as an array' 
      });
    }
    
    console.log(`📊 Fetching ${documentIds.length} documents for comparison...`);
    
    const documentsMetadata = [];
    for (const docId of documentIds) {
      try {
        const doc = await getDocumentFromFirebase(docId);
        if (doc && doc.document) {
          documentsMetadata.push({
            id: docId,
            filename: doc.document.filename,
            metadata: doc.document.metadata
          });
        }
      } catch (err) {
        console.warn(`⚠️ Could not fetch document ${docId}:`, err.message);
      }
    }
    
    if (documentsMetadata.length < 2) {
      return res.status(400).json({ 
        error: 'Insufficient documents',
        message: 'Could not fetch at least 2 documents for comparison' 
      });
    }
    
    console.log('📊 Generating comparison charts...');
    const charts = compareDocumentsMetadata(documentsMetadata);
    
    console.log(`✅ Generated ${charts.length} comparison charts`);
    res.json({
      success: true,
      charts,
      documentCount: documentsMetadata.length,
      documents: documentsMetadata.map(d => ({
        id: d.id,
        filename: d.filename
      }))
    });
    
  } catch (error) {
    console.error('❌ Error comparing documents:', error);
    res.status(500).json({ 
      error: 'Document comparison failed',
      details: error.message 
    });
  }
});

export default router;
