# 📊 AI-Powered Chart Generation System

## Overview

The AI-Powered Chart Generation system automatically analyzes document metadata (equations, numeric data, topics, relationships) and generates insightful visualizations to help understand patterns, trends, and relationships in your documents.

## Features

### ✨ Automatic Chart Suggestions
- **Smart Analysis**: AI analyzes equations, numeric data, and topics to suggest relevant visualizations
- **Multiple Chart Types**: Line, bar, pie, scatter, network graphs, range bars, and more
- **Confidence Scores**: Each suggestion includes a confidence score (0-100%)
- **Context-Aware**: Charts include references to source sentences and data points

### 📈 Supported Chart Types

1. **Line Charts**
   - Temperature trends over time
   - Continuous measurements
   - Time series data

2. **Bar Charts**
   - Measurement comparisons
   - Equation complexity analysis
   - Document comparisons

3. **Pie Charts**
   - Percentage distributions
   - Category breakdowns

4. **Scatter Plots**
   - Scientific notation values
   - Variable relationships

5. **Network Graphs**
   - Variable dependencies from equations
   - Topic-entity relationships
   - Concept connections

6. **Range Bars**
   - Min-max value ranges
   - Value distributions

### 🤖 AI-Enhanced Suggestions
- Uses OpenAI GPT to identify non-obvious insights
- Suggests custom visualizations based on document context
- Provides natural language explanations for each chart

## Usage

### From Document Review

1. Navigate to a document's comprehensive review
2. Go to the "Equations & Numbers" section
3. Scroll to "AI-Generated Charts & Visualizations"
4. Click **"✨ Generate Charts"**
5. Browse through suggested charts using navigation buttons

### API Endpoints

#### Generate Charts from Document
```javascript
POST /api/charts/suggest-from-document
Body: {
  documentId: "doc-123"
}
```

#### Generate Charts from Metadata
```javascript
POST /api/charts/suggest
Body: {
  metadata: { /* document metadata */ }
}
```

#### Plot Equation
```javascript
POST /api/charts/plot-equation
Body: {
  equation: "F = ma",
  variables: ["F", "m", "a"],
  range: { min: 0, max: 10, steps: 20 }
}
```

#### Compare Documents
```javascript
POST /api/charts/compare-documents
Body: {
  documentIds: ["doc-1", "doc-2", "doc-3"]
}
```

## Chart Data Structure

Each chart suggestion includes:

```javascript
{
  type: "line",              // Chart type
  title: "Temperature Trends",
  description: "Temperature measurements across the document",
  data: {
    labels: [...],           // X-axis labels
    datasets: [{
      label: "Temperature",
      data: [...],           // Y-axis data
      borderColor: "#EF4444",
      backgroundColor: "rgba(239, 68, 68, 0.1)"
    }]
  },
  context: [                 // Source sentences
    "The reaction occurs at 25°C",
    "Temperature was raised to 50°C"
  ],
  confidence: 0.85,          // 0-1 confidence score
  aiGenerated: false         // true if suggested by AI
}
```

## Architecture

### Backend Services

**chartGenerationService.js**
- `suggestChartsFromMetadata()` - Main analysis function
- `analyzeNumericDataForCharts()` - Numeric pattern detection
- `analyzeEquationsForCharts()` - Equation relationship analysis
- `generateAIChartSuggestions()` - OpenAI-powered suggestions
- `compareDocumentsMetadata()` - Multi-document comparison

### Frontend Components

**AIChartGenerator.jsx**
- React component with Chart.js integration
- Interactive chart selector
- Confidence indicators
- Context display

### Routes

**backend/routes/charts.js**
- `/api/charts/suggest` - Analyze metadata and suggest charts
- `/api/charts/suggest-from-document` - Get suggestions for a document
- `/api/charts/plot-equation` - Generate equation plot
- `/api/charts/compare-documents` - Compare multiple documents

## Examples

### Temperature Analysis
```
Input: Document with multiple temperature values (25°C, 50°C, 75°C, 100°C)
Output: Line chart showing temperature progression
Confidence: 85%
```

