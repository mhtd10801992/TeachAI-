# Global Dictionary Firebase Storage Guide

## 📍 Storage Location

The global abbreviation/terminology dictionary is stored in **Firebase Storage** at:

```
gs://try1-7d848.firebasestorage.app/TeachAI/global-dictionary.json
```

### Firebase Console Access

1. **Navigate to Firebase Console**: https://console.firebase.google.com/
2. **Select Project**: `try1-7d848`
3. **Go to Storage**: Click "Storage" in the left sidebar
4. **Navigate to Path**: `TeachAI/` folder
5. **Find File**: `global-dictionary.json`

## 📂 File Structure in Firebase

```
gs://try1-7d848.firebasestorage.app/
└── TeachAI/
    ├── documents/           # Uploaded documents
    ├── uploads/             # Raw uploaded files
    ├── metadata/            # Document metadata
    ├── mind-map/            # Generated mind maps
    ├── documents.json       # Document index
    └── global-dictionary.json  ← YOUR DICTIONARY IS HERE
```

## 🔄 How It Works

### On Save (User Defines Terms)
```
User defines terms in UI
        ↓
Frontend sends to: PUT /api/validation/document/:id/dictionary
        ↓
Backend updates dictionary object
        ↓
Saves to Firebase Storage: TeachAI/global-dictionary.json
        ↓
Also saves local backup: backend/data/global-dictionary.json
```

### On Load (System Needs Dictionary)
```
System needs dictionary
        ↓
Try Firebase Storage first: TeachAI/global-dictionary.json
        ↓
If Firebase unavailable → Use local backup
        ↓
Return dictionary to system
```

## 📊 Dictionary Content Example

When you view the file in Firebase, you'll see:

```json
{
  "version": "1.0",
  "lastUpdated": "2026-01-06T12:00:00.000Z",
  "terms": {
    "ai": {
      "term": "AI",
      "definition": "Artificial Intelligence",
      "category": "acronym",
      "addedAt": "2026-01-06T10:00:00.000Z",
      "updatedAt": "2026-01-06T12:00:00.000Z",
      "source": "doc_123_abc",
      "usageCount": 3,
      "contexts": [
        {
          "documentId": "doc_123_abc",
          "addedAt": "2026-01-06T10:00:00.000Z"
        }
      ]
    },
    "doe": {
      "term": "DoE",
      "definition": "Design of Experiments",
      "category": "acronym",
      "addedAt": "2026-01-06T11:00:00.000Z",
      "updatedAt": "2026-01-06T11:00:00.000Z",
      "source": "doc_456_def",
      "usageCount": 1,
      "contexts": [
        {
          "documentId": "doc_456_def",
          "addedAt": "2026-01-06T11:00:00.000Z"
        }
      ]
    }
  },
  "statistics": {
    "totalTerms": 2,
    "lastAddedTerm": "DoE",
    "documentsProcessed": 2
  }
}
```

## 🔐 Security & Access

### Firebase Security Rules
The dictionary is stored in your Firebase Storage with these rules:
- Read: Authenticated users (your backend service account)
- Write: Authenticated users (your backend service account)
- Public: No public access

### Backend Access
The backend uses Firebase Admin SDK with credentials from:
- **Production**: Application Default Credentials
- **Development**: Service account key at `backend/config/firebase-admin-key.json`

## 🚀 Benefits of Firebase Storage

### 1. **Persistence**
- Dictionary survives server restarts
- No data loss on redeployment
- Automatic backups by Firebase

### 2. **Scalability**
- Multiple server instances share the same dictionary
- All users see the same definitions
- Instant synchronization across instances

### 3. **Accessibility**
- Access from Firebase Console
- Download for backup/migration
- View/edit manually if needed

### 4. **Reliability**
- Local backup ensures availability
- Automatic failover to local storage
- Graceful degradation if Firebase is down

## 📥 Download Dictionary

### Via Firebase Console
1. Go to Firebase Console → Storage
2. Navigate to `TeachAI/global-dictionary.json`
3. Click the file → Download

### Via Backend API
```bash
# Get entire dictionary
curl http://localhost:4000/api/validation/dictionary

# Search for specific terms
curl http://localhost:4000/api/validation/dictionary/search?query=AI
```

### Via Local Backup
```bash
# View local backup
cat backend/data/global-dictionary.json

# Pretty print
cat backend/data/global-dictionary.json | jq
```

## 🔄 Synchronization

### Automatic Sync
- Every time a user saves terms, both Firebase and local are updated
- System always reads from Firebase first
- Local backup is updated as fallback

### Manual Sync (if needed)
If Firebase and local get out of sync, you can:

1. **Push local to Firebase** (if local is newer):
```javascript
// In backend console
const fs = require('fs');
const { getStorage } = require('firebase-admin/storage');
const bucket = getStorage().bucket();
const dictionary = JSON.parse(fs.readFileSync('./data/global-dictionary.json'));
bucket.file('TeachAI/global-dictionary.json').save(JSON.stringify(dictionary, null, 2));
```

2. **Pull Firebase to local** (if Firebase is newer):
```javascript
// In backend console
const fs = require('fs');
const { getStorage } = require('firebase-admin/storage');
const bucket = getStorage().bucket();
const [content] = await bucket.file('TeachAI/global-dictionary.json').download();
fs.writeFileSync('./data/global-dictionary.json', content);
```

## 🎯 Key Endpoints

All dictionary operations use these endpoints:

```
GET    /api/validation/dictionary              # Get entire dictionary
GET    /api/validation/dictionary/search       # Search terms
POST   /api/validation/document/:id/abbreviations  # Extract from doc
PUT    /api/validation/document/:id/dictionary     # Save terms
```

## 📈 Monitoring

### Check Dictionary Status
```bash
# Get statistics
curl http://localhost:4000/api/validation/dictionary | jq '.dictionary.statistics'

# Output:
{
  "totalTerms": 42,
  "lastAddedTerm": "CPU",
  "documentsProcessed": 15
}
```

### View Recent Terms
```bash
# Get all terms and sort by update time
curl http://localhost:4000/api/validation/dictionary | jq '.dictionary.terms | to_entries | sort_by(.value.updatedAt) | reverse | .[0:5]'
```

## 🛠️ Troubleshooting

### Dictionary Not Loading
1. Check Firebase connection: Look for "Firebase not available" in logs
2. Check local backup exists: `ls backend/data/global-dictionary.json`
3. Check Firebase Storage rules: Ensure service account has read access

### Terms Not Saving
1. Check API response for errors
2. Verify Firebase write permissions
3. Check local disk space for backup
4. Review backend logs for save errors

### Dictionary Out of Sync
1. Compare Firebase vs local versions
2. Use manual sync commands above
3. Always prefer Firebase version (it's the source of truth)

## 🎓 Best Practices

1. **Regular Backups**: Download dictionary monthly from Firebase
2. **Version Control**: Keep major versions in separate files
3. **Team Coordination**: Communicate when making bulk changes
4. **Monitoring**: Check statistics regularly to track growth
5. **Quality Control**: Review new terms periodically for consistency
