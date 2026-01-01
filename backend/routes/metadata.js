// API route for accessing document metadata for chat and AI processing
import express from 'express';
import { getDocumentFromFirebase } from '../services/firebaseStorageService.js';
import { queryMetadataForContext, getTopicDetails } from '../services/documentMetadataService.js';

const router = express.Router();

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

export default router;
