// Validation Routes - API endpoints for human-in-the-loop workflow
import express from "express";
import {
  getDocumentForValidation,
  updateDocumentValidation,
  approveDocumentForVectorization,
  saveQuestionForLater,
  getUserQuestionQueue,
  answerQueuedQuestions,
  getPendingDocuments
} from "../controllers/validationController.js";

const router = express.Router();

// Document validation workflow
router.get("/pending", getPendingDocuments);                    // GET /api/validation/pending
router.get("/document/:documentId", getDocumentForValidation);   // GET /api/validation/document/123
router.put("/document/:documentId", updateDocumentValidation);   // PUT /api/validation/document/123
router.post("/document/:documentId/approve", approveDocumentForVectorization); // POST /api/validation/document/123/approve

// Question queue management  
router.get("/questions", getUserQuestionQueue);                  // GET /api/validation/questions
router.post("/document/:documentId/questions", saveQuestionForLater); // POST /api/validation/document/123/questions
router.put("/questions/:queueId/answer", answerQueuedQuestions); // PUT /api/validation/questions/q_456/answer

export default router;
