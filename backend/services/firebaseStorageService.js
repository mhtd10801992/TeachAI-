// Firebase Storage Service - Handles document storage in Firebase
import admin from 'firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

// Firebase configuration
const firebaseConfig = {
  projectId: 'try1-7d848',
  storageBucket: 'try1-7d848.firebasestorage.app'
};

// Fallback local storage paths
const LOCAL_STORAGE = {
  BASE_DIR: './data',
  DOCUMENTS: './data/documents',
  UPLOADS: './data/uploads',
  METADATA: './data/metadata',
  MINDMAP: './data/mindmap'
};

// Cache for document list
let documentsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 30000; // 30 seconds

// Initialize Firebase Admin (if not already initialized)
let firebaseApp;
let bucket;
let useFirebase = false;

try {
  firebaseApp = admin.app();
  useFirebase = true;
} catch (error) {
  try {
    // Try to load service account key if it exists
    const serviceAccountPath = path.join(process.cwd(), 'config', 'firebase-admin-key.json');
    const credential = admin.credential.cert(serviceAccountPath);
    firebaseApp = admin.initializeApp({
      ...firebaseConfig,
      credential
    });
    useFirebase = true;
    console.log('✅ Firebase Admin initialized with service account');
  } catch (keyError) {
    console.log('⚠️ Firebase credentials not found, using local storage fallback');
    console.log('Error:', keyError.message);
    useFirebase = false;
  }
}

if (useFirebase) {
  try {
    bucket = getStorage().bucket(firebaseConfig.storageBucket);
    console.log(`✅ Firebase Storage bucket initialized: ${bucket.name}`);
  } catch (error) {
    console.error('❌ Firebase Storage initialization failed:', error.message);
    useFirebase = false;
  }
}

// Initialize local storage directories
const initializeLocalStorage = async () => {
  try {
    await fs.mkdir(LOCAL_STORAGE.BASE_DIR, { recursive: true });
    await fs.mkdir(LOCAL_STORAGE.DOCUMENTS, { recursive: true });
    await fs.mkdir(LOCAL_STORAGE.UPLOADS, { recursive: true });
    await fs.mkdir(LOCAL_STORAGE.METADATA, { recursive: true });
    await fs.mkdir(LOCAL_STORAGE.MINDMAP, { recursive: true });
    return true;
  } catch (error) {
    console.error('Failed to initialize local storage:', error);
    return false;
  }
};

// Firebase Storage paths
const FIREBASE_PATHS = {
  DOCUMENTS: 'TeachAI/documents/',
  UPLOADS: 'TeachAI/uploads/',
  METADATA: 'TeachAI/metadata/',
  MINDMAP: 'TeachAI/mind-map/',
  INDEX: 'TeachAI/documents.json'
};

// Save a generated mind map (concepts + relationships) for a document
export const saveMindMapToFirebase = async (documentId, mindMapData) => {
  try {
    if (useFirebase && bucket) {
      const fileName = `${FIREBASE_PATHS.MINDMAP}${documentId}.json`;
      const file = bucket.file(fileName);

      await file.save(JSON.stringify(mindMapData, null, 2), {
        metadata: {
          contentType: 'application/json',
          metadata: {
            documentId,
            savedAt: new Date().toISOString(),
            type: 'mind-map'
          }
        }
      });

      console.log(`Mind map saved to Firebase: ${fileName}`);
      return { success: true, storage: 'firebase', firebasePath: fileName };
    } else {
      await initializeLocalStorage();
      const filePath = path.join(LOCAL_STORAGE.MINDMAP, `${documentId}.json`);
      await fs.writeFile(filePath, JSON.stringify(mindMapData, null, 2));
      console.log(`Mind map saved locally: ${filePath}`);
      return { success: true, storage: 'local', localPath: filePath };
    }
  } catch (error) {
    console.error('Error saving mind map:', error);
    return { success: false, error: error.message };
  }
};

