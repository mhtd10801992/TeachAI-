import fs from 'fs';
import pdfTableExtractor from 'pdf-table-extractor';

// Extract tables from PDF using pdf-table-extractor
export async function extractTablesFromPDF(pdfPath) {
  return new Promise((resolve, reject) => {
    pdfTableExtractor(pdfPath, (result) => {
      if (result && result.pageTables) {
        // Process the extracted tables
        const tables = [];

        result.pageTables.forEach((pageTable, pageIndex) => {
          if (pageTable.tables && pageTable.tables.length > 0) {
            pageTable.tables.forEach((table, tableIndex) => {
              tables.push({
                pageNumber: pageIndex + 1,
                tableIndex: tableIndex + 1,
                data: table,
                rowCount: table.length,
                columnCount: table.length > 0 ? table[0].length : 0
              });
            });
          }
        });

        console.log(`📊 Extracted ${tables.length} tables from PDF`);
        resolve(tables);
      } else {
        console.log('⚠️ No tables found in PDF');
        resolve([]);
      }
    }, (error) => {
      console.error('Table extraction error:', error);
      reject(error);
    });
  });
}

// Convert table data to readable text format
export function formatTableAsText(table) {
  if (!table.data || table.data.length === 0) {
    return '';
  }

  let text = `\n--- Table ${table.tableIndex} (Page ${table.pageNumber}) ---\n`;

  // Add headers if they exist
  if (table.data.length > 0) {
    text += '| ' + table.data[0].join(' | ') + ' |\n';
    text += '| ' + table.data[0].map(() => '---').join(' | ') + ' |\n';

    // Add data rows
    for (let i = 1; i < table.data.length; i++) {
      text += '| ' + table.data[i].join(' | ') + ' |\n';
    }
  }

  text += '\n';
  return text;
}

// Convert all tables to formatted text
export function formatTablesAsText(tables) {
  if (!tables || tables.length === 0) {
    return '';
  }

  let fullText = '\n=== EXTRACTED TABLES ===\n';
  tables.forEach(table => {
    fullText += formatTableAsText(table);
  });

  return fullText;
}