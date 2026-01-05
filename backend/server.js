



import dotenv from "dotenv";
dotenv.config();

// Register canvas globally for pdf-parse to use
import { createCanvas } from 'canvas';
global.Canvas = createCanvas;

// Updated: 2026-01-05 - OpenAI API key secret refreshed

import express from "express";
import cors from "cors";
import uploadRoutes from "./routes/upload.js";
import validationRoutes from "./routes/validation.js";
import documentRoutes from "./routes/documents.js";
import aiRoutes from "./routes/ai.js";
import webRoutes from "./routes/web.js";
import metadataRoutes from "./routes/metadata.js";
import mindMapRoutes from "./routes/mindmap.js";
import { initializeFirebaseStorage } from "./services/firebaseStorageService.js";
import { initializeDocumentCache } from "./controllers/documentController.js";

const app = express();
app.use(cors());
app.use(express.json());

const initializeApp = async () => {
  console.log('🔥 Initializing Firebase Storage...');
  await initializeFirebaseStorage();
  await initializeDocumentCache();
  console.log('✅ Firebase Storage systems initialized');
};

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend is running',
    googleAIConfigured: !!process.env.GOOGLE_API_KEY,
    firebaseConfigured: !!process.env.FIREBASE_PROJECT_ID
  });
});

app.use("/api/upload", uploadRoutes);
app.use("/api/validation", validationRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/web", webRoutes);
app.use("/api/metadata", metadataRoutes);
app.use("/api/mindmap", mindMapRoutes);

const startServer = async () => {
  try {
    console.log('Starting initialization...');
    await initializeApp();
    console.log('Initialization complete, starting listen...');
    
    const PORT = process.env.PORT || 4000;
    console.log(`About to call app.listen on port ${PORT}...`);
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Backend running on http://localhost:${PORT}`);
      console.log(`✅ Access at http://127.0.0.1:${PORT}`);
    });
    
    console.log('app.listen called, waiting for connection...');
    
    server.on('listening', () => {
      console.log('✅ Server is now listening!');
    });
    
    server.on('error', (err) => {
      console.error('❌ Server error:', err.message);
      console.error(err);
    });
  } catch (error) {
    console.error('❌ Server startup error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

startServer().catch(console.error);
