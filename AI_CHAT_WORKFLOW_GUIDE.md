# AI Chat & Document Access Workflow Guide

## Overview

The TeachAI app now features an enhanced AI Chat system that can access and search across all your processed documents, organized by categories and folders.

## ✨ New Features

### 1. **Multi-Document Search**

- **Single Document Mode**: Ask questions about one specific document
- **All Documents Mode**: Search and get answers across ALL documents in your library
- AI can now reference information from multiple documents simultaneously

### 2. **Auto-Categorization**

Documents are automatically categorized based on their content:

- 🚗 **Automotive**: Vehicle-related documents
- 🌍 **Environmental**: EPA, emissions, sustainability topics
- 🏭 **Manufacturing**: Production, costs, operations
- 💻 **Technology**: Innovation, tech-related content
- 📋 **Policy & Regulation**: Compliance, regulations
- 📁 **General**: Everything else

### 3. **Document Preview Panel**

- Click the 👁️ eye icon to see document details
- View summary, topics, sentiment analysis
- See document category and tags
- Preview opens side-by-side with chat

### 4. **Category Filtering**

- Filter documents by category
- Search within specific categories
- Organize your document library efficiently

## 🔄 Complete Workflow

### Step 1: Upload Documents

1. Go to **"📤 Upload Documents"** tab
2. Upload your files (PDF, TXT, DOCX)
3. Documents are automatically:
   - Processed with AI analysis
   - Categorized by content
   - Tagged with topics
   - Stored in Firebase

### Step 2: Access Chat

1. Navigate to **"💬 AI Chat"** tab
2. You'll see all your processed documents

### Step 3: Choose Search Mode

#### Option A: Single Document Mode

```
1. Click "📄 Single Document" button
2. Select a document from dropdown
3. (Optional) Click 👁️ to preview document details
4. Ask questions about that specific document
```

**Example Questions:**

- "What are the main findings?"
- "Summarize the key points"
- "What dates are mentioned?"

#### Option B: All Documents Mode

```
1. Click "📚 All Documents" button
2. (Optional) Filter by category
3. Ask questions across all documents
```

**Example Questions:**

- "Which document talks about cost reduction?"
- "Compare the findings across all automotive documents"
- "What are the common themes in all my documents?"
- "Find information about EPA regulations"

### Step 4: Chat with AI

- Type your question in the input box
- Press Enter to send (Shift+Enter for new line)
- AI will respond based on selected mode:
  - **Single mode**: Answers from one document
  - **All mode**: Searches across all documents and references specific files

## 🎯 Best Practices

### For Single Document Analysis

✅ **Do:**

- Use when you need deep insights from one document
- Ask detailed questions about specific content
- Request summaries and key points

❌ **Don't:**

- Ask comparative questions across documents
- Request information not in the selected document

### For Multi-Document Search

✅ **Do:**

- Use when searching for specific information across files
- Ask comparative questions
- Request synthesis of information from multiple sources
- Use category filters to narrow down search

❌ **Don't:**

- Ask overly specific questions about one document
- Expect deep analysis of a single file (use single mode instead)

## 📊 Category Organization

### Auto-Categorization Logic

The system automatically categorizes documents based on content analysis:

| Category            | Keywords Detected               |
| ------------------- | ------------------------------- |
| Automotive          | automotive, vehicle, car        |
| Environmental       | EPA, environment, emission      |
| Manufacturing       | cost, manufacturing, production |
| Technology          | technology, innovation          |
| Policy & Regulation | policy, regulation, compliance  |
| General             | Default category                |

### Manual Re-categorization (Future Feature)

Currently auto-categorized. Manual categorization coming soon!

## 🔧 Technical Details

### Backend Changes

1. **documentController.js**

   - Added auto-categorization on document save
   - Added tag extraction from topics
   - Category filter in getAllDocuments endpoint

2. **aiController.js**

   - Enhanced context building for multi-document mode
   - Smart prompt engineering for cross-document search
   - Better handling of document topics and entities

3. **firebaseStorageService.js**
   - Maintains document metadata with categories
   - Efficient storage and retrieval

### Frontend Changes

1. **AIChat.jsx**

   - Two-mode interface (Single/All documents)
   - Category filter dropdown
   - Document preview panel
   - Enhanced document selector
   - Visual status indicators

2. **App.jsx**
   - Fetches documents when entering chat view
   - Passes documents to AIChat component

## 🐛 Troubleshooting

### Documents Not Showing in Chat

**Check:**

1. ✅ Backend is running (`npm start` in backend folder)
2. ✅ Documents were successfully uploaded and processed
3. ✅ Browser console for API errors
4. ✅ API endpoint: `http://localhost:5000/api/documents`

**Test:**

```powershell
# Test if documents are available
curl http://localhost:5000/api/documents
```

### AI Not Accessing Documents

**Check:**

1. ✅ OpenAI API key is configured in backend/.env
2. ✅ Document is selected (in single mode)
3. ✅ Documents have been processed (not just uploaded)
4. ✅ Browser console for errors

### Categories Not Showing

**Check:**

1. ✅ Documents have been re-uploaded after update
2. ✅ Old documents need to be re-processed for categories
3. ✅ Backend shows category in logs when saving

## 📈 Future Enhancements

### Planned Features

- [ ] Custom folder creation
- [ ] Manual document categorization
- [ ] Document sharing between categories
- [ ] Advanced search with filters
- [ ] Bookmark important conversations
- [ ] Export chat history
- [ ] Document comparison view
- [ ] Bulk operations on documents

## 🎓 Example Use Cases

### Research Analysis

```
1. Upload multiple research papers
2. Use "All Documents" mode
3. Ask: "What are the common methodologies?"
4. Ask: "Which document has the most recent data?"
```

### Project Documentation

```
1. Upload project docs by phase
2. Category filter by "Technology" or "Manufacturing"
3. Ask: "What are all the technical requirements?"
4. Ask: "Compare timeline across documents"
```

### Compliance Review

```
1. Upload regulatory documents
2. Filter by "Policy & Regulation"
3. Ask: "What are the compliance requirements?"
4. Ask: "Which document mentions deadline dates?"
```

## 🚀 Quick Start Commands

### Start Backend

```powershell
cd "C:\Users\rohit\Desktop\New folder (2)\idea_engine\webaii\TeachAI\TeachAI-\backend"
npm start
```

### Start Frontend

```powershell
cd "C:\Users\rohit\Desktop\New folder (2)\idea_engine\webaii\TeachAI\TeachAI-\frontend"
npm run dev
```

### Test API

```powershell
# Health check
curl http://localhost:5000/api/health

# Get documents
curl http://localhost:5000/api/documents

# Get documents by category
curl "http://localhost:5000/api/documents?category=Automotive"
```

## 💡 Tips

1. **Upload Quality**: Better source documents = better AI responses
2. **Specific Questions**: More specific questions get better answers
3. **Use Categories**: Filter by category for faster, more relevant results
4. **Preview Documents**: Use preview panel to verify document content before asking
5. **Experiment**: Try both single and all-document modes to compare results

---

**Last Updated**: December 2025  
**Version**: 2.0  
**Status**: Production Ready ✅
