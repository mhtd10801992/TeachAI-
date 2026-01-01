import { extractImagesFromPDF } from '../services/pdfImageExtractor.js';
import { describeImageWithAI } from '../services/imageAIService.js';
// Analyze images in PDF and add AI descriptions
export const analyzePDFImages = async (req, res) => {
  try {
    const { pdfPath } = req.body;
    if (!pdfPath) {
      return res.status(400).json({ error: 'pdfPath is required' });
    }
    // Extract images from PDF
    const images = await extractImagesFromPDF(pdfPath);
    const imageDescriptions = [];
    for (const img of images) {
      const description = await describeImageWithAI(img);
      imageDescriptions.push({ description });
    }
    res.json({
      success: true,
      images: images.length,
      descriptions: imageDescriptions
    });
  } catch (error) {
    console.error('Error analyzing PDF images:', error);
    res.status(500).json({ error: 'Failed to analyze PDF images' });
  }
};
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
  // Auto-categorize document based on topics
  let category = 'General';
  if (documentData.document?.analysis?.topics?.items) {
    const topics = documentData.document.analysis.topics.items;
    const topicsStr = typeof topics === 'string' ? topics.toLowerCase() : topics.join(' ').toLowerCase();
    
    // Simple categorization logic
    if (topicsStr.includes('automotive') || topicsStr.includes('vehicle') || topicsStr.includes('car')) {
      category = 'Automotive';
    } else if (topicsStr.includes('epa') || topicsStr.includes('environment') || topicsStr.includes('emission')) {
      category = 'Environmental';
    } else if (topicsStr.includes('cost') || topicsStr.includes('manufacturing') || topicsStr.includes('production')) {
      category = 'Manufacturing';
    } else if (topicsStr.includes('technology') || topicsStr.includes('innovation')) {
      category = 'Technology';
    } else if (topicsStr.includes('policy') || topicsStr.includes('regulation') || topicsStr.includes('compliance')) {
      category = 'Policy & Regulation';
    }
  }
  
  const document = {
    ...documentData,
    category: category,
    tags: extractTags(documentData),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Save to Firebase Storage
  const firebaseResult = await saveDocumentToFirebase(document);
  
  if (firebaseResult.success) {
    // Add to memory cache only if Firebase save succeeded
    documentHistory.unshift(document); // Add to beginning of array
    console.log(`Document saved to Firebase: ${document.document.filename} (Category: ${category}, ID: ${document.document.id})`);
    return document;
  } else {
    console.error('Failed to save document to Firebase:', firebaseResult.error);
    throw new Error(`Firebase save failed: ${firebaseResult.error}`);
  }
};

// Helper function to extract tags from document
const extractTags = (documentData) => {
  const tags = [];
  const analysis = documentData.document?.analysis;
  
  if (analysis?.topics?.items) {
    const topics = typeof analysis.topics.items === 'string' 
      ? analysis.topics.items.split(/[,\n]/).map(t => t.trim())
      : analysis.topics.items;
    tags.push(...topics.slice(0, 5)); // Max 5 topic tags
  }
  
  return [...new Set(tags)]; // Remove duplicates
};

// Get all documents from history
export const getAllDocuments = async (req, res) => {
  try {
    const { category } = req.query;
    
    console.log(`📊 Fetching documents - Cache has ${documentHistory.length} documents`);
    
    // Sort by most recent first
    let sortedDocuments = documentHistory.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    // Filter by category if specified
    if (category && category !== 'all') {
      sortedDocuments = sortedDocuments.filter(doc => doc.category === category);
      console.log(`Filtered to ${sortedDocuments.length} documents in category: ${category}`);
    }
    
    // Get unique categories for the response
    const categories = [...new Set(documentHistory.map(doc => doc.category || 'General'))];
    
    console.log(`📤 Sending ${sortedDocuments.length} documents to frontend`);
    
    res.json({
      success: true,
      documents: sortedDocuments,
      total: sortedDocuments.length,
      categories: categories
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

// Update validation point resolution
export const updateValidationPoint = async (req, res) => {
  try {
    const { id } = req.params;
    const { pointId, resolution } = req.body;
    
    // Find the document in cache
    const documentIndex = documentHistory.findIndex(doc => doc.document.id === id);
    
    if (documentIndex === -1) {
      return res.status(404).json({ error: "Document not found" });
    }
    
    // Update the validation point
    if (documentHistory[documentIndex].document.analysis?.validationPoints) {
      const validationPoints = documentHistory[documentIndex].document.analysis.validationPoints;
      const pointIndex = validationPoints.findIndex(vp => vp.id === pointId);
      
      if (pointIndex !== -1) {
        validationPoints[pointIndex] = {
          ...validationPoints[pointIndex],
          resolved: true,
          userResolution: resolution,
          resolvedAt: new Date().toISOString()
        };
        
        documentHistory[documentIndex].updatedAt = new Date().toISOString();
        
        // Save to Firebase/storage
        const saveResult = await saveDocumentToFirebase(documentHistory[documentIndex]);
        
        if (saveResult.success) {
          return res.json({
            success: true,
            message: "Validation point updated successfully",
            validationPoint: validationPoints[pointIndex]
          });
        } else {
          return res.status(500).json({
            error: "Failed to save validation update",
            details: saveResult.error
          });
        }
      }
    }
    
    return res.status(404).json({ error: "Validation point not found" });
  } catch (error) {
    console.error('Error updating validation point:', error);
    res.status(500).json({ error: "Failed to update validation point" });
  }
};

// Initialize the document cache from persistent storage
export { initializeDocumentCache };
