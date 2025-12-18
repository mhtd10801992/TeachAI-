// Document History Routes
import express from 'express';
import { 
  getAllDocuments, 
  getDocumentById, 
  deleteDocument,
  searchDocuments,
  getDocumentStats,
  updateDocumentAnalysis
} from '../controllers/documentController.js';

const router = express.Router();

// Get all documents
router.get('/', getAllDocuments);

// Search documents
router.get('/search', searchDocuments);

// Get document statistics
router.get('/stats', getDocumentStats);

// Get specific document by ID
router.get('/:id', getDocumentById);

// Update document analysis
router.put('/:id', updateDocumentAnalysis);

// Delete document by ID
router.delete('/:id', deleteDocument);

export default router;
