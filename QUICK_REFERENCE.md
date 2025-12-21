# Quick Reference: Data Format & Storage

## 📋 Cheat Sheet

### JSON Document Format

```json
{
  "success": true,
  "status": "processed",
  "category": "Automotive",
  "tags": ["cost", "lean", "manufacturing"],

  "document": {
    "id": "doc_1766273014198_rku3hipqo",
    "filename": "report.txt",
    "size": 20427,
    "uploadDate": "2025-12-20T23:23:41.842Z",
    "firebaseUrl": "https://...",
    "firebasePath": "TeachAI/uploads/...",

    "analysis": {
      "summary": { "text": "...", "confidence": 0.95, "needsReview": false },
      "topics": { "items": [...], "confidence": 0.88, "needsReview": false },
      "entities": { "items": [...], "confidence": 0.6, "needsReview": true },
      "sentiment": { "value": "neutral", "confidence": 0.8, "needsReview": false }
    },

    "questions": [],
    "processingTime": 7213,
    "vectorized": true
  },

  "createdAt": "2025-12-20T23:23:41.842Z",
  "updatedAt": "2025-12-20T23:23:41.842Z"
}
```

## 🔑 Key Concepts

### Vector Embeddings

- **What**: Text converted to 1536 numbers
- **Model**: `text-embedding-3-small`
- **Purpose**: Semantic similarity search
- **Example**: `[0.023, -0.045, 0.012, ...]`

### Confidence Scores

- **High**: ≥ 0.8 (Reliable, no review)
- **Medium**: 0.6-0.79 (Good, optional review)
- **Low**: < 0.6 (Needs human review)

### Categories

- 🚗 Automotive
- 🌍 Environmental
- 🏭 Manufacturing
- 💻 Technology
- 📋 Policy & Regulation
- 📁 General

## 🗂️ Storage Locations

### Firebase Storage

```
gs://try1-7d848.firebasestorage.app/
└── TeachAI/
    ├── uploads/          # Raw files
    │   ├── doc_xxx.txt
    │   └── doc_yyy.pdf
    └── documents/        # Metadata JSON
        ├── doc_xxx.json
        └── doc_yyy.json
```

### Memory Cache

```javascript
// Backend: controllers/documentController.js
let documentHistory = [
  { document: {...}, category: "...", createdAt: "..." },
  { document: {...}, category: "...", createdAt: "..." }
];
```

## 🔌 API Endpoints

```
GET  /api/documents                    # Get all documents
GET  /api/documents?category=Automotive # Filter by category
GET  /api/documents/search?query=cost  # Search documents
GET  /api/documents/:id                # Get specific document
POST /api/upload                        # Upload new document
DELETE /api/documents/:id              # Delete document

POST /api/ai/ask                        # Chat with AI
POST /api/ai/insights                   # Get AI insights
```

## 🤖 OpenAI Models Used

| Task       | Model                  | Max Tokens | Purpose                   |
| ---------- | ---------------------- | ---------- | ------------------------- |
| Summary    | gpt-4o-mini            | 150        | 2-3 sentence summary      |
| Topics     | gpt-4o-mini            | 100        | Extract 3-5 topics        |
| Entities   | gpt-4o-mini            | 200        | Named entity recognition  |
| Sentiment  | gpt-4o-mini            | 10         | Positive/Negative/Neutral |
| Embeddings | text-embedding-3-small | -          | 1536-dim vectors          |
| Chat       | gpt-3.5-turbo          | 600        | Answer questions          |

## 📝 Data Flow Summary

```
Upload → Extract → AI Process → Structure → Store → Retrieve → Chat
  ↓         ↓          ↓            ↓         ↓        ↓        ↓
File     Text     OpenAI API    JSON     Firebase  Memory   Answer
```

## 🔍 Search Types

1. **Keyword**: Search filename, summary, topics
2. **Category**: Filter by auto-detected category
3. **Semantic**: Vector similarity (embeddings)
4. **AI-Powered**: Natural language queries

## 💡 Learning Resources

| Topic             | Resource                            |
| ----------------- | ----------------------------------- |
| JSON              | json.org                            |
| OpenAI API        | platform.openai.com/docs            |
| Firebase Storage  | firebase.google.com/docs/storage    |
| Vector Embeddings | pinecone.io/learn/vector-embeddings |
| REST APIs         | restfulapi.net                      |

## 🛠️ Code Locations

| Feature             | File                                         |
| ------------------- | -------------------------------------------- |
| Upload Processing   | `backend/controllers/uploadController.js`    |
| AI Analysis         | `backend/services/aiService.js`              |
| Document Management | `backend/controllers/documentController.js`  |
| Storage             | `backend/services/firebaseStorageService.js` |
| AI Chat             | `backend/controllers/aiController.js`        |
| Frontend Chat       | `frontend/src/components/AIChat.jsx`         |

## 📊 Typical Processing Times

| Operation       | Time       |
| --------------- | ---------- |
| File Upload     | 100-200ms  |
| Text Extraction | 100-500ms  |
| AI Analysis     | 5-10s      |
| Categorization  | 50ms       |
| Storage         | 100ms      |
| **Total**       | **~7-10s** |

## 🎯 Quick Commands

### View Documents

```powershell
# Test API
curl http://localhost:5000/api/documents

# Filter by category
curl "http://localhost:5000/api/documents?category=Automotive"

# Search
curl "http://localhost:5000/api/documents/search?query=cost"
```

### Check Structure

```javascript
// In browser console (frontend)
API.get("/documents").then((res) => console.log(res.data));

// View specific document
API.get("/documents/doc_xxx").then((res) => console.log(res.data));
```

## 🔐 Environment Variables

```bash
# Backend .env
OPENAI_API_KEY=sk-your-key-here
PORT=5000
FIREBASE_PROJECT_ID=try1-7d848
FIREBASE_STORAGE_BUCKET=try1-7d848.firebasestorage.app

# Frontend .env
VITE_API_URL=http://localhost:5000/api
```

## 🚀 Quick Start

1. **Start Backend**: `cd backend && npm start`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Upload Document**: Use Upload tab
4. **Chat with AI**: Use AI Chat tab
5. **View Data**: Check browser console

---

**Need More Details?**

- Full Guide: `DATA_ARCHITECTURE_GUIDE.md`
- Visual Diagrams: `VISUAL_ARCHITECTURE.md`
- User Workflow: `AI_CHAT_WORKFLOW_GUIDE.md`
