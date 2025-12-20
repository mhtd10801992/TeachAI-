import express from "express";
import cors from "cors";
import uploadRoutes from "./routes/upload.js";
import validationRoutes from "./routes/validation.js";
import documentRoutes from "./routes/documents.js";
import aiRoutes from "./routes/ai.js";
import { initializeFirebaseStorage } from "./services/firebaseStorageService.js";
import { initializeDocumentCache } from "./controllers/documentController.js";

const app = express();
app.use(cors());
app.use(express.json());

// Initialize storage systems
const initializeApp = async () => {
  console.log('🔥 Initializing Firebase Storage...');
  await initializeFirebaseStorage();
  await initializeDocumentCache();
  console.log('✅ Firebase Storage systems initialized');
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend is running',
    openaiConfigured: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-'),
    firebaseConfigured: !!process.env.FIREBASE_PROJECT_ID
  });
});

// Test endpoint for documents
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API is working',
    time: new Date().toISOString(),
    endpoints: ['/api/documents', '/api/upload', '/api/ai/ask']
  });
});

// Test OpenAI endpoint
app.get('/api/test-openai', async (req, res) => {
  try {
    const { processWithAI } = await import('./services/aiService.js');
    const testResult = await processWithAI('This is a test document to verify OpenAI integration is working correctly.', {
      summarize: true,
      extractTopics: false,
      findEntities: false,
      analyzeSentiment: false
    });
    res.json({
      success: true,
      message: 'OpenAI is working!',
      isMockResponse: testResult.summary.includes('configure your API key'),
      summary: testResult.summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
});

app.use("/api/upload", uploadRoutes);
app.use("/api/validation", validationRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/ai", aiRoutes);

// Start server with initialization
const startServer = async () => {
  await initializeApp();
  
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend running on http://localhost:${PORT}`);
    console.log("Available endpoints:");
    console.log("  POST /api/upload - Upload documents");
    console.log("  GET  /api/validation/pending - Get pending documents");
    console.log("  GET  /api/validation/questions - Get question queue");
    console.log("  GET  /api/documents - Get all documents");
    console.log("  GET  /api/documents/search - Search documents");
    console.log("  GET  /api/documents/stats - Get document statistics");
    console.log("  GET  /api/documents/:id - Get specific document");
    console.log("  POST /api/ai/ask - Ask AI questions about documents");
    console.log("  POST /api/ai/insights - Get AI insights about analysis");
    console.log("\n� Firebase Storage Location: gs://try1-7d848.firebasestorage.app/TeachAI/");
    console.log("  - TeachAI/documents/: Document metadata & AI analysis (JSON files)");
    console.log("  - TeachAI/uploads/: Original uploaded files");
    console.log("  - TeachAI/metadata/: Additional metadata storage");
  });
};

startServer().catch(console.error);
