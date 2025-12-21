# TeachAI Data Architecture & Storage Guide

## 🎯 Overview

This guide explains how TeachAI processes, analyzes, and stores documents using AI, and how that data is later retrieved and used.

---

## 📊 Complete Data Flow Pipeline

```
USER UPLOADS FILE
     ↓
1. FILE UPLOAD (Firebase Storage)
     ↓
2. TEXT EXTRACTION
     ↓
3. AI PROCESSING (OpenAI)
     ↓
4. DATA STRUCTURING
     ↓
5. STORAGE (Firebase + Memory Cache)
     ↓
6. RETRIEVAL & SEARCH
     ↓
7. AI CHAT USAGE
```

---

## 🔍 Detailed Step-by-Step Process

### **Step 1: File Upload to Firebase Storage**

**Location:** `backend/controllers/uploadController.js`

```javascript
// User uploads file via API
POST / api / upload;

// System generates unique ID
const fileId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
// Example: "doc_1766273014198_rku3hipqo"

// File is saved to Firebase Storage
await saveUploadedFileToFirebase(file, fileId);
// Stored at: gs://try1-7d848.firebasestorage.app/TeachAI/uploads/{fileId}.txt
```

**Storage Format:**

- **Raw File**: Original document stored in Firebase Storage
- **Path**: `TeachAI/uploads/doc_xxx.txt`
- **URL**: Signed URL with long expiration (valid until 2491!)

---

### **Step 2: Text Extraction**

```javascript
const extractedText = await extractTextFromBuffer(file);
```

**Process:**

- PDF → Text using pdf-parse
- DOCX → Text using mammoth
- TXT → Direct read
- Other → Text conversion

---

### **Step 3: AI Processing with OpenAI**

**Location:** `backend/services/aiService.js`

#### **3.1 Summary Generation**

```javascript
const summary = await generateSummary(text);

// OpenAI Call
{
  model: "gpt-4o-mini",
  messages: [
    {
      role: "system",
      content: "You are a professional document analyzer..."
    },
    {
      role: "user",
      content: text.substring(0, 4000) // First 4000 chars
    }
  ],
  max_tokens: 150
}

// Returns: "Reducing manufacturing costs in the automotive industry..."
```

#### **3.2 Topic Extraction**

```javascript
const topics = await extractTopics(text);

// OpenAI Call
{
  model: "gpt-4o-mini",
  messages: [
    {
      role: "system",
      content: "Extract 3-5 main topics. Return JSON array of strings."
    }
  ],
  max_tokens: 100
}

// Returns:
[
  "Cost reduction in the automotive industry",
  "Kaizen and Lean methodologies",
  "Technological innovation",
  "Sustainability and ESG considerations",
  "Operational excellence and productivity"
]
```

#### **3.3 Entity Recognition**

```javascript
const entities = await findEntities(text);

// OpenAI Call
{
  role: "system",
  content: "Extract named entities (people, orgs, locations). Return JSON."
}

// Returns:
[
  { name: "Toyota", type: "organization" },
  { name: "John Smith", type: "person" },
  { name: "Detroit", type: "location" }
]
```

#### **3.4 Sentiment Analysis**

```javascript
const sentiment = await analyzeSentiment(text);

// Returns: "positive" | "negative" | "neutral"
```

#### **3.5 Vector Embeddings (For Semantic Search)**

```javascript
// Text is chunked into 1000-character pieces
const chunks = chunkText(text, 1000);

// Each chunk gets an embedding (1536-dimensional vector)
const embedding = await generateEmbedding(chunk);

// OpenAI Call
{
  model: "text-embedding-3-small",
  input: chunkText
}

// Returns: [0.0234, -0.0453, 0.0123, ... 1536 numbers total]
```

**What are Embeddings?**
Embeddings convert text into numbers that capture meaning:

- Similar texts have similar numbers
- Enables semantic search (find by meaning, not just keywords)
- Used for "All Documents" mode to find relevant content

---

### **Step 4: Data Structuring**

**Location:** `backend/controllers/uploadController.js`

The AI results are structured into a standardized format:

```javascript
const documentData = {
  success: true,
  status: "processed",
  category: "Automotive", // Auto-categorized
  tags: ["cost reduction", "manufacturing"], // Extracted from topics

  document: {
    // Document Metadata
    id: "doc_1766273014198_rku3hipqo",
    filename: "Reducing costs in the automotive in.txt",
    size: 20427, // bytes
    uploadDate: "2025-12-20T23:23:41.842Z",

    // Firebase Storage Links
    firebaseUrl: "https://storage.googleapis.com/...",
    firebasePath: "TeachAI/uploads/doc_xxx.txt",

    // AI Analysis Results
    analysis: {
      summary: {
        text: "Reducing manufacturing costs...",
        confidence: 0.95, // 95% confidence
        needsReview: false, // Flag if confidence < 0.8
      },

      topics: {
        items: [
          "Cost reduction in the automotive industry",
          "Kaizen and Lean methodologies",
          "Technological innovation",
          "Sustainability and ESG considerations",
          "Operational excellence and productivity",
        ],
        confidence: 0.88,
        needsReview: false,
      },

      entities: {
        items: [
          { name: "Toyota", type: "organization" },
          { name: "EPA", type: "organization" },
        ],
        confidence: 0.6,
        needsReview: true, // Low confidence, needs human review
      },

      sentiment: {
        value: "neutral",
        confidence: 0.8,
        needsReview: false,
      },
    },

    // AI-generated questions (if confidence is low)
    questions: [],

    // Processing metadata
    processingTime: 7213, // milliseconds
    vectorized: true, // Has embeddings for semantic search
  },

  // Timestamps
  createdAt: "2025-12-20T23:23:41.842Z",
  updatedAt: "2025-12-20T23:23:41.842Z",
};
```

---

### **Step 5: Storage**

**Location:** `backend/services/firebaseStorageService.js`

#### **5.1 Firebase Storage (Persistent)**

```javascript
// Document metadata saved as JSON
const fileName = `TeachAI/documents/{documentId}.json`;
await bucket.file(fileName).save(JSON.stringify(documentData));

// Stored at:
gs://try1-7d848.firebasestorage.app/TeachAI/documents/doc_xxx.json
```

**Storage Structure:**

```
Firebase Storage (gs://try1-7d848.firebasestorage.app)
├── TeachAI/
│   ├── uploads/              # Raw uploaded files
│   │   ├── doc_xxx.txt
│   │   ├── doc_yyy.pdf
│   │   └── doc_zzz.docx
│   │
│   ├── documents/            # Processed metadata (JSON)
│   │   ├── doc_xxx.json
│   │   ├── doc_yyy.json
│   │   └── doc_zzz.json
│   │
│   └── metadata/             # Additional metadata
│       └── index.json
```

#### **5.2 Memory Cache (Fast Access)**

```javascript
// In-memory array for fast retrieval
let documentHistory = [
  { document: {...}, createdAt: "..." },
  { document: {...}, createdAt: "..." }
];

// Synced with Firebase on:
- Server start (load all documents)
- New upload (add to cache)
- Delete (remove from cache)
```

**Why Both?**

- **Firebase**: Permanent storage, survives server restarts
- **Memory**: Fast access, no API calls needed
- **Sync**: Best of both worlds

---

### **Step 6: Retrieval & Search**

**Location:** `backend/controllers/documentController.js`

#### **6.1 Get All Documents**

```javascript
GET /api/documents

// Returns from memory cache
{
  success: true,
  documents: [
    { document: {...}, category: "Automotive" },
    { document: {...}, category: "Environmental" }
  ],
  total: 2,
  categories: ["Automotive", "Environmental", "General"]
}
```

#### **6.2 Filter by Category**

```javascript
GET /api/documents?category=Automotive

// Filters in-memory before returning
documents.filter(doc => doc.category === "Automotive")
```

#### **6.3 Search Documents**

```javascript
GET /api/documents/search?query=cost

// Searches across:
- Filename
- Summary text
- Topics
- Entities
```

---

### **Step 7: AI Chat Usage**

**Location:** `backend/controllers/aiController.js`

When user asks a question in chat:

#### **Single Document Mode**

```javascript
POST /api/ai/ask
{
  question: "What are the main findings?",
  context: {
    mode: "single",
    filename: "EPA Report.txt",
    summary: "The 2024 EPA Automotive Trends...",
    topics: ["Greenhouse Gas", "Fuel Economy"],
    entities: [{ name: "EPA", type: "organization" }],
    sentiment: { value: "neutral", confidence: 0.8 }
  }
}

// AI receives structured context
// Builds prompt with document information
// Returns answer based on that document only
```

#### **All Documents Mode**

```javascript
POST /api/ai/ask
{
  question: "Compare cost reduction strategies",
  context: {
    mode: "all",
    documentCount: 2,
    documents: [
      {
        id: "doc_xxx",
        filename: "Cost Reduction.txt",
        summary: "Implementing Kaizen...",
        topics: ["Cost reduction", "Lean manufacturing"]
      },
      {
        id: "doc_yyy",
        filename: "EPA Report.txt",
        summary: "EPA regulations...",
        topics: ["Emissions", "Compliance"]
      }
    ]
  }
}

// AI receives ALL documents
// Searches across all for relevant info
// References specific documents in answer
```