// Load a saved mind map for a document (if it exists)
export const getMindMapFromFirebase = async (documentId) => {
  try {
    if (useFirebase && bucket) {
      const fileName = `${FIREBASE_PATHS.MINDMAP}${documentId}.json`;
      const file = bucket.file(fileName);
      const [exists] = await file.exists();
      if (!exists) return null;

      const [content] = await file.download();
      return JSON.parse(content.toString());
    }

    await initializeLocalStorage();
    const filePath = path.join(LOCAL_STORAGE.MINDMAP, `${documentId}.json`);
    if (!existsSync(filePath)) return null;
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading mind map:', error);
    return null;
  }
};

// List all saved mind maps
export const listMindMapsFromFirebase = async () => {
  try {
    if (useFirebase && bucket) {
      // Firebase Storage
      const [files] = await bucket.getFiles({
        prefix: FIREBASE_PATHS.MINDMAP
      });
      
      const mindMaps = [];
      
      for (const file of files) {
        if (file.name.endsWith('.json')) {
          try {
            const [content] = await file.download();
            const mindMapData = JSON.parse(content.toString());
            
            // Return summary info
            mindMaps.push({
              id: mindMapData.id,
              type: mindMapData.type,
              createdAt: mindMapData.createdAt,
              totalDocuments: mindMapData.totalDocuments,
              documentTitles: mindMapData.documentTitles,
              categories: mindMapData.categories,
              metadata: mindMapData.metadata
            });
          } catch (error) {
            console.error(`Error loading mind map ${file.name}:`, error);
          }
        }
      }
      
      mindMaps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      console.log(`Loaded ${mindMaps.length} mind maps from Firebase`);
      return mindMaps;
    } else {
      // Local Storage Fallback
      await initializeLocalStorage();
      const mindMaps = [];
      
      try {
        const files = await fs.readdir(LOCAL_STORAGE.MINDMAP);
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            try {
              const filePath = path.join(LOCAL_STORAGE.MINDMAP, file);
              const content = await fs.readFile(filePath, 'utf8');
              const mindMapData = JSON.parse(content);
              
              mindMaps.push({
                id: mindMapData.id,
                type: mindMapData.type,
                createdAt: mindMapData.createdAt,
                totalDocuments: mindMapData.totalDocuments,
                documentTitles: mindMapData.documentTitles,
                categories: mindMapData.categories,
                metadata: mindMapData.metadata
              });
            } catch (error) {
              console.error(`Error loading mind map ${file}:`, error);
            }
          }
        }
        
        mindMaps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        console.log(`Loaded ${mindMaps.length} mind maps from local storage`);
        return mindMaps;
      } catch (error) {
        console.log('No local mind maps found, starting fresh');
        return [];
      }
    }
  } catch (error) {
    console.error('Error listing mind maps:', error);
    return [];
  }
};

