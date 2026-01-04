import { saveDocument } from './documentController.js';
import { saveUploadedFileToFirebase } from '../services/firebaseStorageService.js';
import { processWithAI } from '../services/aiService.js';
import { extractImagesFromPDF, renderPDFPagesAsImages, extractImagesFromWord } from '../services/pdfImageExtractor.js';
import { extractDocumentMetadata } from '../services/documentMetadataService.js';
// import { extractTablesFromPDF, formatTablesAsText } from '../services/pdfTableExtractor.js';  // DISABLED: pdf-table-extractor has incompatible bundled pdfjs-dist
import { describeImageWithAI } from '../services/imageAIService.js';
import fs from 'fs';
import path from 'path';

// Stub function since pdf-table-extractor is disabled
const formatTablesAsText = (tables) => '';
const extractTablesFromPDF = async (path) => [];

export const handleUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.file;
    const fileId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Save uploaded file to Firebase Storage
      const fileUploadResult = await saveUploadedFileToFirebase(file, fileId);
      
      if (!fileUploadResult.success) {
        return res.status(500).json({ 
          error: "Failed to upload file to Firebase Storage",
          details: fileUploadResult.error
        });
      }
      
      // Extract text from file buffer for AI processing
      let extractedText = '';
      try {
        extractedText = await extractTextFromBuffer(file);
        console.log(`📝 Extracted text length: ${extractedText.length} characters`);
      } catch (textError) {
        console.error('Text extraction error:', textError.message);
        extractedText = `[Document processing started but text extraction failed]`;
      }

      // Extract tables from PDF if it's a PDF file
      let extractedTables = [];
      if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
        // Table extraction via dedicated library is disabled due to compatibility issues
        // Tables will be captured through image analysis and text extraction instead
        extractedTables = [];
      }

      // Combine text and table data
      const tableText = formatTablesAsText(extractedTables);
      const combinedText = extractedText + tableText;
      console.log(`📝 Combined text length: ${combinedText.length} characters (including ${tableText.length} characters from tables)`);

    // Extract and analyze images from PDF if it's a PDF file
    let imageAnalysisResults = [];
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      console.log('🖼️ Extracting images from PDF...');
      try {
        // Save file temporarily to extract images
        const tempPath = path.join(process.cwd(), 'temp_' + fileId + '.pdf');
        fs.writeFileSync(tempPath, file.buffer);

        const images = await extractImagesFromPDF(tempPath);
        console.log(`📸 Found ${images.length} embedded images in PDF`);

        // Check if this might be a scanned document (few or no embedded images but has text)
        const isLikelyScanned = images.length === 0 && extractedText.length > 100;
        console.log(`📄 Document type: ${isLikelyScanned ? 'Likely scanned PDF' : 'Digital PDF with embedded images'}`);

        if (images.length > 0) {
          console.log('🤖 Analyzing embedded images with AI...');
          // Analyze first 30 images (increased limit for better coverage)
          const imagesToAnalyze = images.slice(0, 30);
          imageAnalysisResults = await Promise.all(
            imagesToAnalyze.map(async (imageData, index) => {
              try {
                console.log(`🖼️ Analyzing image ${index + 1}, size: ${imageData.buffer.length} bytes, type: ${imageData.type}`);
                const description = await describeImageWithAI(imageData.buffer);
                // Convert image buffer to base64 for frontend display
                const base64Image = imageData.buffer.toString('base64');
                const imageUrl = `data:image/png;base64,${base64Image}`;

                const result = {
                  imageIndex: index + 1,
                  type: imageData.type,
                  pageNumber: imageData.pageNumber,
                  description: description,
                  caption: `Image ${index + 1} - Page ${imageData.pageNumber}`,
                  size: imageData.buffer.length,
                  dimensions: `${imageData.width}x${imageData.height}`,
                  imageUrl: imageUrl,
                  imageData: imageUrl, // Add for frontend compatibility
                  canDelete: true
                };

                console.log(`✅ Image ${index + 1} analysis complete:`, {
                  hasDescription: !!description,
                  descriptionLength: description?.length || 0,
                  hasImageUrl: !!imageUrl,
                  imageUrlLength: imageUrl?.length || 0
                });

                return result;
              } catch (error) {
                console.error(`❌ Image ${index + 1} analysis failed:`, error.message);

                // Still try to create imageUrl for display even if AI analysis fails
                let imageUrl = null;
                try {
                  const base64Image = imageData.buffer.toString('base64');
                  imageUrl = `data:image/png;base64,${base64Image}`;
                } catch (convertError) {
                  console.error(`❌ Image conversion also failed:`, convertError.message);
                }

                return {
                  imageIndex: index + 1,
                  type: imageData.type,
                  pageNumber: imageData.pageNumber,
                  description: `Image analysis failed: ${error.message}`,
                  caption: `Image ${index + 1} - Page ${imageData.pageNumber}`,
                  size: imageData.buffer.length,
                  dimensions: `${imageData.width}x${imageData.height}`,
                  imageUrl: imageUrl,
                  imageData: imageUrl, // Add for frontend compatibility
                  error: error.message,
                  canDelete: true
                };
              }
            })
          );
        } else if (isLikelyScanned) {
          console.log('🤖 Rendering and analyzing scanned document pages...');
          // Render up to 30 pages as images for analysis (matching our image limit)
          const renderedPages = await renderPDFPagesAsImages(tempPath, 30);
          console.log(`📄 Rendered ${renderedPages.length} pages as images`);

          if (renderedPages.length > 0) {
            imageAnalysisResults = await Promise.all(
              renderedPages.map(async (pageData, index) => {
                try {
                  const description = await describeImageWithAI(pageData.buffer);
                  // Convert image buffer to base64 for frontend display
                  const base64Image = pageData.buffer.toString('base64');
                  const imageUrl = `data:image/png;base64,${base64Image}`;
                  return {
                    imageIndex: index + 1,
                    type: 'scanned_page',
                    pageNumber: pageData.pageNumber,
                    description: description,
                    caption: `Scanned Page ${pageData.pageNumber}`,
                    size: pageData.buffer.length,
                    dimensions: `${pageData.width}x${pageData.height}`,
                    imageUrl: imageUrl,
                    imageData: imageUrl,
                    note: 'Scanned document page rendered and analyzed'
                  };
                } catch (error) {
                  console.error(`❌ Page ${pageData.pageNumber} analysis failed:`, error.message);

                  // Still try to create imageUrl for display even if AI analysis fails
                  let imageUrl = null;
                  try {
                    const base64Image = pageData.buffer.toString('base64');
                    imageUrl = `data:image/png;base64,${base64Image}`;
                  } catch (convertError) {
                    console.error(`❌ Page image conversion also failed:`, convertError.message);
                  }

                  return {
                    imageIndex: index + 1,
                    type: 'scanned_page',
                    pageNumber: pageData.pageNumber,
                    description: `Page analysis failed: ${error.message}`,
                    caption: `Scanned Page ${pageData.pageNumber}`,
                    size: pageData.buffer.length,
                    dimensions: `${pageData.width}x${pageData.height}`,
                    imageUrl: imageUrl,
                    imageData: imageUrl,
                    error: error.message,
                    canDelete: true
                  };
                }
              })
            );
          } else {
            // Fallback if rendering fails
            imageAnalysisResults = [{
              imageIndex: 1,
              type: 'scanned_fallback',
              description: `This appears to be a scanned document with ${extractedText.length} characters of OCR text. The document contains readable text that has been processed through optical character recognition (OCR). Page rendering for visual analysis was attempted but no pages could be rendered.`,
              ocrTextLength: extractedText.length,
              note: 'Scanned document detected - text extraction successful, visual analysis rendering failed'
            }];
          }
        }

        console.log(`✅ Analyzed ${imageAnalysisResults.length} images/pages`);
        console.log('📊 Image analysis summary:', imageAnalysisResults.map(r => ({
          index: r.imageIndex,
          type: r.type,
          hasDescription: !!r.description && r.description !== 'Image analysis failed',
          hasImageUrl: !!r.imageUrl,
          size: r.size
        })));

        // Clean up temp file
        fs.unlinkSync(tempPath);
      } catch (error) {
        console.error('Image extraction error:', error.message);
        imageAnalysisResults = [{ error: 'Failed to extract images from PDF' }];
      }
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
               file.originalname.endsWith('.docx')) {
      console.log('🖼️ Processing Word document for images...');
      try {
        const wordImages = await extractImagesFromWord(file.buffer);
        console.log(`📸 Found ${wordImages.length} images in Word document`);

        if (wordImages.length > 0) {
          console.log('🤖 Analyzing Word document images with AI...');
          // Analyze first 30 images (increased limit for better coverage)
          const imagesToAnalyze = wordImages.slice(0, 30);
          imageAnalysisResults = await Promise.all(
            imagesToAnalyze.map(async (imageData, index) => {
              try {
                console.log(`🖼️ Analyzing Word image ${index + 1}, size: ${imageData.buffer.length} bytes`);
                const description = await describeImageWithAI(imageData.buffer);
                const base64Image = imageData.buffer.toString('base64');
                const imageUrl = `data:image/png;base64,${base64Image}`;

                return {
                  imageIndex: index + 1,
                  type: 'word_embedded',
                  description: description,
                  caption: `Image ${index + 1} from Word document`,
                  size: imageData.buffer.length,
                  dimensions: `${imageData.width}x${imageData.height}`,
                  imageUrl: imageUrl,
                  imageData: imageUrl,
                  canDelete: true
                };
              } catch (error) {
                console.error(`❌ Word image ${index + 1} analysis failed:`, error.message);
                let imageUrl = null;
                try {
                  const base64Image = imageData.buffer.toString('base64');
                  imageUrl = `data:image/png;base64,${base64Image}`;
                } catch (convertError) {
                  console.error(`❌ Word image conversion also failed:`, convertError.message);
                }

                return {
                  imageIndex: index + 1,
                  type: 'word_embedded',
                  description: `Image analysis failed: ${error.message}`,
                  size: imageData.buffer.length,
                  dimensions: `${imageData.width}x${imageData.height}`,
                  imageUrl: imageUrl,
                  error: error.message,
                  canDelete: true
                };
              }
            })
          );
        } else {
          imageAnalysisResults = [];
        }
      } catch (error) {
        console.error('Word image extraction error:', error.message);
        imageAnalysisResults = [{ error: 'Failed to extract images from Word document' }];
      }
    }

    // Process with real AI
    let aiAnalysis = {};
    try {
      console.log('🤖 Starting AI analysis...');
      aiAnalysis = await processWithAI(combinedText, {
        summarize: true,
        extractTopics: true,
        findEntities: true,
        analyzeSentiment: true
      });
      console.log('✅ AI analysis completed:', {
        hasSummary: !!aiAnalysis.summary,
        topicsCount: (aiAnalysis.topics || []).length,
        topicsList: aiAnalysis.topics,
        entitiesCount: (aiAnalysis.entities || []).length,
        hasSentiment: !!aiAnalysis.sentiment,
        confidence: aiAnalysis.confidence
      });
    } catch (aiError) {
      console.error('❌ AI analysis error:', aiError.message);
      aiAnalysis = {
        summary: 'AI analysis failed - document uploaded but content analysis unavailable',
        topics: [],
        entities: [],
        sentiment: 'neutral',
        confidence: 0.5,
        processingTime: 0
      };
    }

    // Convert AI analysis to display format
    const formattedAnalysis = formatAIAnalysis(aiAnalysis, file);
    console.log('📊 Analysis formatted for display');

    const responseData = {
      success: true,
      status: formattedAnalysis.needsValidation ? 'pending_validation' : 'processed',
      document: {
        id: fileId,
        filename: file.originalname,
        size: file.size,
        uploadDate: new Date().toISOString(),
        firebaseUrl: fileUploadResult.downloadUrl,
        firebasePath: fileUploadResult.firebasePath,
        analysis: {
          summary: {
            text: formattedAnalysis.summary,
            confidence: formattedAnalysis.summaryConfidence,
            needsReview: formattedAnalysis.summaryConfidence < 0.8
          },
          topics: formattedAnalysis.topics,
          entities: formattedAnalysis.entities,
          topicsConfidence: formattedAnalysis.topicsConfidence,
          entitiesConfidence: formattedAnalysis.entitiesConfidence,
          sentiment: {
            value: formattedAnalysis.sentiment,
            confidence: formattedAnalysis.sentimentConfidence,
            needsReview: formattedAnalysis.sentimentConfidence < 0.6
          },
          insights: aiAnalysis.insights || [],
          sections: aiAnalysis.sections || [],
          validationPoints: aiAnalysis.validationPoints || [],
          documentWithHighlights: aiAnalysis.documentWithHighlights || { fullText: extractedText, highlights: [] },
          originalText: extractedText,
          combinedText: combinedText,
          tables: extractedTables,
          imageAnalysis: imageAnalysisResults
        },
        questions: formattedAnalysis.questions || [],
        processingTime: formattedAnalysis.processingTime,
        vectorized: !formattedAnalysis.needsValidation
      }
    };

    // Extract and add comprehensive metadata for chat and processing
    try {
      console.log('📚 Extracting document metadata...');
      const metadata = await extractDocumentMetadata(extractedText, aiAnalysis);
      responseData.document.metadata = metadata;
      console.log('✅ Metadata extracted:', {
        textLength: metadata.content.textLength,
        wordCount: metadata.content.wordCount,
        sentenceCount: metadata.content.sentences.length,
        sections: metadata.structure.sections.length,
        keyPhrases: metadata.structure.keyPhrases.length,
        tokens: metadata.tokens.content.totalTokens
      });
    } catch (metadataError) {
      console.error('⚠️ Metadata extraction error:', metadataError.message);
      // Continue without metadata - it's not critical
    }

    // Save to document history (persistent storage)
    try {
      console.log('💾 Saving document to database...');
      await saveDocument(responseData);
      console.log('✅ Document saved successfully');
    } catch (saveError) {
      console.error('Document save error:', saveError.message);
      // Still return success to user - document was processed
    }

    res.json(responseData);
    } catch (innerError) {
      console.error('❌ Upload processing error:', innerError.message);
      console.error('Error stack:', innerError.stack);
      res.status(500).json({ 
        error: "Upload processing failed", 
        details: innerError.message,
        stack: innerError.stack
      });
    }
  } catch (error) {
    console.error('❌ Upload error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: "Upload failed", 
      details: error.message,
      stack: error.stack
    });
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

