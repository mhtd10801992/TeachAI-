// Document History Controller with Firebase Storage
import { 
  loadDocumentsFromFirebase, 
  saveDocumentToFirebase, 
  deleteDocumentFromFirebase,
  getFirebaseStorageStats,
  searchDocumentsInFirebase,
  getDocumentFromFirebase
} from '../services/firebaseStorageService.js';

// Cache for in-memory operations (synced with Firebase storage)
let documentHistory = [];

// Initialize document cache from Firebase storage
const initializeDocumentCache = async () => {
  documentHistory = await loadDocumentsFromFirebase();
  console.log(`Loaded ${documentHistory.length} documents from Firebase Storage`);
};

// Save a processed document to history (both memory and Firebase)
export const saveDocument = async (documentData) => {
  const document = {
    ...documentData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Save to Firebase Storage
  const firebaseResult = await saveDocumentToFirebase(document);
  
  if (firebaseResult.success) {
    // Add to memory cache only if Firebase save succeeded
    documentHistory.unshift(document); // Add to beginning of array
    console.log(`Document saved to Firebase: ${document.document.filename} (ID: ${document.document.id})`);
    return document;
  } else {
    console.error('Failed to save document to Firebase:', firebaseResult.error);
    throw new Error(`Firebase save failed: ${firebaseResult.error}`);
  }
};

// Get all documents from history
export const getAllDocuments = async (req, res) => {
  try {
    console.log(`📊 Fetching documents - Cache has ${documentHistory.length} documents`);
    
    // Sort by most recent first
    const sortedDocuments = documentHistory.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    console.log(`📤 Sending ${sortedDocuments.length} documents to frontend`);
    
    res.json({
      success: true,
      documents: sortedDocuments,
      total: sortedDocuments.length
    });
  } catch (error) {
    console.error('❌ Error fetching documents:', error);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
};

// Get a specific document by ID from Firebase
export const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to find in cache first
    let document = documentHistory.find(doc => doc.document.id === id);
    
    // If not in cache, try Firebase
    if (!document) {
      document = await getDocumentFromFirebase(id);
    }
    
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }
    
    res.json({
      success: true,
      document: document
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: "Failed to fetch document" });
  }
};

// Delete document by ID (from both memory and Firebase)
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    
    const index = documentHistory.findIndex(doc => doc.document.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: "Document not found" });
    }
    
    // Delete from Firebase Storage
    const deleteResult = await deleteDocumentFromFirebase(id);
    
    if (deleteResult.success) {
      // Remove from memory cache only if Firebase delete succeeded
      documentHistory.splice(index, 1);
      
      res.json({
        success: true,
        message: "Document deleted successfully from Firebase Storage"
      });
    } else {
      res.status(500).json({
        error: "Failed to delete document from Firebase Storage",
        details: deleteResult.error
      });
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: "Failed to delete document" });
  }
};

// Search documents by filename or content using Firebase
export const searchDocuments = async (req, res) => {
  try {
    const { query } = req.query;
    
    let filteredDocuments;
    
    if (!query) {
      // Return all documents from cache
      filteredDocuments = documentHistory;
    } else {
      // Use Firebase search for more comprehensive results
      filteredDocuments = await searchDocumentsInFirebase(query);
    }
    
    res.json({
      success: true,
      documents: filteredDocuments,
      total: filteredDocuments.length,
      query: query,
      source: 'Firebase Storage'
    });
  } catch (error) {
    console.error('Error searching documents:', error);
    res.status(500).json({ error: "Failed to search documents" });
  }
};

// Get analytics/statistics (enhanced with storage info)
export const getDocumentStats = async (req, res) => {
  try {
    const totalDocuments = documentHistory.length;
    const pendingValidation = documentHistory.filter(doc => 
      doc.status === 'pending_validation'
    ).length;
    const processed = documentHistory.filter(doc => 
      doc.status === 'processed'
    ).length;
    
    // Get most common topics
    const allTopics = documentHistory.flatMap(doc => 
      doc.document.analysis?.topics?.items || []
    );
    const topicCounts = {};
    allTopics.forEach(topic => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
    const popularTopics = Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));        // Get Firebase storage statistics
        const storageStats = await getFirebaseStorageStats();
        
        res.json({
          success: true,
          stats: {
            totalDocuments,
            pendingValidation,
            processed,
            popularTopics,
            averageConfidence: documentHistory.length > 0 
              ? documentHistory.reduce((sum, doc) => {
                  const analysis = doc.document.analysis;
                  if (!analysis) return sum;
                  const avgConfidence = (
                    (analysis.summary?.confidence || 0) +
                    (analysis.topics?.confidence || 0) +
                    (analysis.entities?.confidence || 0) +
                    (analysis.sentiment?.confidence || 0)
                  ) / 4;
                  return sum + avgConfidence;
                }, 0) / documentHistory.length 
              : 0,
            storage: storageStats,
            storageLocation: 'Firebase Storage (gs://try1-7d848.firebasestorage.app/TeachAI)'
          }
        });
  } catch (error) {
    console.error('Error fetching document stats:', error);
    res.status(500).json({ error: "Failed to fetch document stats" });
  }
};

// Update document analysis (for human review/editing)
export const updateDocumentAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const { analysis, humanReviewed } = req.body;
    
    // Find the document in cache
    const documentIndex = documentHistory.findIndex(doc => doc.document.id === id);
    
    if (documentIndex === -1) {
      return res.status(404).json({ error: "Document not found" });
    }
    
    // Update the document
    documentHistory[documentIndex] = {
      ...documentHistory[documentIndex],
      document: {
        ...documentHistory[documentIndex].document,
        analysis: analysis
      },
      updatedAt: new Date().toISOString(),
      humanReviewed: humanReviewed || false
    };
    
    // Save to Firebase/storage
    const saveResult = await saveDocumentToFirebase(documentHistory[documentIndex]);
    
    if (saveResult.success) {
      res.json({
        success: true,
        document: documentHistory[documentIndex],
        message: "Document analysis updated successfully"
      });
    } else {
      res.status(500).json({
        error: "Failed to save updated analysis",
        details: saveResult.error
      });
    }
  } catch (error) {
    console.error('Error updating document analysis:', error);
    res.status(500).json({ error: "Failed to update document analysis" });
  }
};

// Initialize the document cache from persistent storage
export { initializeDocumentCache };