**AI Prompt Construction:**

```javascript
const prompt = `
You have access to ${documentCount} documents:

Document 1: Cost Reduction.txt
Summary: Implementing Kaizen...
Topics: Cost reduction, Lean manufacturing

Document 2: EPA Report.txt
Summary: EPA regulations...
Topics: Emissions, Compliance

User Question: Compare cost reduction strategies

Answer based on the documents provided, referencing specific documents.
`;
```

---

## 📦 Data Format Details

### **JSON Document Structure**

```json
{
  "success": true,
  "status": "processed",
  "category": "Automotive",
  "tags": ["cost reduction", "manufacturing", "kaizen"],

  "document": {
    "id": "doc_1766273014198_rku3hipqo",
    "filename": "Reducing costs in the automotive in.txt",
    "size": 20427,
    "uploadDate": "2025-12-20T23:23:41.842Z",
    "firebaseUrl": "https://storage.googleapis.com/...",
    "firebasePath": "TeachAI/uploads/...",

    "analysis": {
      "summary": {
        "text": "...",
        "confidence": 0.95,
        "needsReview": false
      },
      "topics": {
        "items": ["topic1", "topic2"],
        "confidence": 0.88,
        "needsReview": false
      },
      "entities": {
        "items": [{ "name": "Toyota", "type": "org" }],
        "confidence": 0.6,
        "needsReview": true
      },
      "sentiment": {
        "value": "neutral",
        "confidence": 0.8,
        "needsReview": false
      }
    },

    "questions": [],
    "processingTime": 7213,
    "vectorized": true
  },

  "createdAt": "2025-12-20T23:23:41.842Z",
  "updatedAt": "2025-12-20T23:23:41.842Z"
}
```

### **Vector Embedding Format**

```json
{
  "chunks": [
    {
      "text": "First 1000 characters of document...",
      "embedding": [
        0.023456,
        -0.045123,
        0.012789,
        // ... 1536 numbers total
      ],
      "topics": []
    },
    {
      "text": "Next 1000 characters...",
      "embedding": [0.034, -0.023, ...],
      "topics": []
    }
  ]
}
```

**Embedding Dimensions:**

- **Model**: `text-embedding-3-small`
- **Dimensions**: 1536 numbers per chunk
- **Range**: -1.0 to 1.0
- **Purpose**: Semantic similarity search

---

## 🔧 Technical Implementation

### **Auto-Categorization Algorithm**

**Location:** `backend/controllers/documentController.js`

```javascript
// Extracts topics from document
const topics = document.analysis.topics.items.join(" ").toLowerCase();

// Pattern matching
if (topics.includes("automotive") || topics.includes("vehicle")) {
  category = "Automotive";
} else if (topics.includes("epa") || topics.includes("environment")) {
  category = "Environmental";
} else if (topics.includes("cost") || topics.includes("manufacturing")) {
  category = "Manufacturing";
} else if (topics.includes("technology") || topics.includes("innovation")) {
  category = "Technology";
} else if (topics.includes("policy") || topics.includes("regulation")) {
  category = "Policy & Regulation";
} else {
  category = "General";
}
```

### **Tag Extraction**

```javascript
const extractTags = (documentData) => {
  const tags = [];
  const topics = documentData.document.analysis.topics.items;

  // Convert to array if string
  const topicsArray =
    typeof topics === "string"
      ? topics.split(/[,\n]/).map((t) => t.trim())
      : topics;

  // Take first 5 topics as tags
  tags.push(...topicsArray.slice(0, 5));

  // Remove duplicates
  return [...new Set(tags)];
};
```

---

## 🎓 Learning Resources

### **Key Concepts to Understand**

1. **Vector Embeddings**

   - Converts text → numbers that capture meaning
   - Similar meanings = similar numbers
   - Used for semantic search
   - Learn: OpenAI Embeddings Guide

2. **JSON Data Format**

   - Standard format for data exchange
   - Human-readable
   - Easy to parse and manipulate
   - Learn: JSON.org

3. **Firebase Storage**

   - Cloud object storage
   - Store files and JSON
   - Access via URLs
   - Learn: Firebase Storage Docs

4. **AI Prompts**

   - Instructions for AI models
   - System role + User query
   - Temperature controls creativity
   - Learn: OpenAI Prompt Engineering

