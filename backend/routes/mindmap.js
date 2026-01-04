// Mind Map Routes
import express from 'express';
import { 
  categorizeAndGenerateMindMaps,
  getAvailableDocuments,
  getSavedMindMaps,
  loadMindMap,
  analyzeFactor
} from '../controllers/mindMapController.js';

const router = express.Router();

// Get all available documents for selection
router.get('/documents', getAvailableDocuments);

// Get all saved mind maps
router.get('/saved', getSavedMindMaps);

// Load a specific saved mind map
router.get('/saved/:mindMapId', loadMindMap);

// Categorize documents and generate mind maps
router.post('/categorize', categorizeAndGenerateMindMaps);

// Analyze a specific factor with AI
router.post('/analyze-factor', analyzeFactor);

export default router;
