import { saveDocument } from './documentController.js';
import { saveUploadedFileToFirebase } from '../services/firebaseStorageService.js';

export const handleUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.file;
    const fileId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Save uploaded file to Firebase Storage
    const fileUploadResult = await saveUploadedFileToFirebase(file, fileId);
    
    if (!fileUploadResult.success) {
      return res.status(500).json({ 
        error: "Failed to upload file to Firebase Storage",
        details: fileUploadResult.error
      });
    }
    
    // Generate mock AI analysis based on file type and name
    const mockAnalysis = generateMockAnalysis(file);
    
    const responseData = {
      success: true,
      status: mockAnalysis.needsValidation ? 'pending_validation' : 'processed',
      document: {
        id: fileId,
        filename: file.originalname,
        size: file.size,
        uploadDate: new Date().toISOString(),
        firebaseUrl: fileUploadResult.downloadUrl,
        firebasePath: fileUploadResult.firebasePath,
        
        // AI Analysis Results matching AIAnalysisDisplay structure
        analysis: {
          summary: {
            text: mockAnalysis.summary,
            confidence: mockAnalysis.summaryConfidence,
            needsReview: mockAnalysis.summaryConfidence < 0.8
          },
          topics: {
            items: mockAnalysis.topics,
            confidence: mockAnalysis.topicsConfidence,
            needsReview: mockAnalysis.topicsConfidence < 0.7
          },
          entities: {
            items: mockAnalysis.entities,
            confidence: mockAnalysis.entitiesConfidence,
            needsReview: mockAnalysis.entitiesConfidence < 0.75
          },
          sentiment: {
            value: mockAnalysis.sentiment,
            confidence: mockAnalysis.sentimentConfidence,
            needsReview: mockAnalysis.sentimentConfidence < 0.6
          }
        },
        
        // AI questions if confidence is low
        questions: mockAnalysis.questions || [],
        
        // Processing metadata
        processingTime: mockAnalysis.processingTime,
        vectorized: !mockAnalysis.needsValidation
      }
    };
    
    // Save to document history (persistent storage)
    await saveDocument(responseData);
    
    res.json(responseData);
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: "Upload failed" });
  }
};

// Generate realistic mock AI analysis based on file characteristics
const generateMockAnalysis = (file) => {
  const filename = file.originalname.toLowerCase();
  const fileSize = file.size;
  
  // Base analysis template
  let analysis = {
    processingTime: Math.round(fileSize / 10000 + Math.random() * 2000),
    needsValidation: Math.random() < 0.3, // 30% chance of needing validation
    questions: []
  };
  
  // Generate analysis based on filename patterns
  if (filename.includes('report') || filename.includes('analysis')) {
    analysis = {
      ...analysis,
      summary: `This document appears to be a ${filename.includes('report') ? 'business report' : 'analytical document'} containing structured data and findings. The content includes statistical information, conclusions, and recommendations for decision-making processes.`,
      summaryConfidence: 0.85,
      topics: ['Business Analysis', 'Data Insights', 'Reporting', 'Metrics', 'Performance'],
      topicsConfidence: 0.92,
      entities: [
        { name: 'Q4 2024', type: 'DATE' },
        { name: 'Revenue', type: 'METRIC' },
        { name: 'Performance Indicators', type: 'CONCEPT' }
      ],
      entitiesConfidence: 0.78,
      sentiment: 'positive',
      sentimentConfidence: 0.74
    };
  } else if (filename.includes('manual') || filename.includes('guide') || filename.includes('documentation')) {
    analysis = {
      ...analysis,
      summary: `This document is instructional material providing step-by-step guidance and procedures. It contains detailed explanations, best practices, and reference information for users to follow established processes.`,
      summaryConfidence: 0.91,
      topics: ['Documentation', 'Instructions', 'Procedures', 'Guidelines', 'Reference'],
      topicsConfidence: 0.88,
      entities: [
        { name: 'Standard Procedure', type: 'PROCESS' },
        { name: 'User Manual', type: 'DOCUMENT' },
        { name: 'Guidelines', type: 'POLICY' }
      ],
      entitiesConfidence: 0.82,
      sentiment: 'neutral',
      sentimentConfidence: 0.95
    };
  } else if (filename.includes('research') || filename.includes('study') || filename.includes('paper')) {
    analysis = {
      ...analysis,
      summary: `This document presents research findings and academic analysis. It likely contains methodology, data collection results, statistical analysis, and scholarly conclusions with supporting evidence and citations.`,
      summaryConfidence: 0.76,
      topics: ['Research', 'Academic Study', 'Data Analysis', 'Methodology', 'Findings'],
      topicsConfidence: 0.83,
      entities: [
        { name: 'Research Methodology', type: 'CONCEPT' },
        { name: 'Statistical Analysis', type: 'PROCESS' },
        { name: 'Academic Institution', type: 'ORGANIZATION' }
      ],
      entitiesConfidence: 0.69,
      sentiment: 'neutral',
      sentimentConfidence: 0.81,
      questions: ['What specific research methodology was used in this study?', 'Are the statistical samples representative of the target population?']
    };
  } else if (filename.includes('contract') || filename.includes('agreement') || filename.includes('legal')) {
    analysis = {
      ...analysis,
      summary: `This document appears to be a legal or contractual document containing terms, conditions, and binding agreements between parties. It includes formal language, obligations, and legal stipulations.`,
      summaryConfidence: 0.88,
      topics: ['Legal Document', 'Contract Terms', 'Agreements', 'Compliance', 'Legal Framework'],
      topicsConfidence: 0.86,
      entities: [
        { name: 'Contract Terms', type: 'LEGAL' },
        { name: 'Party Agreement', type: 'LEGAL' },
        { name: 'Effective Date', type: 'DATE' }
      ],
      entitiesConfidence: 0.91,
      sentiment: 'neutral',
      sentimentConfidence: 0.89
    };
  } else {
    // Generic document analysis
    analysis = {
      ...analysis,
      summary: `This document contains general textual content with mixed information types. The AI has identified various topics and extracted key entities, but may benefit from human review to ensure accuracy of the analysis.`,
      summaryConfidence: 0.65,
      topics: ['General Content', 'Information', 'Text Document', 'Mixed Topics'],
      topicsConfidence: 0.58,
      entities: [
        { name: 'Document Content', type: 'CONCEPT' },
        { name: 'Text Analysis', type: 'PROCESS' }
      ],
      entitiesConfidence: 0.62,
      sentiment: 'neutral',
      sentimentConfidence: 0.71,
      questions: ['What is the primary purpose of this document?', 'Are there specific topics that should be emphasized in the analysis?']
    };
  }
  
  // Add validation requirement if confidence is low
  if (analysis.summaryConfidence < 0.8 || analysis.topicsConfidence < 0.7 || 
      analysis.entitiesConfidence < 0.75 || analysis.sentimentConfidence < 0.6) {
    analysis.needsValidation = true;
  }
  
  return analysis;
};