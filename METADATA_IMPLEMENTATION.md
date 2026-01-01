# Document Metadata & Tokenization System - Implementation Guide

## Overview

The system now extracts comprehensive metadata from all uploaded documents (PDF, Word, TXT) and tokenizes the information for advanced processing, chat context, and table population.

## New Features

### 1. **Metadata Extraction**

When a document is uploaded, the system automatically extracts:

#### Content Structure

- **Full text** - Complete extracted document text
- **Word count** - Total word count in document
- **Sentences** - All sentences extracted and indexed
- **Paragraphs** - Document broken into logical paragraphs with metadata

#### Document Structure

- **Sections** - Auto-detected sections based on headings and content
- **Headings** - All headings with hierarchy levels
- **Key Phrases** - Important phrases extracted from topics/entities

#### Tokenization

- **Content Tokens** - All words tokenized and counted
- **Entity Tokens** - Named entities with type classification
- **Topic Tokens** - Extracted topics with importance weighting
- **Sentiment Tokens** - Overall document sentiment

#### Searchable Index

- **Word Index** - All words mapped to their positions in document
- **Frequency Analysis** - Most common words and phrases
- **Quick Search** - Fast text search across document

#### Tags & Metadata

- **Topic Tags** - Auto-generated from AI analysis
- **Entity Tags** - Person, Organization, Location classifications
- **Sentiment Tags** - Document tone classification
- **Custom Tags** - User-defined tags for organization

### 2. **Image & Table Extraction**

#### Embedded Images

- ✅ Extract images directly embedded in PDFs
- ✅ Convert to base64 for storage and transmission
- ✅ AI analysis of each image
- ✅ Save image metadata and descriptions

#### Scanned Documents

- ✅ Detect if document is scanned/OCR
- ✅ Render pages as images for analysis
- ✅ Extract images from each page
- ✅ AI analysis of scanned page content

#### Tables

- ✅ Detect tables in documents
- ✅ Extract table structure (rows, columns, cells)
- ✅ Convert to JSON/CSV format
- ✅ Store as structured metadata for querying

#### Screenshots

- ✅ Extract visual elements as images
- ✅ Analyze with vision API
- ✅ Save with associated context

### 3. **Chat Integration with Document Metadata**

Use metadata to provide intelligent responses:

```javascript
// Query metadata for context
const context = await API.post(
  `/api/metadata/documents/${docId}/metadata/query`,
  {
    query: "What is the cost reduction?",
    limit: 5,
  }
);
// Returns: relevant sections, topics, entities, phrases
```

Features:

- **Contextual Search** - Find relevant sections for chat queries
- **Topic Deep-Dive** - Get detailed information about specific topics
- **Entity Reference** - Understand all mentions of people, places, organizations
- **Evidence Extraction** - Pull supporting quotes from document

### 4. **Table Population & Display**

Tables are extracted and stored as structured data:

```json
{
  "tables": [
    {
      "id": "table_1",
      "title": "Cost Reduction Results",
      "headers": ["Month", "Cost", "Savings"],
      "rows": [
        ["Jan", "$10000", "5%"],
        ["Feb", "$9500", "8%"]
      ],
      "metadata": {
        "source": "section_2",
        "importance": "high"
      }
    }
  ]
}
```

### 5. **Topic Detail Explanations**

Get comprehensive information about any topic:

```javascript
// Get topic details with supporting evidence
const topicInfo = await API.get(
  `/api/metadata/documents/${docId}/topics/${topicName}`
);
// Returns:
// - Topic mention frequency
// - All relevant sections
// - Supporting sentences/quotes
// - Related entities
// - Related topics
```

## New API Endpoints

### Base URL: `/api/metadata`

#### 1. Get Document Metadata

```
GET /documents/{documentId}/metadata
```

Returns: Complete metadata structure for the document

#### 2. Query Metadata for Context

```
POST /documents/{documentId}/metadata/query
Body: { "query": "search terms", "limit": 5 }
```

Returns: Relevant sections, topics, entities, phrases matching query

#### 3. Get Topic Details

```
GET /documents/{documentId}/topics/{topicName}
```

Returns: Detailed information about a specific topic with evidence

#### 4. Get Document Tokens

```
GET /documents/{documentId}/tokens
```

Returns: All extracted tokens and tags for AI processing

#### 5. Get Document Structure

```
GET /documents/{documentId}/structure
```

Returns: Sections, headings, key phrases, document hierarchy

#### 6. Get Searchable Index

```
GET /documents/{documentId}/index
```

Returns: Full word index and search capability

## Response Data Structure

### Metadata Structure

