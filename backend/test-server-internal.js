import express from 'express';
import fetch from 'node-fetch';

const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = 4001;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server started on port ${PORT}`);
  
  // Test connection from within the process
  setTimeout(async () => {
    try {
      const response = await fetch(`http://localhost:${PORT}/health`);
      const data = await response.json();
      console.log(`✅ Internal connection successful:`, data);
    } catch (err) {
      console.error(`❌ Internal connection failed:`, err.message);
    }
  }, 1000);
});
