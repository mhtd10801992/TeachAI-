# TeachAI - AI Document Ingestion Platform

A full-stack application for uploading, processing, and extracting insights from documents using AI.

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
