# Abbreviation & Terminology Dictionary Feature

## Overview
This feature automatically extracts abbreviations, acronyms, and technical terms from uploaded documents and allows users to define them in a global dictionary that persists across all documents.

## How It Works

### 1. Automatic Extraction on Upload
When a document is uploaded:
- AI automatically scans the text for abbreviations, acronyms, and technical terminology
- Extracted terms are stored with the document for user review
- Terms are categorized (abbreviation, acronym, technical, jargon, proper noun)
- AI provides context from the document where each term appears
- AI assigns confidence levels (high/medium/low) based on whether it can infer definitions

### 2. User Review in Validation Dashboard
In the validation dashboard, users can:
- View all extracted terms in a comprehensive table
- See AI-suggested definitions (if confident)
- Add or edit definitions for each term
- Check if terms already exist in the global dictionary
- Save defined terms to the global dictionary for future use

### 3. Global Dictionary Storage
- Primary storage: **Firebase Storage** at `TeachAI/global-dictionary.json`
- Backup storage: Local file at `/backend/data/global-dictionary.json`
- Dictionary includes:
  - Term and definition
  - Category (abbreviation, acronym, technical, jargon, proper noun)
  - Source document where it was first defined
  - Usage count across documents
  - Context history (last 5 occurrences)
  - Timestamps for adding and updating

**Firebase Integration:**
- The dictionary is automatically synced to Firebase Storage
- When users save terms, they're stored in `gs://[your-bucket]/TeachAI/global-dictionary.json`
- Local backup ensures availability even if Firebase is temporarily unavailable
- Multiple server instances can share the same dictionary via Firebase
- The system automatically falls back to local storage if Firebase is unavailable

### 4. Learning System
- Once a term is defined in the dictionary, it's recognized in future documents
- AI skips already-known terms during extraction
- Users can update existing definitions
- The system tracks how many documents have used each term

## API Endpoints

### Extract Abbreviations
```
POST /api/validation/document/:documentId/abbreviations
```
Extracts abbreviations from a specific document using AI.

### Get Global Dictionary
```
GET /api/validation/dictionary
```
Returns the entire global dictionary with all defined terms.

### Search Dictionary
```
GET /api/validation/dictionary/search?query=term
```
Search for specific terms in the dictionary.

### Update Dictionary
```
PUT /api/validation/document/:documentId/dictionary
Body: { terms: [{ term, definition, category, source }] }
```
Add or update terms in the global dictionary.

## Usage Example

### 1. Upload a Document
Upload a document through the normal upload process. The system automatically extracts abbreviations.

### 2. Navigate to Validation Dashboard
Go to the Validation Dashboard and select the document.

### 3. Review Abbreviations Section
Scroll to the "📚 Abbreviations & Terminology Dictionary" section.

### 4. Click "Extract Terms" (if not auto-extracted)
The AI will analyze the document and extract relevant terms.

### 5. Define Terms
- Review each term in the table
- Add or edit definitions in the text area
- Terms highlighted in green are already in the dictionary
- Terms with orange borders need definitions

### 6. Save to Dictionary
Click "💾 Save to Global Dictionary" to persist the definitions.

### 7. Future Documents
When new documents are uploaded, the system will:
- Skip extraction for terms already in dictionary
- Use existing definitions automatically
- Only prompt for new/unknown terms

## Benefits

1. **Consistency**: Ensures uniform definitions across all documents
2. **Efficiency**: Reduces repetitive definition work
3. **Knowledge Building**: Creates an institutional knowledge base
4. **Context Preservation**: Keeps track of where terms were used
5. **AI Learning**: The more you define, the smarter the system becomes

## Global Dictionary Structure

```json
{
  "version": "1.0",
  "lastUpdated": "2026-01-06T00:00:00.000Z",
  "terms": {
    "ai": {
      "term": "AI",
      "definition": "Artificial Intelligence - simulation of human intelligence by machines",
      "category": "acronym",
      "addedAt": "2026-01-06T00:00:00.000Z",
      "updatedAt": "2026-01-06T00:00:00.000Z",
      "source": "doc_123_abc",
      "usageCount": 5,
      "contexts": [
        { "documentId": "doc_123_abc", "addedAt": "2026-01-06T00:00:00.000Z" }
      ]
    }
  },
  "statistics": {
    "totalTerms": 1,
    "lastAddedTerm": "AI",
    "documentsProcessed": 1
  }
}
```

## Technical Implementation

### Firebase Storage Location
The global dictionary is stored at:
- **Firebase Storage Path**: `gs://[your-project].firebasestorage.app/TeachAI/global-dictionary.json`
- **Local Backup Path**: `/backend/data/global-dictionary.json`

**Storage Strategy:**
1. **Primary**: Firebase Storage (shared across all instances)
2. **Fallback**: Local file system (when Firebase is unavailable)
3. **Sync**: Every save updates both Firebase and local backup
4. **Load Priority**: Firebase first, then local fallback

**Benefits of Firebase Storage:**
- ✅ Shared dictionary across multiple server instances
- ✅ Automatic backups and versioning
- ✅ Accessible from anywhere
- ✅ No data loss on server restarts
- ✅ Scalable for team collaboration

### Backend Components
- **AI Service** (`aiService.js`): `extractAbbreviations()` function
- **Validation Controller** (`validationController.js`): Dictionary management endpoints
- **Upload Controller** (`uploadController.validation.js`): Automatic extraction during upload
- **Global Dictionary**: JSON file storage at `backend/data/global-dictionary.json`

### Frontend Components
- **DocumentValidator.jsx**: UI for reviewing and defining terms
  - Interactive table with inline editing
  - Real-time dictionary lookup
  - Color-coded confidence indicators
  - Batch save functionality

### AI Extraction Logic
The AI analyzes documents for:
- **Abbreviations**: Shortened forms (e.g., "Dr.", "Inc.")
- **Acronyms**: Initials (e.g., "NASA", "CPU", "API")
- **Technical Terms**: Domain-specific terminology
- **Jargon**: Industry-specific language
- **Proper Nouns**: Specific tools, methods, or brands

## Future Enhancements

Potential improvements:
1. Export dictionary as CSV/JSON for sharing
2. Import external terminology databases
3. Multi-language support
4. Synonym linking
5. Term usage analytics dashboard
6. Automatic term highlighting in documents
7. Dictionary version control
8. Team collaboration features
