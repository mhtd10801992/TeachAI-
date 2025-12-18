import express from "express";
import cors from "cors";
import uploadRoutes from "./routes/upload.js";

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running' });
});

app.use("/api/upload", uploadRoutes);

app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});
