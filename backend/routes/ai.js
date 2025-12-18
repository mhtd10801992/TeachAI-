import express from 'express';
import { aiController } from '../controllers/aiController.js';

const router = express.Router();

// Ask AI a question about a document
router.post('/ask', aiController.askQuestion);

// Get AI insights about document analysis
router.post('/insights', aiController.getInsights);

export default router;
