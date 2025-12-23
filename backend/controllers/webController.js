
import { saveDocument } from './documentController.js';

export const webController = {
  async analyzeUrl(req, res) {
    try {
      const { url, saveToHistory } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      console.log(`🌐 Request to analyze: ${url}`);
      
      const { analyzeWebUrl } = await import('../services/webScraperService.js');
      const analysis = await analyzeWebUrl(url);
      
      if (analysis.mock && analysis.summary && analysis.summary.includes("Access Denied")) {
           return res.status(403).json(analysis);
      }

      // If requested, save this analysis as a document in the history
      if (saveToHistory) {
          const docId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          const documentData = {
              success: true,
              status: 'processed',
              document: {
                  id: docId,
                  filename: analysis.title || url,
                  size: analysis.textContent?.length || 0,
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
                      // Store the rich web-specific data
                      insights: [], 
                      sections: [],
                      validationPoints: [],
                      documentWithHighlights: { 
                          fullText: analysis.textContent, 
                          highlights: [] 
                      },
                      
                      // Custom fields for web analysis
                      webAnalysis: {
                          imageAnalysis: analysis.imageAnalysis,
                          scholarlyData: analysis.scholarlyData,
                          images: analysis.images
                      }
                  },
                  processingTime: 2000,
                  vectorized: true
              }
          };

          await saveDocument(documentData);
          console.log(`✅ Saved web analysis to history: ${docId}`);
          
          // Return the saved document structure so frontend can use it if needed
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
