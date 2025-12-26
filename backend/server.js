// WORKAROUND: Manually set the API key
process.env.GOOGLE_API_KEY = "AIzaSyDYqI-0cnhNxhtMZ7G2tWmqymN6YCw9Qhg";

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import uploadRoutes from "./routes/upload.js";
import validationRoutes from "./routes/validation.js";
import documentRoutes from "./routes/documents.js";
import aiRoutes from "./routes/ai.js";
import webRoutes from "./routes/web.js";
import { initializeFirebaseStorage } from "./services/firebaseStorageService.js";
import { initializeDocumentCache } from "./controllers/documentController.js";

dotenv.config();

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

const startServer = async () => {
  await initializeApp();
  
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
};

startServer().catch(console.error);