```javascript
{
  "content": {
    "fullText": "...",
    "textLength": 5000,
    "wordCount": 800,
    "sentences": [...],
    "paragraphs": [...]
  },
  "analysis": {
    "topics": [...],
    "entities": [...],
    "summary": "...",
    "sentiment": "positive"
  },
  "structure": {
    "sections": [...],
    "headings": [...],
    "keyPhrases": [...]
  },
  "tokens": {
    "content": {...},
    "entities": [...],
    "topics": [...],
    "sentiment": {...}
  },
  "tags": [...],
  "index": {...}
}
```

## Usage in Chat

### Example 1: Answer Question About Cost Savings

```javascript
const query = "What was the cost savings achieved?";
const context = await queryMetadata(documentId, query);
// Use context.relevantSections to answer with document evidence
```

### Example 2: Explain a Topic

```javascript
const topic = "Cost Reduction Techniques";
const details = await getTopicDetails(documentId, topic);
// Returns frequency, sections, evidence, related topics
```

### Example 3: Build Table Display

```javascript
const metadata = await getMetadata(documentId);
const tables = metadata.tables || [];
// Display each table with headers, rows, metadata
```

## Backend Changes

### New Files

1. `services/documentMetadataService.js` - Metadata extraction and querying
2. `routes/metadata.js` - New API endpoints for metadata access

### Modified Files

1. `controllers/uploadController.js` - Now extracts metadata on upload
2. `server.js` - Added metadata routes

### New Features in uploadController

- Calls `extractDocumentMetadata()` after AI analysis
- Stores metadata in response.document.metadata
- Logs metadata extraction details

## Frontend Integration (Ready for Implementation)

### Chat Component Enhancement

```javascript
// In chat, use metadata to provide context
const response = await API.post(
  "/api/metadata/documents/${docId}/metadata/query",
  {
    query: userMessage,
  }
);
// Use results to enhance AI response with document evidence
```

### Table Component

```javascript
// Display extracted tables
const tables = document.metadata?.tables || [];
tables.forEach((table) => {
  // Render table with headers and rows
});
```

### Topic Explorer

```javascript
// Show detailed topic information
const topicDetails = await getTopicDetails(documentId, topicName);
// Display mentions, sections, evidence, related topics
```

## Performance & Optimization

- **Lazy Loading** - Metadata loaded on-demand via API
- **Indexed Search** - Word index for fast searching
- **Token Caching** - Tokens cached after extraction
- **Streaming** - Large documents processed in chunks

## Error Handling

- If metadata extraction fails, document still processes successfully
- Metadata is optional - system functions without it
- Missing metadata endpoints return 404 with helpful messages

## Security Considerations

- Metadata tokens sanitized before storage
- No sensitive data extracted without consent
- Index available only to authenticated users
- Rate limiting on metadata queries

## Future Enhancements

1. **Vector Embeddings** - Create vector representations of document chunks
2. **Semantic Search** - Search by meaning, not just keywords
3. **Citation Tracking** - Track all references and citations in document
4. **Dependency Graphs** - Show relationships between concepts
5. **Auto-Summarization** - Generate summaries of sections on demand
6. **Knowledge Graph** - Build graph of concepts and relationships

## Usage Examples

### Example 1: Chat with Document Context

```javascript
async function askDocument(documentId, question) {
  // Get context from metadata
  const context = await API.post(
    `/api/metadata/documents/${documentId}/metadata/query`,
    {
      query: question,
    }
  );

  // Use context in AI prompt
  const response = await API.post("/api/ai/chat", {
    message: question,
    context: context,
    documentId: documentId,
  });

  return response;
}
```

### Example 2: Display Topic Details

```javascript
async function showTopicDetails(documentId, topicName) {
  const details = await API.get(
    `/api/metadata/documents/${documentId}/topics/${topicName}`
  );

  return {
    topic: details.topicDetails.topic,
    mentions: details.topicDetails.mentioned,
    sections: details.topicDetails.relevantSections,
    evidence: details.topicDetails.supportingEvidence,
    relatedTopics: details.topicDetails.relatedTopics,
  };
}
```

### Example 3: Build Interactive Table

```javascript
async function displayTables(documentId) {
  const metadata = await API.get(
    `/api/metadata/documents/${documentId}/metadata`
  );

  return metadata.metadata?.tables?.map((table) => ({
    title: table.title,
    headers: table.headers,
    rows: table.rows,
    source: table.metadata?.source,
  }));
}
```

## Testing

After deployment:

1. Upload a document
2. Check backend logs for metadata extraction
3. Call `/api/metadata/documents/{id}/metadata` to verify metadata stored
4. Call `/api/metadata/documents/{id}/metadata/query` with test query
5. Call `/api/metadata/documents/{id}/topics/{topicName}` to get topic details

---

**Status**: ✅ Ready for Frontend Integration
**Implementation Date**: December 30, 2025
