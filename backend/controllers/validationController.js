// Validation Controller - Handle user review and editing
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
