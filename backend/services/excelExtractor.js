// Excel File Extractor Service - Extract text and data from Excel files (.xlsx, .xls, .csv)
import XLSX from 'xlsx';

/**
 * Extract text and structured data from Excel files
 * Supports .xlsx, .xls, and .csv formats
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Original filename
 * @returns {Object} - Extracted data with text, tables, and statistics
 */
export const extractFromExcel = (buffer, filename) => {
  try {
    console.log(`📊 Extracting data from Excel file: ${filename}`);
    
    // Read the workbook from buffer
    const workbook = XLSX.read(buffer, { type: 'buffer', cellText: false, cellDates: true });
    
    const result = {
      filename,
      sheetCount: workbook.SheetNames.length,
      sheets: [],
      allText: '',
      tables: [],
      statistics: {
        totalRows: 0,
        totalCells: 0,
        totalSheets: workbook.SheetNames.length,
        nonEmptyCells: 0
      }
    };
    
    // Process each sheet
    workbook.SheetNames.forEach((sheetName, sheetIndex) => {
      const worksheet = workbook.Sheets[sheetName];
      
      // Get sheet range
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const rowCount = range.e.r - range.s.r + 1;
      const colCount = range.e.c - range.s.c + 1;
      
      console.log(`  📄 Sheet "${sheetName}": ${rowCount} rows × ${colCount} columns`);
      
      // Convert sheet to JSON (array of arrays)
      const data = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        blankrows: false 
      });
      
      // Convert sheet to readable text
      const sheetText = XLSX.utils.sheet_to_txt(worksheet, { FS: ' | ', RS: '\n' });
      
      // Extract structured table data
      const tableData = {
        sheetName,
        sheetIndex,
        rowCount: data.length,
        columnCount: colCount,
        data: data,
        headers: data.length > 0 ? data[0] : [],
        hasHeaders: detectHeaders(data)
      };
      
      // Count non-empty cells
      let nonEmptyCells = 0;
      data.forEach(row => {
        if (Array.isArray(row)) {
          row.forEach(cell => {
            if (cell !== null && cell !== undefined && cell !== '') {
              nonEmptyCells++;
            }
          });
        }
      });
      
      // Store sheet information
      result.sheets.push({
        name: sheetName,
        index: sheetIndex,
        rowCount: data.length,
        columnCount: colCount,
        nonEmptyCells,
        text: sheetText,
        hasData: data.length > 0
      });
      
      result.tables.push(tableData);
      result.allText += `\n\n=== Sheet: ${sheetName} ===\n${sheetText}\n`;
      
      // Update statistics
      result.statistics.totalRows += data.length;
      result.statistics.totalCells += (data.length * colCount);
      result.statistics.nonEmptyCells += nonEmptyCells;
    });
    
    // Create a summary text for AI processing
    result.summary = generateExcelSummary(result);
    result.allText = result.summary + result.allText;
    
    console.log(`✅ Excel extraction complete:`);
    console.log(`   - ${result.sheetCount} sheets`);
    console.log(`   - ${result.statistics.totalRows} total rows`);
    console.log(`   - ${result.statistics.nonEmptyCells} non-empty cells`);
    console.log(`   - ${result.allText.length} characters of text`);
    
    return result;
    
  } catch (error) {
    console.error('Excel extraction error:', error.message);
    throw new Error(`Failed to extract Excel data: ${error.message}`);
  }
};

/**
 * Detect if first row contains headers (vs data)
 * Headers are typically text while data can be numbers
 */
const detectHeaders = (data) => {
  if (!data || data.length < 2) return false;
  
  const firstRow = data[0];
  const secondRow = data[1];
  
  if (!Array.isArray(firstRow) || !Array.isArray(secondRow)) return false;
  
  // Check if first row is mostly strings and second row has numbers
  let firstRowStrings = 0;
  let secondRowNumbers = 0;
  
  for (let i = 0; i < Math.min(firstRow.length, secondRow.length); i++) {
    if (typeof firstRow[i] === 'string') firstRowStrings++;
    if (typeof secondRow[i] === 'number') secondRowNumbers++;
  }
  
  // If first row is mostly strings and second row has numbers, likely has headers
  return firstRowStrings > firstRow.length / 2 && secondRowNumbers > 0;
};

/**
 * Generate a summary of Excel contents for AI processing
 */
const generateExcelSummary = (result) => {
  let summary = `\n=== EXCEL FILE ANALYSIS ===\n`;
  summary += `File: ${result.filename}\n`;
  summary += `Total Sheets: ${result.sheetCount}\n`;
  summary += `Total Rows: ${result.statistics.totalRows}\n`;
  summary += `Total Data Cells: ${result.statistics.nonEmptyCells}\n\n`;
  
  summary += `=== SHEET OVERVIEW ===\n`;
  result.sheets.forEach((sheet, idx) => {
    summary += `${idx + 1}. "${sheet.name}": ${sheet.rowCount} rows × ${sheet.columnCount} columns `;
    summary += `(${sheet.nonEmptyCells} cells with data)\n`;
  });
  summary += `\n`;
  
  return summary;
};

/**
 * Convert Excel data to formatted markdown table
 * Useful for better display in validation dashboard
 */
export const formatExcelAsMarkdown = (tableData) => {
  if (!tableData || !tableData.data || tableData.data.length === 0) {
    return '';
  }
  
  let markdown = `\n### ${tableData.sheetName}\n\n`;
  
  const data = tableData.data.slice(0, 20); // Limit to first 20 rows for display
  
  if (data.length > 0) {
    // Header row
    markdown += '| ' + data[0].map(cell => String(cell || '').trim()).join(' | ') + ' |\n';
    markdown += '| ' + data[0].map(() => '---').join(' | ') + ' |\n';
    
    // Data rows
    for (let i = 1; i < data.length; i++) {
      markdown += '| ' + data[i].map(cell => String(cell || '').trim()).join(' | ') + ' |\n';
    }
    
    if (tableData.rowCount > 20) {
      markdown += `\n*... and ${tableData.rowCount - 20} more rows*\n`;
    }
  }
  
  return markdown;
};

/**
 * Extract only text content from Excel (without structure)
 * Useful for simple text-based AI processing
 */
export const extractTextOnly = (buffer) => {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    let allText = '';
    
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const sheetText = XLSX.utils.sheet_to_txt(worksheet, { FS: ' | ', RS: '\n' });
      allText += `\n=== ${sheetName} ===\n${sheetText}\n`;
    });
    
    return allText;
  } catch (error) {
    throw new Error(`Failed to extract text from Excel: ${error.message}`);
  }
};
