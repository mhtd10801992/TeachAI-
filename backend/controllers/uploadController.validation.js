// Enhanced Upload Controller with Human-in-the-Loop Validation
import { uploadToFirebase } from '../services/firebaseService.js';
import { extractTextFromFile } from '../services/textExtractor.js';
import { processWithAI } from '../services/aiService.js';
import { storeInVectorDB } from '../services/vectorService.js';

export const handleUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.file;
    const fileId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Phase 1: Store file in Firebase
    const firebaseUrl = await uploadToFirebase(file, fileId);
    
    // Phase 2: Extract text content
    const extractedText = await extractTextFromFile(file);
    
    // Phase 3: Process with AI and generate confidence scores
    const aiAnalysis = await processWithAI(extractedText, {
      summarize: true,
      extractTopics: true,
      findEntities: true,
      analyzeSentiment: true,
      generateQuestions: true // New: AI generates questions when uncertain
    });
    
    // Phase 4: Determine if human validation is needed
    const needsValidation = requiresHumanValidation(aiAnalysis);
    
    if (needsValidation) {
      // Store document in pending validation state
      await savePendingDocument({
        id: fileId,
        filename: file.originalname,
        text: extractedText,
        aiAnalysis,
        status: 'pending_validation',
        createdAt: new Date().toISOString()
      });
      
      res.json({
        success: true,
        status: 'pending_validation',
        document: {
          id: fileId,
          filename: file.originalname,
          requiresReview: true,
          
          // AI Analysis with confidence scores
          analysis: {
            summary: {
              text: aiAnalysis.summary,
              confidence: aiAnalysis.summaryConfidence,
              needsReview: aiAnalysis.summaryConfidence < 0.8
            },
            topics: {
              items: aiAnalysis.topics,
              confidence: aiAnalysis.topicsConfidence,
              needsReview: aiAnalysis.topicsConfidence < 0.7
            },
            entities: {
              items: aiAnalysis.entities,
              confidence: aiAnalysis.entitiesConfidence,
              needsReview: aiAnalysis.entitiesConfidence < 0.75
            },
            sentiment: {
              value: aiAnalysis.sentiment,
              confidence: aiAnalysis.sentimentConfidence,
              needsReview: aiAnalysis.sentimentConfidence < 0.6
            }
          },
          
          // AI-generated questions for clarification
          questions: aiAnalysis.questions || [],
          
          // Text excerpts for context
          textExcerpts: generateTextExcerpts(extractedText, aiAnalysis),
          
          // Next steps for user
          nextSteps: [
            "Review AI analysis accuracy",
            "Edit any incorrect information",
            "Answer AI questions if needed",
            "Approve for vectorization"
          ]
        }
      });
    } else {
      // High confidence - proceed directly to vectorization
      const vectorResult = await storeInVectorDB({
        documentId: fileId,
        text: extractedText,
        analysis: aiAnalysis,
        metadata: {
          filename: file.originalname,
          autoApproved: true,
          confidence: aiAnalysis.overallConfidence
        }
      });
      
      res.json({
        success: true,
        status: 'processed',
        document: {
          id: fileId,
          filename: file.originalname,
          autoApproved: true,
          vectorized: true,
          confidence: aiAnalysis.overallConfidence,
          summary: aiAnalysis.summary,
          topics: aiAnalysis.topics
        }
      });
    }
    
  } catch (error) {
    console.error('Upload processing error:', error);
    res.status(500).json({ 
      error: "Upload processing failed",
      details: error.message
    });
  }
};

// Determine if human validation is required
const requiresHumanValidation = (analysis) => {
  const confidenceThresholds = {
    summary: 0.8,
    topics: 0.7,
    entities: 0.75,
    sentiment: 0.6,
    overall: 0.75
  };
  
  return (
    analysis.summaryConfidence < confidenceThresholds.summary ||
    analysis.topicsConfidence < confidenceThresholds.topics ||
    analysis.entitiesConfidence < confidenceThresholds.entities ||
    analysis.sentimentConfidence < confidenceThresholds.sentiment ||
    analysis.overallConfidence < confidenceThresholds.overall ||
    analysis.questions.length > 0 // AI has questions
  );
};

// Generate relevant text excerpts for user context
const generateTextExcerpts = (text, analysis) => {
  const excerpts = [];
  
  // Add excerpts around entities
  analysis.entities.forEach(entity => {
    const index = text.toLowerCase().indexOf(entity.name.toLowerCase());
    if (index !== -1) {
      const start = Math.max(0, index - 50);
      const end = Math.min(text.length, index + entity.name.length + 50);
      excerpts.push({
        type: 'entity',
        entity: entity.name,
        text: '...' + text.substring(start, end) + '...',
        highlight: entity.name
      });
    }
  });
  
  // Add excerpts for topic-relevant sections
  analysis.topics.forEach(topic => {
    const index = text.toLowerCase().indexOf(topic.toLowerCase());
    if (index !== -1) {
      const start = Math.max(0, index - 100);
      const end = Math.min(text.length, index + topic.length + 100);
      excerpts.push({
        type: 'topic',
        topic: topic,
        text: '...' + text.substring(start, end) + '...',
        highlight: topic
      });
    }
  });
  
  return excerpts.slice(0, 5); // Limit to 5 most relevant excerpts
};

// Save document awaiting validation
const savePendingDocument = async (docData) => {
  // This would save to your database (MongoDB, PostgreSQL, etc.)
  // For now, using in-memory storage (implement with your DB)
  global.pendingDocuments = global.pendingDocuments || new Map();
  global.pendingDocuments.set(docData.id, docData);
};
