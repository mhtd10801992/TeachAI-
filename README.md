# TeachAI - AI Document Ingestion Platform

🚀 **Live Demo**: https://try1-7d848.web.app

A full-stack application for uploading, processing, and extracting insights from documents using AI.

## 🚀 Quick Start

### Local Development

```powershell
# Start both backend and frontend
.\start-dev.ps1
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

### Deploy to Production

```powershell
# Deploy frontend to Firebase Hosting
.\deploy.ps1
```

Your app will be live at: **https://try1-7d848.web.app**

📖 **Full deployment guide:** See [QUICKSTART_DEPLOY.md](QUICKSTART_DEPLOY.md)

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   AI Services   │
│   (React)       │    │   (Node.js)     │    │                 │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • File Upload   │───▶│ • File Storage  │───▶│ • OpenAI GPT    │
│ • Progress UI   │    │ • Text Extract  │    │ • Document OCR  │
│ • Results View  │◀───│ • AI Processing │◀───│ • Embeddings    │
│ • Search UI     │    │ • Vector Store  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Data Storage  │
                    ├─────────────────┤
                    │ • Firebase      │
                    │ • Pinecone DB   │
                    │ • Vector Index  │
                    └─────────────────┘
```

## 📊 **Complete Data Processing Flow**

### **Phase 1: File Upload & Storage**

```
1. User selects document (PDF, DOC, TXT, etc.)
2. Frontend validates file type and size
3. File uploaded to backend via multipart/form-data
4. Backend stores file in Firebase Storage
5. Unique file ID and metadata saved
```

### **Phase 2: Content Extraction**

```
6. Backend detects file type
7. Text extraction:
   - PDF: PDF-parse library
   - DOC: Mammoth.js library
   - Images: OCR with Tesseract.js
   - TXT: Direct reading
8. Extracted text cleaned and chunked
```

### **Phase 3: AI Processing**

```
9. Text sent to OpenAI GPT for:
   - Content summarization
   - Key concepts extraction
   - Topic classification
   - Sentiment analysis
10. Generated embeddings for similarity search
11. Structured data created (JSON format)
```

### **Phase 4: Vector Storage**

```
12. Document chunks converted to embeddings
13. Stored in Pinecone vector database
14. Indexed for fast similarity search
15. Metadata linked to original document
```

### **Phase 5: Query & Retrieval**

```
16. User submits question about documents
17. Question converted to embedding
18. Vector similarity search in Pinecone
19. Relevant chunks retrieved
20. AI generates contextual answer
21. Response with sources displayed
```

## 💡 **AI Processing Capabilities**

### **Document Analysis**

- **Summarization**: Auto-generate executive summaries
- **Key Topics**: Extract main themes and subjects
- **Entity Recognition**: Find people, places, organizations
- **Sentiment**: Analyze emotional tone
- **Classification**: Auto-categorize by document type

### **Smart Search**

- **Semantic Search**: Find meaning, not just keywords
- **Question Answering**: Ask natural language questions
- **Cross-Reference**: Find connections between documents
- **Similarity**: Find documents with similar content

### **Output Formats**

```json
{
  "document": {
    "id": "doc_123",
    "filename": "annual_report.pdf",
    "summary": "Company annual report showing 15% growth...",
    "topics": ["finance", "growth", "strategy"],
    "entities": ["Company XYZ", "John Smith", "New York"],
    "sentiment": "positive",
    "confidence": 0.95
  },
  "chunks": [
    {
      "text": "Revenue increased by 15% this quarter...",
      "embedding": [0.1, -0.3, 0.7, ...],
      "topics": ["revenue", "growth"]
    }
  ],
  "insights": {
    "key_metrics": ["15% growth", "$2M revenue"],
    "recommendations": ["Expand market", "Increase investment"]
  }
}
```

## Features

✅ React frontend with file upload
✅ Node.js backend with Express
✅ File upload pipeline with Multer
✅ Ready for Firebase Storage integration
✅ Ready for AI extraction (OpenAI)
✅ Ready for vector database integration (Pinecone)

## Project Structure

```
teachAI/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── Fileuploader.jsx
│   │   ├── api/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/                  # Node.js backend
│   ├── controllers/
│   │   └── uploadController.js
│   ├── middleware/
│   │   └── fileupload.js
│   ├── routes/
│   │   └── upload.js
│   ├── server.js
│   └── package.json
└── README.md
```

## Quick Start

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend runs on: http://localhost:5000

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: http://localhost:5173

## API Endpoints

- `POST /api/upload` - Upload file
- `GET /api/health` - Health check

## Environment Variables

Create `.env` in the backend folder:

```
OPENAI_API_KEY=your_openai_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENV=your_pinecone_env
PINECONE_INDEX=your_index_name
FIREBASE_SERVICE_ACCOUNT_JSON_PATH=./path/to/serviceAccountKey.json
FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
```

## Next Steps

1. Add Firebase Storage integration
2. Implement AI document extraction
3. Add vector database storage
4. Add document search functionality

## Tech Stack

- **Frontend**: React, Vite, Axios
- **Backend**: Node.js, Express, Multer
- **AI**: OpenAI (ready)
- **Vector DB**: Pinecone (ready)
- **Storage**: Firebase Storage (ready)

## 🔄 **Human-in-the-Loop Processing Flow**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Document      │    │   AI Analysis   │    │  User Review    │
│    Upload       │───▶│   Processing    │───▶│   & Editing     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Question      │◀───│   Validation    │◀───│  AI Confidence  │
│     Queue       │    │   Complete      │    │     Check       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│  Save for       │    │  Vectorization  │
│   Later         │    │   & Storage     │
└─────────────────┘    └─────────────────┘
```

### **Enhanced Phase 3: AI Processing with Human Validation**

```
9. AI processes document and assigns confidence scores
10. If confidence < threshold (e.g., 80%):
    - Flag for human review
    - Generate clarifying questions
    - Add to user's question queue
11. User reviews AI analysis:
    - Edit summaries if needed
    - Correct entity extraction
    - Verify topic classification
    - Answer AI's questions
12. User can save unclear items for later review
13. Upon user approval → proceed to vectorization
```

### **Phase 4: User Validation Interface**

```
14. Show side-by-side comparison:
    - Original text excerpt
    - AI interpretation
    - Edit controls
15. Highlight low-confidence items in yellow/red
16. Allow real-time editing of:
    - Summary text
    - Topic tags
    - Entity names and types
    - Sentiment classification
17. Question queue management
18. Batch approval for similar documents
```
