# Excel File Processing Guide

## ✅ Supported Excel Formats

Your TeachAI system now supports the following Excel file formats:

- **`.xlsx`** - Excel 2007+ (Office Open XML)
- **`.xls`** - Excel 97-2003 (Binary Format)
- **`.csv`** - Comma-Separated Values

## 🚀 How Excel Files Are Processed

### 1. Upload & Detection
When you upload an Excel file:
- System automatically detects the file type by MIME type and extension
- Accepted MIME types:
  - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (.xlsx)
  - `application/vnd.ms-excel` (.xls)
  - `text/csv` (.csv)

### 2. Data Extraction
The system extracts:
- ✅ **All sheets** from the workbook
- ✅ **Cell values** (text, numbers, dates)
- ✅ **Table structure** (rows × columns)
- ✅ **Headers** (automatically detected)
- ✅ **Statistics** (row count, cell count, etc.)

### 3. Text Conversion
Excel data is converted to readable text format:
```
=== EXCEL FILE ANALYSIS ===
File: sales_data.xlsx
Total Sheets: 3
Total Rows: 245
Total Data Cells: 1,234

=== SHEET OVERVIEW ===
1. "Sales Q1": 82 rows × 8 columns (656 cells with data)
2. "Sales Q2": 81 rows × 8 columns (648 cells with data)
3. "Summary": 3 rows × 4 columns (12 cells with data)

=== Sheet: Sales Q1 ===
Date | Product | Quantity | Revenue | Region | ...
2024-01-01 | Widget A | 100 | 1250.50 | North | ...
...
```

### 4. AI Analysis
The extracted text is processed like any other document:
- ✅ **Summary** generation
- ✅ **Topic** extraction
- ✅ **Entity** recognition (product names, dates, numbers)
- ✅ **Sentiment** analysis
- ✅ **Abbreviation/terminology** detection
- ✅ **Metadata** extraction

### 5. Validation Dashboard
For Excel files with data anomalies or low confidence:
- Users can review extracted data
- Define abbreviations and terms
- Validate AI analysis
- Approve for vectorization

## 📊 What Gets Extracted

### Sheet-Level Information
- Sheet name
- Number of rows and columns
- Non-empty cell count
- Full data as arrays

### Cell-Level Data
- Text values
- Numeric values (preserved as numbers)
- Date values (converted to readable format)
- Formulas (results extracted)

### Table Structure
```javascript
{
  sheetName: "Sales Data",
  rowCount: 100,
  columnCount: 8,
  headers: ["Date", "Product", "Quantity", "Revenue", "Region", ...],
  data: [
    ["Date", "Product", "Quantity", "Revenue", ...],  // Headers
    ["2024-01-01", "Widget A", 100, 1250.50, ...],    // Row 1
    ["2024-01-02", "Widget B", 150, 2100.00, ...],    // Row 2
    ...
  ],
  hasHeaders: true
}
```

## 🎯 Use Cases

### 1. Sales Data Analysis
Upload sales spreadsheets to:
- Extract product names and trends
- Analyze revenue patterns
- Identify key metrics
- Generate summaries

### 2. Scientific Data
Upload experimental data to:
- Extract measurements and values
- Identify variables and parameters
- Generate DOE (Design of Experiments) factors
- Analyze results

### 3. Financial Reports
Upload financial spreadsheets to:
- Extract key figures
- Identify trends
- Summarize performance
- Find anomalies

### 4. Inventory & Logistics
Upload inventory sheets to:
- Track stock levels
- Identify products
- Analyze supply chain data
- Generate reports

## 🔧 Technical Details

### Backend Implementation

**Services:**
- [backend/services/excelExtractor.js](backend/services/excelExtractor.js) - Excel parsing using `xlsx` library
- [backend/services/textExtractor.js](backend/services/textExtractor.js) - Unified text extraction service

**Key Functions:**
```javascript
// Extract all data from Excel file
extractFromExcel(buffer, filename)

// Extract text only (no structure)
extractTextOnly(buffer)

// Format Excel data as Markdown table
formatExcelAsMarkdown(tableData)
```

