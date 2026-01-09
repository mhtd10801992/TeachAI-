// Validation Controller - Handle user review and editing
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractAbbreviations } from '../services/aiService.js';
import { getStorage } from 'firebase-admin/storage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DICTIONARY_PATH = path.join(__dirname, '../data/global-dictionary.json');
const FIREBASE_DICTIONARY_PATH = 'TeachAI/global-dictionary.json';

// Check if Firebase is available
let useFirebase = false;
let bucket = null;
try {
  bucket = getStorage().bucket();
  useFirebase = true;
} catch (error) {
  console.log('⚠️ Firebase not available for dictionary, using local storage');
}

// Load global dictionary (from Firebase or local fallback)
const loadDictionary = async () => {
  try {
    // Try Firebase first
    if (useFirebase && bucket) {
      const file = bucket.file(FIREBASE_DICTIONARY_PATH);
      const [exists] = await file.exists();
      
      if (exists) {
        const [content] = await file.download();
        console.log('📚 Loaded dictionary from Firebase');
        return JSON.parse(content.toString());
      } else {
        console.log('📚 No dictionary in Firebase, creating new one');
      }
    }
    
    // Fallback to local storage
    if (fs.existsSync(DICTIONARY_PATH)) {
      const data = fs.readFileSync(DICTIONARY_PATH, 'utf8');
      console.log('📚 Loaded dictionary from local storage');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load dictionary:', error);
  }
  
  // Return default empty dictionary
  return { 
    version: "1.0", 
    lastUpdated: new Date().toISOString(), 
    terms: {}, 
    statistics: { 
      totalTerms: 0, 
      lastAddedTerm: null, 
      documentsProcessed: 0 
    } 
  };
};

// Save global dictionary (to Firebase and local backup)
const saveDictionary = async (dictionary) => {
  try {
    // Save to Firebase
    if (useFirebase && bucket) {
      const file = bucket.file(FIREBASE_DICTIONARY_PATH);
      await file.save(JSON.stringify(dictionary, null, 2), {
        metadata: {
          contentType: 'application/json',
          metadata: {
            type: 'global-dictionary',
            lastUpdated: dictionary.lastUpdated,
            totalTerms: dictionary.statistics.totalTerms
          }
        }
      });
      console.log(`💾 Dictionary saved to Firebase: ${dictionary.statistics.totalTerms} terms`);
    }
    
    // Always save local backup
    fs.writeFileSync(DICTIONARY_PATH, JSON.stringify(dictionary, null, 2), 'utf8');
    console.log(`💾 Dictionary backup saved locally: ${dictionary.statistics.totalTerms} terms`);
    
    return true;
  } catch (error) {
    console.error('Failed to save dictionary:', error);
    
    // Try local fallback
    try {
      fs.writeFileSync(DICTIONARY_PATH, JSON.stringify(dictionary, null, 2), 'utf8');
      console.log('💾 Dictionary saved locally (Firebase failed)');
      return true;
    } catch (localError) {
      console.error('Failed to save dictionary locally:', localError);
      return false;
    }
  }
};

export const getDocumentForValidation = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    // Retrieve pending document
    const pendingDoc = global.pendingDocuments?.get(documentId);
    if (!pendingDoc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json({
      success: true,
      document: pendingDoc
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve document' });
  }
};

export const updateDocumentValidation = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { 
      summary, 
      topics, 
      entities, 
      sentiment, 
      questionAnswers,
      userComments 
    } = req.body;
    
    // Get pending document
    const pendingDoc = global.pendingDocuments?.get(documentId);
    if (!pendingDoc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Update with user edits
    const updatedAnalysis = {
      ...pendingDoc.aiAnalysis,
      summary: summary || pendingDoc.aiAnalysis.summary,
      topics: topics || pendingDoc.aiAnalysis.topics,
      entities: entities || pendingDoc.aiAnalysis.entities,
      sentiment: sentiment || pendingDoc.aiAnalysis.sentiment,
      questionAnswers: questionAnswers || {},
      userValidated: true,
      validatedAt: new Date().toISOString(),
      userComments: userComments || ''
    };
    
    // Update document
    pendingDoc.aiAnalysis = updatedAnalysis;
    pendingDoc.status = 'user_validated';
    
    res.json({
      success: true,
      message: 'Document validation updated',
      document: {
        id: documentId,
        status: 'user_validated',
        analysis: updatedAnalysis
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to update validation' });
  }
};

export const approveDocumentForVectorization = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    // Get validated document
    const pendingDoc = global.pendingDocuments?.get(documentId);
    if (!pendingDoc || pendingDoc.status !== 'user_validated') {
      return res.status(400).json({ error: 'Document not ready for approval' });
    }
    
    // Proceed with vectorization
    const vectorResult = await storeInVectorDB({
      documentId: documentId,
      text: pendingDoc.text,
      analysis: pendingDoc.aiAnalysis,
      metadata: {
        filename: pendingDoc.filename,
        userValidated: true,
        validatedAt: pendingDoc.aiAnalysis.validatedAt
      }
    });
    
    // Move from pending to processed
    global.pendingDocuments.delete(documentId);
    
    res.json({
      success: true,
      message: 'Document approved and vectorized',
      document: {
        id: documentId,
        status: 'vectorized',
        vectorResult: vectorResult
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve document' });
  }
};

export const saveQuestionForLater = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { questions, priority = 'medium' } = req.body;
    
    // Save questions to user's queue
    global.questionQueue = global.questionQueue || [];
    
    const queueItem = {
      id: `q_${Date.now()}`,
      documentId,
      questions: Array.isArray(questions) ? questions : [questions],
      priority,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    
    global.questionQueue.push(queueItem);
    
    res.json({
      success: true,
      message: 'Questions saved to queue',
      queueItem
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to save questions' });
  }
};

export const getUserQuestionQueue = async (req, res) => {
  try {
    const queue = global.questionQueue || [];
    
    // Sort by priority and date
    const sortedQueue = queue
      .filter(item => item.status === 'pending')
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    
    res.json({
      success: true,
      queue: sortedQueue,
      totalPending: sortedQueue.length
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to get question queue' });
  }
};

export const answerQueuedQuestions = async (req, res) => {
  try {
    const { queueId } = req.params;
    const { answers } = req.body;
    
    // Find queue item
    const queueIndex = global.questionQueue?.findIndex(item => item.id === queueId);
    if (queueIndex === -1) {
      return res.status(404).json({ error: 'Queue item not found' });
    }
    
    // Update with answers
    global.questionQueue[queueIndex] = {
      ...global.questionQueue[queueIndex],
      answers,
      status: 'answered',
      answeredAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Questions answered',
      queueItem: global.questionQueue[queueIndex]
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to answer questions' });
  }
};

export const getPendingDocuments = async (req, res) => {
  try {
    const pending = global.pendingDocuments ? 
      Array.from(global.pendingDocuments.values()) : [];
    
    const summary = pending.map(doc => ({
      id: doc.id,
      filename: doc.filename,
      status: doc.status,
      createdAt: doc.createdAt,
      questionsCount: doc.aiAnalysis.questions?.length || 0,
      confidenceIssues: [
        doc.aiAnalysis.summaryConfidence < 0.8 ? 'summary' : null,
        doc.aiAnalysis.topicsConfidence < 0.7 ? 'topics' : null,
        doc.aiAnalysis.entitiesConfidence < 0.75 ? 'entities' : null,
        doc.aiAnalysis.sentimentConfidence < 0.6 ? 'sentiment' : null
      ].filter(Boolean)
    }));
    
    res.json({
      success: true,
      pendingDocuments: summary,
      totalPending: summary.length
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to get pending documents' });
  }
};

// Get global dictionary
export const getGlobalDictionary = async (req, res) => {
  try {
    const dictionary = await loadDictionary();
    res.json({
      success: true,
      dictionary
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get dictionary' });
  }
};

// Extract abbreviations from document
export const extractDocumentAbbreviations = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    // Get document
    const pendingDoc = global.pendingDocuments?.get(documentId);
    if (!pendingDoc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Load existing dictionary to avoid duplicates
    const dictionary = await loadDictionary();
    
    // Extract abbreviations using AI
    const abbreviations = await extractAbbreviations(pendingDoc.text, dictionary.terms);
    
    // Store in document for user review
    pendingDoc.abbreviations = abbreviations;
    
    res.json({
      success: true,
      abbreviations,
      message: `Found ${abbreviations.length} terms that may need definition`
    });
    
  } catch (error) {
    console.error('Failed to extract abbreviations:', error);
    res.status(500).json({ error: 'Failed to extract abbreviations' });
  }
};

// Update dictionary with user-defined terms
export const updateDictionaryTerms = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { terms } = req.body; // Array of { term, definition, category, source }
    
    if (!Array.isArray(terms)) {
      return res.status(400).json({ error: 'Terms must be an array' });
    }
    
    const dictionary = await loadDictionary();
    let addedCount = 0;
    let updatedCount = 0;
    
    terms.forEach(termData => {
      if (termData.term && termData.definition) {
        const termKey = termData.term.toLowerCase();
        const isNew = !dictionary.terms[termKey];
        
        dictionary.terms[termKey] = {
          term: termData.term,
          definition: termData.definition,
          category: termData.category || 'general',
          addedAt: dictionary.terms[termKey]?.addedAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          source: termData.source || documentId,
          usageCount: (dictionary.terms[termKey]?.usageCount || 0) + 1,
          contexts: [
            ...(dictionary.terms[termKey]?.contexts || []),
            { documentId, addedAt: new Date().toISOString() }
          ].slice(-5) // Keep last 5 contexts
        };
        
        if (isNew) {
          addedCount++;
        } else {
          updatedCount++;
        }
      }
    });
    
    // Update statistics
    dictionary.statistics = {
      totalTerms: Object.keys(dictionary.terms).length,
      lastAddedTerm: terms[terms.length - 1]?.term || dictionary.statistics.lastAddedTerm,
      documentsProcessed: (dictionary.statistics.documentsProcessed || 0) + 1
    };
    dictionary.lastUpdated = new Date().toISOString();
    
    // Save dictionary
    const saved = await saveDictionary(dictionary);
    
    if (saved) {
      res.json({
        success: true,
        message: `Dictionary updated: ${addedCount} new terms, ${updatedCount} updated`,
        addedCount,
        updatedCount,
        totalTerms: dictionary.statistics.totalTerms
      });
    } else {
      res.status(500).json({ error: 'Failed to save dictionary' });
    }
    
  } catch (error) {
    console.error('Failed to update dictionary:', error);
    res.status(500).json({ error: 'Failed to update dictionary' });
  }
};

// Search dictionary terms
export const searchDictionary = async (req, res) => {
  try {
    const { query } = req.query;
    const dictionary = await loadDictionary();
    
    if (!query) {
      return res.json({
        success: true,
        results: Object.values(dictionary.terms)
      });
    }
    
    const searchLower = query.toLowerCase();
    const results = Object.values(dictionary.terms).filter(term => 
      term.term.toLowerCase().includes(searchLower) ||
      term.definition.toLowerCase().includes(searchLower)
    );
    
    res.json({
      success: true,
      results,
      count: results.length
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to search dictionary' });
  }
};

