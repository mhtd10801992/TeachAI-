/**
 * Table Detection Service
 * Detects table-like structures in plain text
 */

/**
 * Detect tables in text by analyzing patterns
 * @param {string} text - The text to analyze
 * @returns {Array} Array of detected tables with their content
 */
export function detectTablesInText(text) {
  const tables = [];
  const lines = text.split('\n');
  
  let currentTable = null;
  let tableStartIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      if (currentTable && currentTable.rows.length > 2) {
        // End of table if we have enough rows
        currentTable.endIndex = i - 1;
        tables.push(currentTable);
      }
      currentTable = null;
      continue;
    }
    
    // Check for table indicators:
    // 1. Lines with multiple tab characters or consistent spacing
    // 2. Lines with pipe characters (|) indicating columns
    // 3. Lines with multiple consecutive spaces (2+) between words
    
    const hasPipes = (line.match(/\|/g) || []).length >= 2;
    const hasTabs = (line.match(/\t/g) || []).length >= 2;
    const hasMultipleSpaces = /\s{2,}/.test(line);
    const hasNumbers = /\d+/.test(line);
    
    const isTableRow = hasPipes || hasTabs || (hasMultipleSpaces && hasNumbers);
    
    if (isTableRow) {
      if (!currentTable) {
        // Start new table
        currentTable = {
          startIndex: i,
          endIndex: i,
          rows: [],
          hasHeaders: false,
          delimiter: hasPipes ? '|' : (hasTabs ? '\t' : '  '),
          lineNumbers: [i + 1]
        };
        tableStartIndex = i;
      }
      
      // Parse row
      let cells;
      if (hasPipes) {
        cells = line.split('|').map(c => c.trim()).filter(c => c);
      } else if (hasTabs) {
        cells = line.split('\t').map(c => c.trim()).filter(c => c);
      } else {
        // Split by multiple spaces
        cells = line.split(/\s{2,}/).map(c => c.trim()).filter(c => c);
      }
      
      currentTable.rows.push({
        lineNumber: i + 1,
        cells: cells,
        rawText: line
      });
      currentTable.lineNumbers.push(i + 1);
      currentTable.endIndex = i;
      
      // Check if first row looks like headers
      if (currentTable.rows.length === 1) {
        const firstRow = cells.join(' ').toLowerCase();
        const headerIndicators = ['name', 'id', 'date', 'type', 'value', 'description', 'cost', 'price', 'year', 'month', 'total', 'count', 'number'];
        currentTable.hasHeaders = headerIndicators.some(indicator => firstRow.includes(indicator));
      }
    } else if (currentTable) {
      // Check if this line is a separator (like -----------)
      const isSeparator = /^[-=_\s|]+$/.test(line);
      
      if (isSeparator) {
        // It's a separator, might be after headers
        if (currentTable.rows.length === 1) {
          currentTable.hasHeaders = true;
        }
        currentTable.rows.push({
          lineNumber: i + 1,
          cells: ['---'],
          rawText: line,
          isSeparator: true
        });
        currentTable.lineNumbers.push(i + 1);
      } else if (currentTable.rows.length >= 2) {
        // End current table
        tables.push(currentTable);
        currentTable = null;
      } else {
        // Not enough rows, discard
        currentTable = null;
      }
    }
  }
  
  // Add last table if exists
  if (currentTable && currentTable.rows.length >= 2) {
    tables.push(currentTable);
  }
  
  // Format tables for output
  return tables.map((table, index) => ({
    tableIndex: index + 1,
    startLine: table.startIndex + 1,
    endLine: table.endIndex + 1,
    lineNumbers: table.lineNumbers,
    rowCount: table.rows.filter(r => !r.isSeparator).length,
    columnCount: Math.max(...table.rows.filter(r => !r.isSeparator).map(r => r.cells.length)),
    hasHeaders: table.hasHeaders,
    headers: table.hasHeaders ? table.rows[0].cells : null,
    rows: table.rows.filter(r => !r.isSeparator).map(r => r.cells),
    rawText: table.rows.map(r => r.rawText).join('\n'),
    delimiter: table.delimiter
  }));
}

/**
 * Format tables as markdown for better readability
 * @param {Array} tables - Array of detected tables
 * @returns {string} Markdown formatted tables
 */
export function formatTablesAsMarkdown(tables) {
  if (!tables || tables.length === 0) {
    return '';
  }
  
  return tables.map(table => {
    let markdown = `\n### Table ${table.tableIndex} (Lines ${table.startLine}-${table.endLine})\n\n`;
    
    if (table.hasHeaders && table.headers) {
      // Add header row
      markdown += '| ' + table.headers.join(' | ') + ' |\n';
      markdown += '| ' + table.headers.map(() => '---').join(' | ') + ' |\n';
      
      // Add data rows (skip first row as it's the header)
      const dataRows = table.rows.slice(1);
      dataRows.forEach(row => {
        markdown += '| ' + row.join(' | ') + ' |\n';
      });
    } else {
      // No headers, just data rows
      if (table.rows.length > 0) {
        // Use first row to determine column count
        const colCount = table.columnCount;
        markdown += '| ' + Array(colCount).fill('Column').map((c, i) => `${c} ${i + 1}`).join(' | ') + ' |\n';
        markdown += '| ' + Array(colCount).fill('---').join(' | ') + ' |\n';
        
        table.rows.forEach(row => {
          // Pad row if needed
          const paddedRow = [...row];
          while (paddedRow.length < colCount) {
            paddedRow.push('');
          }
          markdown += '| ' + paddedRow.join(' | ') + ' |\n';
        });
      }
    }
    
    markdown += '\n';
    return markdown;
  }).join('\n');
}

/**
 * Extract table summary for AI analysis
 * @param {Array} tables - Array of detected tables
 * @returns {Array} Array of table summaries
 */
export function getTableSummaries(tables) {
  return tables.map(table => ({
    tableNumber: table.tableIndex,
    location: `Lines ${table.startLine}-${table.endLine}`,
    dimensions: `${table.rowCount} rows × ${table.columnCount} columns`,
    hasHeaders: table.hasHeaders,
    headers: table.headers,
    sampleData: table.rows.slice(table.hasHeaders ? 1 : 0, 3), // First 2-3 data rows
    totalRows: table.rowCount
  }));
}