**Controllers:**
- [backend/controllers/uploadController.js](backend/controllers/uploadController.js) - Main upload handler
- [backend/controllers/uploadController.validation.js](backend/controllers/uploadController.validation.js) - Validation workflow

### Excel Extraction Process

```javascript
// 1. Read workbook from buffer
const workbook = XLSX.read(buffer, { type: 'buffer' });

// 2. Iterate through all sheets
workbook.SheetNames.forEach(sheetName => {
  const worksheet = workbook.Sheets[sheetName];
  
  // 3. Convert to JSON (array of arrays)
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // 4. Convert to readable text
  const text = XLSX.utils.sheet_to_txt(worksheet);
  
  // 5. Detect headers
  const hasHeaders = detectHeaders(data);
  
  // 6. Extract statistics
  const stats = calculateStatistics(data);
});
```

### File Size Limits
- Maximum file size: **50MB**
- Maximum sheets: Unlimited
- Maximum rows per sheet: Unlimited
- Maximum cells: Limited by memory

## 📝 Example Usage

### Via API
```bash
# Upload Excel file
curl -X POST http://localhost:4000/api/upload \
  -F "file=@sales_data.xlsx" \
  -H "Content-Type: multipart/form-data"

# Response
{
  "success": true,
  "document": {
    "id": "doc_1234567890_abc123",
    "filename": "sales_data.xlsx",
    "analysis": {
      "summary": "Sales data for Q1-Q4 2024...",
      "topics": ["sales", "revenue", "quarterly results"],
      "entities": [
        { "name": "Widget A", "type": "product" },
        { "name": "2024-01-01", "type": "date" }
      ]
    },
    "statistics": {
      "sheets": 3,
      "totalRows": 245,
      "totalCells": 1234
    }
  }
}
```

### Via Frontend
1. Click "Upload Document"
2. Select Excel file (.xlsx, .xls, or .csv)
3. File is automatically processed
4. View analysis in dashboard

## 🎨 Frontend Display

Excel files are displayed with:
- Sheet count and names
- Row and column statistics
- Table preview (first 20 rows)
- AI-generated analysis
- Extracted terms and definitions

## 🔍 Data Quality & Validation

### Automatic Detection
- Empty sheets (skipped)
- Header rows (detected automatically)
- Data types (text, number, date)
- Missing values (handled gracefully)

### Validation Features
- Low confidence triggers human review
- Users can verify extracted data accuracy
- Define domain-specific terms
- Approve for final processing

## 💡 Best Practices

### 1. File Preparation
- Use clear, descriptive sheet names
- Include header rows in first row
- Avoid merged cells (can cause parsing issues)
- Keep file size under 50MB

### 2. Data Structure
- Use consistent data types in columns
- Avoid special formatting (colors, borders) - they won't be extracted
- Use standard date formats
- Keep formulas simple

### 3. Large Files
- For files > 10MB, extraction may take longer
- Consider splitting very large workbooks
- CSV format is faster than .xlsx for large datasets

### 4. Multiple Sheets
- Each sheet is processed independently
- All sheets are included in final analysis
- Sheet names should be meaningful
- Empty sheets are automatically skipped

## 🐛 Troubleshooting

### "File type not supported"
- Ensure file has .xlsx, .xls, or .csv extension
- Check file isn't corrupted
- Try re-saving from Excel

### "Data extraction failed"
- File may be password-protected
- File format may be corrupted
- Try converting to .csv and re-uploading

### "Empty extraction"
- File may contain only formatting, no data
- Ensure sheets have actual cell values
- Check if file is truly empty

### "Processing takes too long"
- Large files (> 20MB) take more time
- Many sheets increase processing time
- Consider using CSV format for speed

## 🔮 Future Enhancements

Potential improvements:
- Chart extraction from Excel files
- Formula preservation and analysis
- Custom table detection algorithms
- Excel-specific validation views
- Conditional formatting extraction
- Pivot table support
- Data validation rules extraction
