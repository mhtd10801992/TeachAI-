import express from 'express';
import { aiController } from '../controllers/aiController.js';

const router = express.Router();

// NEW: Test AI connection
router.get('/test', aiController.testAI);

// NEW: List available AI models
router.get('/models', aiController.listModels);

// Ask AI a question about a document
router.post('/ask', aiController.askQuestion);

// Get AI insights about document analysis
router.post('/insights', aiController.getInsights);

// Get AI clarification for validation points
router.post('/clarify', aiController.clarify);

// Get explanation about how AI analysis works
router.post('/explain', aiController.explain);

export default router;
