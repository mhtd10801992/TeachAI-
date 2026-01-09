// Text Extractor Service - Unified text extraction for all file types
import { extractFromExcel } from './excelExtractor.js';

/**
 * Extract text from any supported file type
 * @param {Object} file - Multer file object with buffer, mimetype, originalname
 * @returns {Promise<string>} - Extracted text content
 */
export const extractTextFromFile = async (file) => {
  try {
    const mimeType = file.mimetype || '';
    const filename = file.originalname || '';
    
    // Text files
    if (mimeType.includes('text/plain') || filename.endsWith('.txt')) {
      const text = file.buffer.toString('utf-8');
      console.log(`📄 Extracted ${text.length} characters from text file`);
      return text;
    }
    
    // PDF files
    if (mimeType === 'application/pdf' || filename.endsWith('.pdf')) {
      return await extractTextFromPDF(file);
    }
    
    // Word documents
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        filename.endsWith('.docx')) {
      return await extractTextFromWord(file);
    }
    
    // Excel files (.xlsx, .xls, .csv)
    if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        mimeType === 'application/vnd.ms-excel' ||
        mimeType === 'text/csv' ||
        filename.endsWith('.xlsx') ||
        filename.endsWith('.xls') ||
        filename.endsWith('.csv')) {
      console.log(`📊 Extracting data from Excel file: ${filename}`);
      try {
        const excelData = extractFromExcel(file.buffer, filename);
        console.log(`📄 Extracted ${excelData.allText.length} characters from Excel (${excelData.sheetCount} sheets, ${excelData.statistics.totalRows} rows)`);
        return excelData.allText;
      } catch (excelError) {
        console.error('Excel extraction failed:', excelError.message);
        return `[Excel Document: ${filename} - Data extraction failed but document was processed.]`;
      }
    }
    
    // Unsupported file types
    console.log(`📄 Unsupported file type: ${mimeType}, returning empty text`);
    return `[Document: ${filename} - File type not supported for text extraction]`;
    
  } catch (error) {
    console.error('Text extraction error:', error.message);
    return `[Document: ${file.originalname} - Text extraction failed: ${error.message}]`;
  }
};

/**
 * Extract text from PDF files
 */
const extractTextFromPDF = async (file) => {
  console.log(`📑 Extracting text from PDF: ${file.originalname}`);
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
    const pdf = pdfjsLib.default;
    
    // Disable worker for Node.js environment
    pdf.GlobalWorkerOptions.workerSrc = null;
    
    // Convert Buffer to Uint8Array
    const uint8Array = new Uint8Array(file.buffer);
    const pdfData = await pdf.getDocument({ data: uint8Array }).promise;
    let fullText = '';
    
    // Extract text from each page (limit to 100 pages)
    for (let pageNum = 1; pageNum <= Math.min(pdfData.numPages, 100); pageNum++) {
      try {
        const page = await pdfData.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      } catch (pageError) {
        console.warn(`Warning: Failed to extract text from page ${pageNum}:`, pageError.message);
        continue;
      }
    }
    
    const text = fullText.replace(/\s+/g, ' ').trim();
    console.log(`📄 Extracted ${text.length} characters from PDF with ${pdfData.numPages} pages`);
    return text;
  } catch (pdfError) {
    console.error('PDF text extraction failed:', pdfError.message);
    return `[PDF Document: ${file.originalname} - Text extraction failed but document was processed.]`;
  }
};

/**
 * Extract text from Word documents
 */
const extractTextFromWord = async (file) => {
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
};