// Format AI analysis results into the expected structure
const formatAIAnalysis = (aiAnalysis, file) => {
  // Base analysis with processing time
  let analysis = {
    processingTime: aiAnalysis.processingTime || 1000,
    needsValidation: false,
    questions: []
  };

  // Format summary
  analysis.summary = aiAnalysis.summary || 'Document analysis completed.';
  analysis.summaryConfidence = aiAnalysis.confidence || 0.8;

  // Format topics
  analysis.topics = Array.isArray(aiAnalysis.topics) ? aiAnalysis.topics : [];
  analysis.topicsConfidence = aiAnalysis.confidence || 0.75;

  // Format entities
  analysis.entities = Array.isArray(aiAnalysis.entities) ? aiAnalysis.entities : [];
  analysis.entitiesConfidence = aiAnalysis.confidence || 0.7;

  // Format sentiment
  if (aiAnalysis.sentiment && typeof aiAnalysis.sentiment === 'object') {
    analysis.sentiment = aiAnalysis.sentiment.value || 'neutral';
    analysis.sentimentConfidence = aiAnalysis.sentiment.confidence || aiAnalysis.confidence || 0.8;
  } else {
    analysis.sentiment = aiAnalysis.sentiment || 'neutral';
    analysis.sentimentConfidence = aiAnalysis.confidence || 0.8;
  }

  // Add validation requirement if confidence is low
  if (analysis.summaryConfidence < 0.8 || analysis.topicsConfidence < 0.7 ||
      analysis.entitiesConfidence < 0.75 || analysis.sentimentConfidence < 0.6) {
    analysis.needsValidation = true;
    analysis.questions = [
      'Please review the analysis for accuracy.',
      'Are there any important details that were missed?',
      'Does the summary accurately reflect the document content?'
    ];
  }

  return analysis;
};