// Save document metadata to Firebase Storage or local fallback
export const saveDocumentToFirebase = async (documentData) => {
  try {
    // Invalidate cache since we're adding a new document
    invalidateDocumentsCache();
    
    if (useFirebase && bucket) {
      // Firebase Storage
      const documentId = documentData.document.id;
      const fileName = `${FIREBASE_PATHS.DOCUMENTS}${documentId}.json`;
      
      const file = bucket.file(fileName);
      
      await file.save(JSON.stringify(documentData, null, 2), {
        metadata: {
          contentType: 'application/json',
          metadata: {
            uploadedAt: new Date().toISOString(),
            documentName: documentData.document.filename,
            documentId: documentId
          }
        }
      });
      
      console.log(`Document metadata saved to Firebase: ${fileName}`);
      return {
        success: true,
        firebasePath: fileName,
        documentId: documentId,
        storage: 'firebase'
      };
    } else {
      // Local Storage Fallback
      await initializeLocalStorage();
      const documentId = documentData.document.id;
      const fileName = path.join(LOCAL_STORAGE.DOCUMENTS, `${documentId}.json`);
      
      await fs.writeFile(fileName, JSON.stringify(documentData, null, 2));
      
      console.log(`Document metadata saved locally: ${fileName}`);
      return {
        success: true,
        localPath: fileName,
        documentId: documentId,
        storage: 'local'
      };
    }
  } catch (error) {
    console.error('Error saving document:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Save uploaded file to Firebase Storage or local fallback
export const saveUploadedFileToFirebase = async (file, documentId) => {
  try {
    if (useFirebase && bucket) {
      // Firebase Storage
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${FIREBASE_PATHS.UPLOADS}${documentId}.${fileExtension}`;
      
      const firebaseFile = bucket.file(fileName);
      
      await firebaseFile.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            originalName: file.originalname,
            uploadedAt: new Date().toISOString(),
            documentId: documentId,
            size: file.size.toString()
          }
        }
      });
      
      const [url] = await firebaseFile.getSignedUrl({
        action: 'read',
        expires: '03-09-2491'
      });
      
      console.log(`File uploaded to Firebase: ${fileName}`);
      return {
        success: true,
        firebasePath: fileName,
        downloadUrl: url,
        originalName: file.originalname,
        size: file.size,
        storage: 'firebase'
      };
    } else {
      // Local Storage Fallback
      await initializeLocalStorage();
      const fileExtension = path.extname(file.originalname);
      const fileName = `${documentId}${fileExtension}`;
      const filePath = path.join(LOCAL_STORAGE.UPLOADS, fileName);
      
      await fs.writeFile(filePath, file.buffer);
      
      console.log(`File uploaded locally: ${filePath}`);
      return {
        success: true,
        localPath: filePath,
        downloadUrl: `http://localhost:5000/files/${fileName}`,
        originalName: file.originalname,
        size: file.size,
        storage: 'local'
      };
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Load all documents from Firebase Storage or local fallback
export const loadDocumentsFromFirebase = async (useCache = true) => {
  try {
    // Check cache first
    if (useCache && documentsCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
      console.log(`📦 Returning ${documentsCache.length} documents from cache`);
      return documentsCache;
    }
    
    if (useFirebase && bucket) {
      // Firebase Storage
      const [files] = await bucket.getFiles({
        prefix: FIREBASE_PATHS.DOCUMENTS
      });
      
      // Load documents in parallel for speed
      const documentPromises = files
        .filter(file => file.name.endsWith('.json'))
        .map(async (file) => {
          try {
            const [content] = await file.download();
            return JSON.parse(content.toString());
          } catch (error) {
            console.error(`Error loading document ${file.name}:`, error);
            return null;
          }
        });
      
      const documents = (await Promise.all(documentPromises)).filter(doc => doc !== null);
      
      documents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      console.log(`✅ Loaded ${documents.length} documents from Firebase`);
      
      // Update cache
      documentsCache = documents;
      cacheTimestamp = Date.now();
      
      return documents;
    } else {
      // Local Storage Fallback
      await initializeLocalStorage();
      
      try {
        const files = await fs.readdir(LOCAL_STORAGE.DOCUMENTS);
        
        // Load documents in parallel
        const documentPromises = files
          .filter(file => file.endsWith('.json'))
          .map(async (file) => {
            try {
              const filePath = path.join(LOCAL_STORAGE.DOCUMENTS, file);
              const content = await fs.readFile(filePath, 'utf8');
              return JSON.parse(content);
            } catch (error) {
              console.error(`Error loading document ${file}:`, error);
              return null;
            }
          });
        
        const documents = (await Promise.all(documentPromises)).filter(doc => doc !== null);
        
        documents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        console.log(`✅ Loaded ${documents.length} documents from local storage`);
        
        // Update cache
        documentsCache = documents;
        cacheTimestamp = Date.now();
        
        return documents;
      } catch (error) {
        console.log('No local documents found, starting fresh');
        return [];
      }
    }
  } catch (error) {
    console.error('Error loading documents:', error);
    return [];
  }
};

// Invalidate documents cache (call this when documents are added/updated/deleted)
export const invalidateDocumentsCache = () => {
  documentsCache = null;
  cacheTimestamp = null;
  console.log('🗑️ Documents cache invalidated');
};

// Delete document from Firebase Storage or Local Storage
export const deleteDocumentFromFirebase = async (documentId) => {
  invalidateDocumentsCache();
  try {
    if (useFirebase && bucket) {
      // Firebase Storage
      const docFile = bucket.file(`${FIREBASE_PATHS.DOCUMENTS}${documentId}.json`);
      await docFile.delete();
      
      // Try to find and delete associated uploaded file
      const [uploadedFiles] = await bucket.getFiles({
        prefix: `${FIREBASE_PATHS.UPLOADS}${documentId}.`
      });
      
      for (const file of uploadedFiles) {
        await file.delete();
      }
      
      console.log(`Document deleted from Firebase: ${documentId}`);
      return { success: true };
    } else {
      // Local Storage Fallback
      const jsonPath = path.join(LOCAL_STORAGE.DOCUMENTS, `${documentId}.json`);
      
      // Delete JSON metadata
      try {
        await fs.unlink(jsonPath);
        console.log(`Deleted local document metadata: ${jsonPath}`);
      } catch (err) {
        if (err.code !== 'ENOENT') console.error('Error deleting local JSON:', err);
      }
      
      // Delete uploaded file (try common extensions)
      const uploadDir = LOCAL_STORAGE.UPLOADS;
      const files = await fs.readdir(uploadDir);
      
      for (const file of files) {
        if (file.startsWith(documentId)) {
          await fs.unlink(path.join(uploadDir, file));
          console.log(`Deleted local uploaded file: ${file}`);
        }
      }
      
      return { success: true };
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    return { success: false, error: error.message };
  }
};

// Get Firebase Storage statistics
export const getFirebaseStorageStats = async () => {
  try {
    // Get all files in the TeachAI directory
    const [files] = await bucket.getFiles({
      prefix: 'TeachAI/'
    });
    
    let totalSize = 0;
    let documentCount = 0;
    let uploadCount = 0;
    
    for (const file of files) {
      try {
        const [metadata] = await file.getMetadata();
        totalSize += parseInt(metadata.size || 0);
      } catch (err) {
        console.warn('Skipping file in storage stats due to metadata error:', file.name, err.message);
      }

      if (file.name.includes('/documents/')) {
        documentCount++;
      } else if (file.name.includes('/uploads/')) {
        uploadCount++;
      }
    }
    
    return {
      totalFiles: files.length,
      totalSize: totalSize,
      documentMetadataCount: documentCount,
      uploadedFilesCount: uploadCount,
      bucketName: bucket.name,
      firebasePath: 'TeachAI/'
    };
  } catch (error) {
    console.error('Error getting Firebase storage stats:', error);
    return null;
  }
};

// Search documents in Firebase by metadata
export const searchDocumentsInFirebase = async (query) => {
  try {
    // Load all documents first (for simple search)
    const documents = await loadDocumentsFromFirebase();
    
    if (!query) return documents;
    
    // Filter documents based on search query
    const filteredDocuments = documents.filter(doc => 
      doc.document.filename.toLowerCase().includes(query.toLowerCase()) ||
      doc.document.analysis?.summary?.text.toLowerCase().includes(query.toLowerCase()) ||
      doc.document.analysis?.topics?.items.some(topic => 
        topic.toLowerCase().includes(query.toLowerCase())
      )
    );
    
    return filteredDocuments;
  } catch (error) {
    console.error('Error searching documents in Firebase:', error);
    return [];
  }
};

// Get a specific document from Firebase
export const getDocumentFromFirebase = async (documentId) => {
  try {
    const fileName = `${FIREBASE_PATHS.DOCUMENTS}${documentId}.json`;
    const file = bucket.file(fileName);
    
    const [content] = await file.download();
    const documentData = JSON.parse(content.toString());
    
    return documentData;
  } catch (error) {
    console.error(`Error getting document ${documentId} from Firebase:`, error);
    return null;
  }
};

// Initialize Firebase Storage (create directory structure if needed)
export const initializeFirebaseStorage = async () => {
  try {
    if (useFirebase && bucket) {
      // Firebase Storage initialization
      const markerFile = bucket.file('TeachAI/.initialized');
      const markerContent = JSON.stringify({
        initialized: true,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
      
      await markerFile.save(markerContent, {
        metadata: {
          contentType: 'application/json'
        }
      });
      
      console.log(`✅ Firebase Storage initialized at gs://${bucket.name}/TeachAI`);
      return true;
    } else {
      // Local Storage initialization
      const success = await initializeLocalStorage();
      if (success) {
        console.log('✅ Local storage initialized (Firebase fallback)');
      }
      return success;
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
    // Try local storage fallback
    const success = await initializeLocalStorage();
    if (success) {
      console.log('✅ Fell back to local storage successfully');
    }
    return success;
  }
};

export { FIREBASE_PATHS, bucket };
