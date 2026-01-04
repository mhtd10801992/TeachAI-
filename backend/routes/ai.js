
import express from 'express';
import { aiController } from '../controllers/aiController.js';

const router = express.Router();

// Extract linked information as Mermaid code
router.post('/mermaid-graph', aiController.mermaidGraph);
// Extract factor list for DOE
router.post('/doe-factors', aiController.doeFactors);

// Extract actionable steps from a document
router.post('/actionable-steps', aiController.actionableSteps);

// Generate and persist a full mind map (concepts + relationships) for a document
router.post('/mind-map', aiController.mindMap);

// Extract strict concepts/knowledge-graph JSON for a document
router.post('/concept-graph', aiController.conceptGraph);

// Normalize a concept graph (merge duplicates, clean up)
router.post('/normalize-graph', aiController.normalizeGraph);

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

// Explain a single parsed/AI section in context of its document
router.post('/section-explain', aiController.sectionExplain);

// LLM-powered graph interaction endpoints
router.post('/graph/explain-concept', aiController.explainGraphConcept);
router.post('/graph/compare-concepts', aiController.compareGraphConcepts);
router.post('/graph/reasoning-chain', aiController.explainGraphReasoningChain);
router.post('/graph/generate-quiz', aiController.generateGraphQuiz);

// Analyze selected images with AI
router.post('/analyze-images', aiController.analyzeSelectedImages);

// Get system status and service health
router.get('/status', aiController.systemStatus);

export default router;