// Extract text from file buffer
const extractTextFromBuffer = async (file) => {
  try {
    // For text files, convert buffer to string
    if (file.mimetype.includes('text') || file.originalname.endsWith('.txt')) {
      const text = file.buffer.toString('utf-8');
      console.log(`📄 Extracted ${text.length} characters from text file`);
      return text;
    }

    // For PDF files, extract real text using pdfjs-dist (more reliable than pdf-parse)
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      console.log(`📑 Extracting text from PDF: ${file.originalname}`);
      try {
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
        const pdf = pdfjsLib.default;
        
        // Disable worker for Node.js environment (no web workers available)
        pdf.GlobalWorkerOptions.workerSrc = null;
        
        // Convert Buffer to Uint8Array
        const uint8Array = new Uint8Array(file.buffer);
        const pdfData = await pdf.getDocument({ data: uint8Array }).promise;
        let fullText = '';
        
        // Extract text from each page
        for (let pageNum = 1; pageNum <= Math.min(pdfData.numPages, 100); pageNum++) {
          try {
            const page = await pdfData.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
          } catch (pageError) {
            console.warn(`Warning: Failed to extract text from page ${pageNum}:`, pageError.message);
            continue; // Continue with next page
          }
        }
        
        const text = fullText.replace(/\s+/g, ' ').trim();
        
        // Clean up extracted text by removing common PDF metadata patterns
        const cleanedText = cleanExtractedText(text);
        
        console.log(`📄 Extracted ${text.length} characters from PDF with ${pdfData.numPages} pages (cleaned to ${cleanedText.length} characters)`);
        return cleanedText;
      } catch (pdfError) {
        console.error('PDF text extraction failed with pdfjs-dist:', pdfError.message);
        // Fallback: return a placeholder indicating PDF extraction failed
        return `[PDF Document: ${file.originalname} - Text extraction failed but document was processed. Content analysis unavailable.]`;
      }
    }

    // For Word documents (.docx), extract text using textract
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.originalname.endsWith('.docx')) {
      console.log(`📝 Extracting text from Word document: ${file.originalname}`);
      try {
        const textract = (await import('textract')).default;
        const text = await new Promise((resolve, reject) => {
          textract.fromBufferWithMime(file.mimetype, file.buffer, (error, text) => {
            if (error) {
              reject(error);
            } else {
              resolve(text || '');
            }
          });
        });
        const cleanedText = text.replace(/\s+/g, ' ').trim();
        console.log(`📄 Extracted ${cleanedText.length} characters from Word document`);
        return cleanedText;
      } catch (wordError) {
        console.error('Word document text extraction failed:', wordError.message);
        return `[Word Document: ${file.originalname} - Text extraction failed but document was processed.]`;
      }
    }

    // For other file types, return empty string for now
    console.log(`📄 Unsupported file type: ${file.mimetype}, returning empty text`);
    return '';
  } catch (error) {
    console.error('Text extraction error:', error.message);
    return `[Document: ${file.originalname} - Text extraction failed]`;
  }
};

// Clean extracted text by removing PDF metadata and headers
const cleanExtractedText = (text) => {
  if (!text) return text;
  
  // Remove common PDF metadata patterns
  let cleaned = text
    // Remove file path metadata
    .replace(/\[PDF Document:.*?(?=\.)/g, '')
    // Remove page references and headers
    .replace(/page\s+\d+/gi, '')
    .replace(/^Page\s+\d+/gm, '')
    // Remove DOI, ISSN, ISBN patterns at start of lines
    .replace(/^(doi|issn|isbn|url):\s*.+$/gmi, '')
    // Remove header/footer patterns
    .replace(/^(abstract|introduction|conclusion|references|acknowledgment)s?$/gmi, '')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
  
  return cleaned;
};