### Equation Dependencies
```
Input: Equations with variables (F = ma, E = mc², P = IV)
Output: Network graph showing variable relationships
Confidence: 90%
```

### Measurement Comparisons
```
Input: Various measurements in meters (1.5m, 2.3m, 3.7m, 4.2m)
Output: Bar chart comparing measurements
Confidence: 80%
```

### AI Suggestion Example
```
Input: Document about chemical reactions with pH values and temperatures
Output: Scatter plot correlating pH vs Temperature with regression line
Confidence: 75%
AI Generated: Yes
```

## Configuration

### Environment Variables

```bash
# Required for AI-powered suggestions
OPENAI_API_KEY=your_openai_key_here
```

### Chart.js Configuration

Installed packages:
- `chart.js` - ^4.4.1
- `react-chartjs-2` - ^5.2.0

## Benefits

### For Students & Researchers
- 📊 **Quick Visual Understanding**: See data patterns instantly
- 🔍 **Hidden Insights**: AI discovers relationships you might miss
- 📝 **Context Preservation**: Every chart links back to source data
- 🎯 **Focus**: Confidence scores help prioritize important visualizations

### For Data Analysis
- 📈 **Trend Detection**: Automatic identification of patterns
- 🔗 **Relationship Mapping**: Variable dependencies from equations
- 📊 **Comparison**: Multi-document analysis
- 🤖 **AI Assistance**: Intelligent suggestion beyond pattern matching

## Limitations

- Requires documents with numeric data or equations
- Equation plotting requires proper variable extraction
- AI suggestions need OpenAI API key
- Network graphs best for < 20 nodes
- Currently supports 2D charts (3D coming soon)

## Future Enhancements

- [ ] 3D visualizations for multi-variable equations
- [ ] Time series forecasting
- [ ] Statistical regression overlays
- [ ] Interactive equation parameter adjustment
- [ ] Chart export (PNG, SVG, PDF)
- [ ] Custom color themes
- [ ] Real-time chart updates
- [ ] Collaborative chart annotations

## Troubleshooting

### No Charts Generated

**Problem**: "No chart suggestions available"
**Solutions**:
1. Ensure document has numeric data or equations
2. Check if metadata extraction succeeded
3. Verify document was uploaded after metadata system was implemented

### Low Confidence Charts

**Problem**: All suggestions have < 60% confidence
**Solutions**:
1. Document may have insufficient data
2. Data patterns unclear - try uploading more detailed documents
3. AI suggestions disabled - set OPENAI_API_KEY

### Chart Display Issues

**Problem**: Chart not rendering
**Solutions**:
1. Check browser console for errors
2. Verify Chart.js installed: `npm list chart.js`
3. Clear browser cache and reload

## Technical Details

### Chart Type Selection Algorithm

1. **Data Pattern Recognition**
   - Group numeric data by type (temperature, percentage, etc.)
   - Count occurrences and distributions
   - Identify temporal patterns

2. **Equation Analysis**
   - Extract variable dependencies
   - Build dependency graph
   - Calculate complexity metrics

3. **AI Enhancement**
   - Feed patterns to OpenAI GPT
   - Request visualization suggestions
   - Parse and validate responses

4. **Confidence Scoring**
   ```
   Confidence = (Data Quality × Pattern Strength × Context Relevance) / 3
   ```

### Performance

- Analysis time: < 2 seconds for typical documents
- Chart rendering: < 100ms per chart
- AI suggestions: ~3-5 seconds (cached after first request)
- Memory usage: ~50MB for 20 charts

## Related Documentation

- [METADATA_IMPLEMENTATION.md](./METADATA_IMPLEMENTATION.md) - Metadata extraction system
- [COMPREHENSIVE_FEATURE_REPORT.md](./COMPREHENSIVE_FEATURE_REPORT.md) - All features overview
- [DATA_ARCHITECTURE_GUIDE.md](./DATA_ARCHITECTURE_GUIDE.md) - Data structure details

---

**Last Updated**: January 6, 2026
**Status**: ✅ Active
**Version**: 1.0.0
