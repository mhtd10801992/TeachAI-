import { processWithAI, extractActionableSteps, extractMermaidGraph, extractDOEFactors, explainSectionInContext, extractConceptGraph, inferConceptRelationships, normalizeConceptGraph, explainConcept, compareConcepts, explainReasoningChain, generateQuiz } from "../services/aiService.js";
import { getDocumentFromFirebase, saveMindMapToFirebase, getMindMapFromFirebase } from "../services/firebaseStorageService.js";

export const aiController = {
      async mermaidGraph(req, res) {
        try {
          const { text } = req.body;
          const code = await extractMermaidGraph(text);
          res.json({ success: true, code });
        } catch (error) {
          res.status(500).json({ success: false, message: error.message });
        }
      },
      async doeFactors(req, res) {
        try {
          const { text } = req.body;
          const factors = await extractDOEFactors(text);
          res.json({ success: true, factors });
        } catch (error) {
          res.status(500).json({ success: false, message: error.message });
        }
      },
    async actionableSteps(req, res) {
      try {
        const { text } = req.body;
        const steps = await extractActionableSteps(text);
        res.json({ success: true, steps });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    },
  
  // Generate and persist a full mind map (concepts + relationships) for a document
  async mindMap(req, res) {
    try {
      const { documentId, forceRefresh } = req.body || {};

      if (!documentId) {
        return res.status(400).json({ success: false, message: 'documentId is required' });
      }

      // If not forcing a refresh, try to load an existing mind map first
      if (!forceRefresh) {
        const existing = await getMindMapFromFirebase(documentId);
        if (existing) {
          return res.json({
            success: true,
            mindMap: existing,
            fromCache: true
          });
        }
      }

      const stored = await getDocumentFromFirebase(documentId);
      if (!stored || !stored.document) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }

      const doc = stored.document;
      const analysis = doc.analysis || {};
      const text =
        doc.fullText ||
        doc.text ||
        doc.rawText ||
        doc?.metadata?.content?.fullText ||
        analysis.originalText ||
        analysis.documentWithHighlights?.fullText ||
        '';
      const analysisChunks = Array.isArray(analysis.chunks) ? analysis.chunks : [];

      if (!text || typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ success: false, message: 'No text available to generate mind map' });
      }

      // Layer 2 — concept extraction
      const { concepts } = await extractConceptGraph(text);

      // Ensure all concepts have an 'id' field (use name as ID)
      const conceptsWithIds = (concepts || []).map(c => ({
        ...c,
        id: c.id || c.name,
        name: c.name || c.id
      }));

      // Layer 3 — relationship building
      const { relationships } = await inferConceptRelationships(conceptsWithIds, text);

      // Step 7 — ground concepts in chunks when available
      const conceptsWithChunks = (conceptsWithIds || []).map((concept) => {
        if (!analysisChunks.length || !concept?.name) return concept;

        const nameLower = concept.name.toLowerCase();
        const matchingChunks = analysisChunks.filter((chunk) => {
          if (!chunk || typeof chunk.text !== 'string') return false;
          return chunk.text.toLowerCase().includes(nameLower);
        });

        if (!matchingChunks.length) return concept;

        const primary = matchingChunks[0];
        return {
          ...concept,
          chunkIds: matchingChunks.map((c) => c.chunkId).filter(Boolean),
          primaryChunkId: primary.chunkId,
          headingPathFromChunks: primary.headingPath || [],
          pageRangeFromChunks: primary.pageRange || [],
        };
      });

      const mindMap = {
        documentId,
        concepts: conceptsWithChunks,
        relationships: relationships || [],
        generatedAt: new Date().toISOString()
      };

      // Persist to Firebase/local under TeachAI/mind-map/{documentId}.json
      const saveResult = await saveMindMapToFirebase(documentId, mindMap);

      res.json({
        success: true,
        mindMap,
        fromCache: false,
        storage: saveResult.storage || 'unknown',
        path: saveResult.firebasePath || saveResult.localPath || null
      });
    } catch (error) {
      console.error('Mind map generation error:', error);
      res.status(500).json({ success: false, message: 'Failed to generate mind map', error: error.message });
    }
  },
  
    // Extract a strict concepts/knowledge-graph JSON structure for a document
    async conceptGraph(req, res) {
      try {
        const { documentId, text } = req.body || {};

        let sourceText = text;

        if (!sourceText && documentId) {
          const stored = await getDocumentFromFirebase(documentId);
          if (!stored || !stored.document) {
            return res.status(404).json({ success: false, error: 'Document not found for concept graph' });
          }

          // Prefer fullText if available, else fall back to analysis and metadata content
          const doc = stored.document;
          const analysis = doc.analysis || {};
          sourceText =
            doc.fullText ||
            doc.text ||
            doc.rawText ||
            doc?.metadata?.content?.fullText ||
            analysis.originalText ||
            analysis.documentWithHighlights?.fullText ||
            '';
        }

        if (!sourceText || typeof sourceText !== 'string' || sourceText.trim().length === 0) {
          return res.status(400).json({ success: false, error: 'No text available to extract concept graph' });
        }

        const result = await extractConceptGraph(sourceText);
        res.json({ success: true, concepts: result.concepts || [] });
      } catch (error) {
        console.error('Concept graph error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to extract concept graph' });
      }
    },

  // Normalize a concept graph (merge duplicates, clean up)
  async normalizeGraph(req, res) {
    try {
      const { concepts, relationships } = req.body || {};

      if (!Array.isArray(concepts)) {
        return res.status(400).json({ success: false, error: 'concepts array is required' });
      }

      const rawGraph = {
        concepts,
        relationships: relationships || []
      };

      const normalized = await normalizeConceptGraph(rawGraph);

      res.json({
        success: true,
        graph: normalized,
        stats: {
          original: normalized.originalCount,
          normalized: normalized.normalizedCount,
          removed: {
            concepts: (normalized.originalCount?.concepts || 0) - (normalized.normalizedCount?.concepts || 0),
            relationships: (normalized.originalCount?.relationships || 0) - (normalized.normalizedCount?.relationships || 0)
          }
        }
      });
    } catch (error) {
      console.error('Graph normalization error:', error.message);
      res.status(500).json({ success: false, error: 'Failed to normalize graph' });
    }
  },

  async testAI(req, res) {
    try {
      const prompt = "Say 'ok' if you are working.";
      const aiResult = await processWithAI(prompt, { summarize: false });
      const isSuccess = aiResult && aiResult.summary?.toLowerCase().includes('ok');
      res.json({
        success: isSuccess,
        message: isSuccess ? "AI is working!" : "AI test failed.",
        isMockResponse: false,
        details: aiResult
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "AI test endpoint failed.",
        error: error.message
      });
    }
  },
  
    async listModels(req, res) {
    // OpenAI does not support listing models via API key, so return static info
    res.json({
      success: true,
      models: ["gpt-3.5-turbo", "gpt-4", "text-embedding-ada-002"]
    });
    },

  async askQuestion(req, res) {
    try {
      const { text, options } = req.body;
      const aiResult = await processWithAI(text, options || {});
      res.json({ success: true, result: aiResult });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  async getInsights(req, res) {
    try {
      const { text } = req.body;
      const aiResult = await processWithAI(text, { extractKeyInsights: true });
      res.json({ success: true, insights: aiResult });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  async clarify(req, res) {
    try {
      const { text } = req.body;
      const aiResult = await processWithAI(text, { clarify: true });
      res.json({ success: true, clarification: aiResult });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  async explain(req, res) {
    try {
      const { text } = req.body;
      const aiResult = await processWithAI(text, { explain: true });
      res.json({ success: true, explanation: aiResult });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  async systemStatus(req, res) {
    const status = {
      timestamp: new Date().toISOString(),
      services: {},
      activities: []
    };

    try {
      // Check OpenAI API
      try {
        const openai = new (await import('openai')).default({ apiKey: process.env.OPENAI_API_KEY });
        await openai.models.list();
        status.services.openai = { status: 'running', message: 'OpenAI API connected' };
      } catch (error) {
        status.services.openai = { status: 'failed', message: `OpenAI API error: ${error.message}` };
      }

      // Check Firebase
      try {
        const { getFirestore } = await import('firebase-admin/firestore');
        const db = getFirestore();
        await db.collection('documents').limit(1).get();
        status.services.firebase = { status: 'running', message: 'Firebase connected' };
      } catch (error) {
        status.services.firebase = { status: 'failed', message: `Firebase error: ${error.message}` };
      }

      // Check Firebase Storage
      try {
        const { getStorage } = await import('firebase-admin/storage');
        const bucket = getStorage().bucket();
        await bucket.exists();
        status.services.firebaseStorage = { status: 'running', message: 'Firebase Storage connected' };
      } catch (error) {
        status.services.firebaseStorage = { status: 'failed', message: `Firebase Storage error: ${error.message}` };
      }

      // Test AI processing
      try {
        const testResult = await processWithAI('test', { summarize: true });
        status.services.aiProcessing = {
          status: 'running',
          message: 'AI processing functional',
          lastTest: new Date().toISOString()
        };
      } catch (error) {
        status.services.aiProcessing = {
          status: 'failed',
          message: `AI processing error: ${error.message}`
        };
      }

      // Check document processing capabilities
      status.activities = [
        {
          name: 'Document Upload',
          status: status.services.firebase?.status === 'running' && status.services.firebaseStorage?.status === 'running' ? 'running' : 'failed',
          message: 'File upload and storage functionality'
        },
        {
          name: 'Text Extraction',
          status: 'running',
          message: 'PDF and text file processing'
        },
        {
          name: 'AI Analysis',
          status: status.services.aiProcessing?.status === 'running' ? 'running' : 'failed',
          message: 'Document summarization and analysis'
        },
        {
          name: 'Process Flow Extraction',
          status: status.services.aiProcessing?.status === 'running' ? 'running' : 'failed',
          message: 'Case study and experiment analysis'
        },
        {
          name: 'Document Storage',
          status: status.services.firebase?.status === 'running' ? 'running' : 'failed',
          message: 'Persistent document storage'
        }
      ];

      res.json({ success: true, status });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to check system status',
        error: error.message
      });
    }
  },
  async sectionExplain(req, res) {
    try {
      const { documentId, sectionIndex, source, title } = req.body;

      if (!documentId) {
        return res.status(400).json({ success: false, message: 'documentId is required' });
      }

      const stored = await getDocumentFromFirebase(documentId);
      if (!stored || !stored.document) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }

      const doc = stored.document;
      const metadata = doc.metadata || {};
      const analysis = doc.analysis || {};

      const parserSections = (metadata.structure && Array.isArray(metadata.structure.sections))
        ? metadata.structure.sections
        : [];
      const aiSections = Array.isArray(analysis.sections) ? analysis.sections : [];

      let chosenSource = source;
      if (!chosenSource) {
        chosenSource = parserSections.length ? 'parser' : 'ai';
      }

      let sectionList = chosenSource === 'parser' ? parserSections : aiSections;

      if (!sectionList || !sectionList.length) {
        return res.status(404).json({
          success: false,
          message: 'No sections available for explanation from the requested source',
          source: chosenSource
        });
      }

      let section = null;

      if (typeof sectionIndex === 'number' && sectionIndex >= 0 && sectionIndex < sectionList.length) {
        section = sectionList[sectionIndex];
      }

      if (!section && title) {
        const lowerTitle = title.toLowerCase();
        section = sectionList.find(s => (s.title || '').toLowerCase().includes(lowerTitle));
      }

      if (!section) {
        section = sectionList[0];
      }

      const sectionTitle = section.title || title || 'Selected section';
      let sectionText = '';

      if (chosenSource === 'parser') {
        sectionText = section.content || '';
      } else {
        const parts = [];
        if (section.summary) parts.push(section.summary);
        if (Array.isArray(section.keyPoints)) {
          parts.push(section.keyPoints.join('\n- '));
        }
        sectionText = parts.join('\n\n');
      }

      if (!sectionText) {
        return res.status(400).json({
          success: false,
          message: 'Selected section has no text content to explain',
          source: chosenSource
        });
      }

      const documentTitle = doc.filename || documentId;
      const documentSummary = analysis.summary?.text || '';

      const explanation = await explainSectionInContext({
        sectionTitle,
        sectionText,
        documentTitle,
        documentSummary
      });

      res.json({
        success: true,
        explanation,
        meta: {
          source: chosenSource,
          sectionTitle,
          sectionIndex: typeof sectionIndex === 'number' ? sectionIndex : 0
        }
      });
    } catch (error) {
      console.error('Section explanation endpoint error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate section explanation',
        error: error.message
      });
    }
  },

  // LLM-powered concept explanation
  async explainGraphConcept(req, res) {
    try {
      const { concept, neighbors } = req.body;

      if (!concept || !concept.label) {
        return res.status(400).json({ 
          success: false, 
          message: 'concept with label is required' 
        });
      }

      const explanation = await explainConcept({ 
        concept, 
        neighbors: neighbors || [] 
      });

      res.json({
        success: true,
        explanation,
        concept: concept.label
      });
    } catch (error) {
      console.error('Concept explanation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to explain concept',
        error: error.message
      });
    }
  },

  // LLM-powered concept comparison
  async compareGraphConcepts(req, res) {
    try {
      const { conceptA, conceptB } = req.body;

      if (!conceptA || !conceptA.label || !conceptB || !conceptB.label) {
        return res.status(400).json({ 
          success: false, 
          message: 'Two concepts with labels are required' 
        });
      }

      const comparison = await compareConcepts({ conceptA, conceptB });

      res.json({
        success: true,
        comparison,
        concepts: [conceptA.label, conceptB.label]
      });
    } catch (error) {
      console.error('Concept comparison error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to compare concepts',
        error: error.message
      });
    }
  },

  // LLM-powered reasoning chain explanation
  async explainGraphReasoningChain(req, res) {
    try {
      const { concepts } = req.body;

      if (!Array.isArray(concepts) || concepts.length < 2) {
        return res.status(400).json({ 
          success: false, 
          message: 'Array of at least 2 concepts is required' 
        });
      }

      const explanation = await explainReasoningChain({ concepts });

      res.json({
        success: true,
        explanation,
        conceptChain: concepts.map(c => c.label)
      });
    } catch (error) {
      console.error('Reasoning chain explanation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to explain reasoning chain',
        error: error.message
      });
    }
  },

  // LLM-powered quiz generation
  async generateGraphQuiz(req, res) {
    try {
      const { concept } = req.body;

      if (!concept || !concept.label) {
        return res.status(400).json({ 
          success: false, 
          message: 'concept with label is required' 
        });
      }

      const quiz = await generateQuiz({ concept });

      res.json({
        success: true,
        quiz,
        concept: concept.label
      });
    } catch (error) {
      console.error('Quiz generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate quiz',
        error: error.message
      });
    }
  },

  // Analyze selected images with AI and explain their relationship to document
  async analyzeSelectedImages(req, res) {
    try {
      const { documentId, imageIndices } = req.body;

      if (!documentId) {
        return res.status(400).json({ 
          success: false, 
          message: 'documentId is required' 
        });
      }

      if (!Array.isArray(imageIndices) || imageIndices.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Array of imageIndices is required' 
        });
      }

      // Get document from storage
      const stored = await getDocumentFromFirebase(documentId);
      if (!stored || !stored.document) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }

      const doc = stored.document;
      const analysis = doc.analysis || {};
      const allImages = analysis.imageAnalysis || [];

      // Get text summary for context
      const text = doc.fullText || doc.text || doc.rawText || analysis.originalText || '';
      const summary = analysis.summary || '';
      const context = summary || (text.length > 2000 ? text.substring(0, 2000) + '...' : text);

      // Analyze each selected image
      const results = {};
      for (const index of imageIndices) {
        if (index < 0 || index >= allImages.length) {
          console.warn(`Image index ${index} out of range, skipping`);
          continue;
        }

        const image = allImages[index];
        
        try {
          // Use OpenAI to explain how this image relates to the document
          const explanation = await explainConcept({
            concept: {
              label: image.caption || `Image ${index + 1}`,
              description: image.description || 'Extracted image from document'
            },
            additionalContext: `This image was extracted from a document. Document context: ${context.substring(0, 500)}...`
          });

          results[index] = {
            explanation: explanation.explanation || 'Analysis complete',
            relationship: explanation.relationship || 'This image is related to the document content',
            caption: image.caption,
            description: image.description
          };

          console.log(`✅ Analyzed image ${index + 1}: ${image.caption || 'Untitled'}`);
        } catch (imageError) {
          console.error(`Error analyzing image ${index}:`, imageError);
          results[index] = {
            explanation: 'Failed to analyze this image',
            error: imageError.message
          };
        }
      }

      res.json({
        success: true,
        results,
        analyzedCount: Object.keys(results).length
      });
    } catch (error) {
      console.error('Image analysis error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze images',
        error: error.message
      });
    }
  },
};