5. **RESTful APIs**
   - HTTP methods (GET, POST, PUT, DELETE)
   - Endpoints for data operations
   - Request/Response pattern
   - Learn: REST API Tutorial

### **Recommended Learning Path**

**Week 1: Basics**

- ✅ Understand JSON format
- ✅ Learn HTTP APIs
- ✅ Firebase Storage basics

**Week 2: AI Concepts**

- ✅ OpenAI API usage
- ✅ Prompt engineering
- ✅ Understanding embeddings

**Week 3: Data Structures**

- ✅ Document schemas
- ✅ Vector databases
- ✅ Semantic search

**Week 4: Advanced**

- ✅ Chunking strategies
- ✅ Confidence scoring
- ✅ Error handling

---

## 💡 Example Queries

### **How Data Flows in Practice**

#### **Example 1: Upload New Document**

```
1. User uploads "Marketing Plan.pdf"
2. System extracts text: "Our Q1 marketing strategy..."
3. OpenAI analyzes:
   - Summary: "Q1 marketing strategy focuses on digital..."
   - Topics: ["Marketing", "Digital Strategy", "Q1 Planning"]
   - Sentiment: "positive"
4. Auto-categorize: "General"
5. Save to Firebase:
   - Raw file: TeachAI/uploads/doc_xxx.pdf
   - Metadata: TeachAI/documents/doc_xxx.json
6. Add to memory cache
7. Return to frontend
```

#### **Example 2: Chat Query (Single Mode)**

```
1. User selects "Marketing Plan.pdf"
2. User asks: "What's our budget?"
3. Frontend sends:
   {
     question: "What's our budget?",
     context: {
       mode: "single",
       summary: "Q1 marketing strategy...",
       topics: ["Marketing", "Digital Strategy"]
     }
   }
4. Backend builds prompt:
   "Document: Marketing Plan.pdf
    Summary: Q1 marketing strategy...
    Topics: Marketing, Digital Strategy

    Question: What's our budget?"
5. OpenAI answers based on document context
6. Return answer to user
```

#### **Example 3: Multi-Document Search**

```
1. User enables "All Documents" mode
2. User asks: "What documents mention costs?"
3. Backend loads ALL documents from memory
4. Sends to OpenAI:
   "You have 5 documents:
    Document 1: Marketing Plan - Topics: Marketing, Budget
    Document 2: Cost Report - Topics: Costs, Manufacturing
    Document 3: EPA Report - Topics: Environment, Compliance
    ...

    Question: What documents mention costs?"
5. AI searches across all summaries/topics
6. Returns: "Cost Report (Doc 2) discusses manufacturing
    costs, and Marketing Plan (Doc 1) mentions budget
    allocation..."
```

---

## 🚀 Advanced Topics

### **Semantic Search Implementation**

```javascript
// Future enhancement: Vector similarity search

// 1. User query converted to embedding
const queryEmbedding = await generateEmbedding("cost reduction strategies");

// 2. Compare with all document embeddings
documents.forEach((doc) => {
  doc.chunks.forEach((chunk) => {
    const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
    if (similarity > 0.8) {
      relevantChunks.push({ doc, chunk, similarity });
    }
  });
});

// 3. Return most relevant chunks
relevantChunks.sort((a, b) => b.similarity - a.similarity);
```

### **Confidence Scoring**

```javascript
// Each analysis component has confidence score
analysis: {
  summary: { confidence: 0.95 },  // High confidence
  topics: { confidence: 0.88 },   // Good confidence
  entities: { confidence: 0.6 },  // Low - needs review
  sentiment: { confidence: 0.8 }  // Good confidence
}

// Flags automatically set
needsReview = confidence < threshold
```

### **Chunking Strategy**

```
Long Document (10,000 chars)
     ↓
Chunk 1: chars 0-1000
Chunk 2: chars 1000-2000
Chunk 3: chars 2000-3000
...
Chunk 10: chars 9000-10000
     ↓
Each chunk gets embedding
     ↓
Enables finding specific sections
```

---

## 📚 Further Reading

- **OpenAI API Docs**: https://platform.openai.com/docs
- **Firebase Storage**: https://firebase.google.com/docs/storage
- **Vector Embeddings**: https://www.pinecone.io/learn/vector-embeddings/
- **Semantic Search**: https://www.elastic.co/what-is/semantic-search
- **REST APIs**: https://restfulapi.net/

---

**Last Updated**: December 2025  
**Version**: 2.0  
**Status**: Production Documentation
