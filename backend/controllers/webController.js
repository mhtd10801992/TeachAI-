
import { saveDocument } from './documentController.js';
import { analyzeWebUrl } from '../services/webScraperService.js';

export const webController = {
  async analyzeUrl(req, res) {
    try {
      const { url, saveToHistory } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      console.log(`🌐 Request to analyze: ${url}`);
      
      const analysis = await analyzeWebUrl(url);
      
      if (analysis.mock && analysis.summary && analysis.summary.includes("Access Denied")) {
           return res.status(403).json(analysis);
      }

      // If requested, save this analysis as a document in the history
      if (saveToHistory) {
          const docId = `web_${Date.now()}`;
          
          const documentData = {
              success: true,
              status: 'processed',
              document: {
                  id: docId,
                  // Use data from the new fileData object returned by the service
                  filename: analysis.fileData.filename,
                  size: analysis.fileData.size,
                  storagePath: analysis.fileData.storagePath, // <-- The crucial new field
                  uploadDate: new Date().toISOString(),
                  type: 'web_analysis',
                  url: url,
                  
                  // Map the web analysis to the document structure
                  analysis: {
                      summary: {
                          text: analysis.summary,
                          confidence: 0.9,
                          needsReview: false
                      },
                      topics: {
                          items: ['Web Content', 'Research', 'Online Resource'], 
                          confidence: 0.85
                      },
                      entities: {
                          items: [], 
                          confidence: 0.8
                      },
                      sentiment: {
                          value: 'neutral',
                          confidence: 0.8
                      },
                      insights: [], 
                      sections: [],
                      validationPoints: [],
                      documentWithHighlights: { 
                          fullText: analysis.textContent, 
                          highlights: [] 
                      },
                      originalText: analysis.textContent,
                      // Add image analysis results in the same format as file upload
                      imageAnalysis: analysis.images || [],
                      tables: [],
                      webAnalysis: {
                          imageAnalysis: analysis.imageAnalysis,
                          scholarlyData: analysis.scholarlyData,
                          images: analysis.images,
                          imageCount: analysis.imageCount || 0
                      }
                  },
                  processingTime: 2000,
                  vectorized: true
              }
          };

          await saveDocument(documentData);
          console.log(`✅ Saved web analysis to history: ${docId}`);
          
          return res.json({
              ...analysis,
              savedDocumentId: docId,
              message: "Analysis saved to history"
          });
      }

      res.json(analysis);
      
    } catch (error) {
      console.error('Controller Error:', error);
      res.status(500).json({ 
        error: 'Failed to analyze website', 
        details: error.message 
      });
    }
  }
};
