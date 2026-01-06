// AI-Powered Chart Generation Service
// Analyzes document metadata and generates chart specifications for various relationships
import OpenAI from 'openai';

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Analyze document metadata and suggest appropriate charts/graphs
 * @param {Object} metadata - Document metadata with equations and numeric data
 * @returns {Array} Array of chart suggestions with configurations
 */
export const suggestChartsFromMetadata = async (metadata) => {
  const suggestions = [];
  
  try {
    // 1. Analyze Numeric Data Patterns
    if (metadata.numericData && metadata.numericData.length > 0) {
      const numericCharts = analyzeNumericDataForCharts(metadata.numericData);
      suggestions.push(...numericCharts);
    }
    
    // 2. Analyze Equations for Relationship Graphs
    if (metadata.equations && metadata.equations.length > 0) {
      const equationCharts = analyzeEquationsForCharts(metadata.equations);
      suggestions.push(...equationCharts);
    }
    
    // 3. Use AI to suggest additional insights
    if (openai && (metadata.numericData?.length > 0 || metadata.equations?.length > 0)) {
      const aiSuggestions = await generateAIChartSuggestions(metadata);
      suggestions.push(...aiSuggestions);
    }
    
    // 4. Analyze relationships between topics and entities
    if (metadata.analysis) {
      const relationshipCharts = analyzeRelationshipsForCharts(metadata.analysis);
      suggestions.push(...relationshipCharts);
    }
    
    return suggestions;
  } catch (error) {
    console.error('Error suggesting charts:', error);
    return [];
  }
};

/**
 * Analyze numeric data and suggest appropriate chart types
 */
const analyzeNumericDataForCharts = (numericData) => {
  const charts = [];
  
  // Group by type
  const byType = groupBy(numericData, 'type');
  
  // 1. Temperature trends
  if (byType.temperature && byType.temperature.length > 1) {
    charts.push({
      type: 'line',
      title: 'Temperature Trends',
      description: 'Temperature measurements across the document',
      data: {
        labels: byType.temperature.map((d, i) => `Point ${i + 1}`),
        datasets: [{
          label: 'Temperature',
          data: byType.temperature.map(d => d.numericValue),
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          unit: byType.temperature[0].unit
        }]
      },
      context: byType.temperature.map(d => d.sentence),
      confidence: 0.85
    });
  }
  
  // 2. Measurement comparisons
  if (byType.measurement && byType.measurement.length > 2) {
    const unitGroups = groupBy(byType.measurement, 'unit');
    
    Object.entries(unitGroups).forEach(([unit, measurements]) => {
      if (measurements.length > 1) {
        charts.push({
          type: 'bar',
          title: `${unit} Measurements Comparison`,
          description: `Comparison of all ${unit} measurements found`,
          data: {
            labels: measurements.map((m, i) => `Measurement ${i + 1}`),
            datasets: [{
              label: unit,
              data: measurements.map(m => m.numericValue),
              backgroundColor: 'rgba(59, 130, 246, 0.6)',
              borderColor: '#3B82F6',
              borderWidth: 1
            }]
          },
          context: measurements.map(m => m.sentence),
          confidence: 0.8
        });
      }
    });
  }
  
  // 3. Percentage distributions
  if (byType.percentage && byType.percentage.length > 1) {
    charts.push({
      type: 'pie',
      title: 'Percentage Distribution',
      description: 'Distribution of percentage values',
      data: {
        labels: byType.percentage.map((p, i) => `Category ${i + 1}`),
        datasets: [{
          data: byType.percentage.map(p => p.numericValue),
          backgroundColor: [
            '#6366F1', '#8B5CF6', '#EC4899', 
            '#F59E0B', '#10B981', '#3B82F6'
          ].slice(0, byType.percentage.length)
        }]
      },
      context: byType.percentage.map(p => p.sentence),
      confidence: 0.75
    });
  }
  
  // 4. Scientific notation values
  if (byType.scientific_notation && byType.scientific_notation.length > 1) {
    charts.push({
      type: 'scatter',
      title: 'Scientific Values',
      description: 'Scientific notation values plotted',
      data: {
        datasets: [{
          label: 'Scientific Values',
          data: byType.scientific_notation.map((s, i) => ({
            x: i,
            y: s.numericValue
          })),
          backgroundColor: '#8B5CF6',
          borderColor: '#8B5CF6'
        }]
      },
      context: byType.scientific_notation.map(s => s.sentence),
      confidence: 0.7
    });
  }
  
  // 5. Ranges visualization
  if (byType.range && byType.range.length > 1) {
    charts.push({
      type: 'rangeBar',
      title: 'Value Ranges',
      description: 'Minimum and maximum ranges',
      data: {
        labels: byType.range.map((r, i) => `Range ${i + 1}`),
        datasets: [{
          label: 'Min',
          data: byType.range.map(r => r.min),
          backgroundColor: 'rgba(34, 197, 94, 0.6)'
        }, {
          label: 'Max',
          data: byType.range.map(r => r.max),
          backgroundColor: 'rgba(239, 68, 68, 0.6)'
        }]
      },
      context: byType.range.map(r => r.sentence),
      confidence: 0.85
    });
  }
  
  return charts;
};

/**
 * Analyze equations and generate relationship visualizations
 */
const analyzeEquationsForCharts = (equations) => {
  const charts = [];
  
  // 1. Variable dependency graph
  const variables = new Set();
  const dependencies = [];
  
  equations.forEach(eq => {
    if (eq.variables && eq.variables.length >= 2) {
      const [dependent, ...independent] = eq.variables;
      variables.add(dependent);
      independent.forEach(v => {
        variables.add(v);
        dependencies.push({ from: v, to: dependent, equation: eq.equation });
      });
    }
  });
  
  if (dependencies.length > 0) {
    charts.push({
      type: 'network',
      title: 'Variable Dependency Network',
      description: 'How variables relate to each other in equations',
      data: {
        nodes: Array.from(variables).map(v => ({
          id: v,
          label: v,
          type: 'variable'
        })),
        edges: dependencies.map((d, i) => ({
          id: `edge-${i}`,
          source: d.from,
          target: d.to,
          label: d.equation
        }))
      },
      confidence: 0.9
    });
  }
  
  // 2. Equation complexity analysis
  if (equations.length > 2) {
    charts.push({
      type: 'bar',
      title: 'Equation Complexity',
      description: 'Number of variables in each equation',
      data: {
        labels: equations.map((eq, i) => `Eq ${i + 1}`),
        datasets: [{
          label: 'Variable Count',
          data: equations.map(eq => eq.variables?.length || 0),
          backgroundColor: 'rgba(99, 102, 241, 0.6)',
          borderColor: '#6366F1',
          borderWidth: 1
        }]
      },
      context: equations.map(eq => eq.equation),
      confidence: 0.75
    });
  }
  
  return charts;
};

/**
 * Use AI to generate intelligent chart suggestions
 */
const generateAIChartSuggestions = async (metadata) => {
  if (!openai) return [];
  
  try {
    const prompt = `Analyze this document data and suggest 2-3 insightful charts or graphs:

Numeric Data Summary:
${summarizeNumericData(metadata.numericData)}

Equations:
${metadata.equations?.map(eq => eq.equation).join(', ') || 'None'}

Topics: ${metadata.analysis?.topics?.join(', ') || 'None'}

For each chart suggestion, provide:
1. Chart type (line, bar, pie, scatter, network, heatmap)
2. Title
3. Description (what insight it reveals)
4. What data to plot

Format as JSON array:
[
  {
    "type": "line",
    "title": "...",
    "description": "...",
    "dataToPlot": "..."
  }
]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    });
    
    const content = response.choices[0].message.content.trim();
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      const suggestions = JSON.parse(jsonMatch[0]);
      return suggestions.map(s => ({
        ...s,
        confidence: 0.8,
        aiGenerated: true
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error generating AI chart suggestions:', error);
    return [];
  }
};

/**
 * Analyze topic and entity relationships for network graphs
 */
const analyzeRelationshipsForCharts = (analysis) => {
  const charts = [];
  
  if (!analysis.topics || !analysis.entities) return charts;
  
  // Topic-Entity relationship network
  if (analysis.topics.length > 1 && analysis.entities.length > 1) {
    charts.push({
      type: 'network',
      title: 'Topic-Entity Relationships',
      description: 'How topics and entities connect in the document',
      data: {
        nodes: [
          ...analysis.topics.map(t => ({ id: t, label: t, type: 'topic' })),
          ...analysis.entities.map(e => ({ 
            id: e.name || e, 
            label: e.name || e, 
            type: 'entity' 
          }))
        ],
        edges: [] // Would be populated by co-occurrence analysis
      },
      confidence: 0.7
    });
  }
  
  return charts;
};

/**
 * Generate actual chart from equation (e.g., plot F = ma for different values)
 */
export const generateEquationPlot = async (equation, variables, range = { min: 0, max: 10, steps: 20 }) => {
  try {
    // Parse equation and generate plot points
    // This is a simplified version - would need a proper math parser
    
    if (variables.length < 2) {
      throw new Error('Need at least 2 variables to plot');
    }
    
    const [dependent, ...independent] = variables;
    
    // For simple 2-variable equations, generate data points
    if (independent.length === 1) {
      const points = [];
      const step = (range.max - range.min) / range.steps;
      
      for (let i = 0; i <= range.steps; i++) {
        const x = range.min + (step * i);
        // This would need actual equation evaluation
        points.push({ x, y: x }); // Placeholder
      }
      
      return {
        type: 'line',
        title: `Plot of ${equation}`,
        description: `${dependent} vs ${independent[0]}`,
        data: {
          labels: points.map(p => p.x.toFixed(2)),
          datasets: [{
            label: dependent,
            data: points.map(p => p.y),
            borderColor: '#6366F1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true
          }]
        },
        xAxis: independent[0],
        yAxis: dependent
      };
    }
    
    // For 3+ variables, would need 3D plot or multi-line chart
    return null;
  } catch (error) {
    console.error('Error generating equation plot:', error);
    return null;
  }
};

/**
 * Generate comparison charts between multiple documents
 */
export const compareDocumentsMetadata = (documentsMetadata) => {
  const charts = [];
  
  // 1. Compare equation counts
  charts.push({
    type: 'bar',
    title: 'Equations per Document',
    description: 'Number of equations found in each document',
    data: {
      labels: documentsMetadata.map(d => d.filename || 'Doc ' + d.id),
      datasets: [{
        label: 'Equations',
        data: documentsMetadata.map(d => d.metadata?.equations?.length || 0),
        backgroundColor: 'rgba(99, 102, 241, 0.6)'
      }]
    },
    confidence: 0.9
  });
  
  // 2. Compare numeric data counts
  charts.push({
    type: 'bar',
    title: 'Numeric Data per Document',
    description: 'Number of numeric values extracted',
    data: {
      labels: documentsMetadata.map(d => d.filename || 'Doc ' + d.id),
      datasets: [{
        label: 'Numeric Values',
        data: documentsMetadata.map(d => d.metadata?.numericData?.length || 0),
        backgroundColor: 'rgba(34, 197, 94, 0.6)'
      }]
    },
    confidence: 0.9
  });
  
  // 3. Compare topics
  const allTopics = new Set();
  documentsMetadata.forEach(d => {
    d.metadata?.analysis?.topics?.forEach(t => allTopics.add(t));
  });
  
  if (allTopics.size > 0) {
    const topicCounts = {};
    allTopics.forEach(topic => {
      topicCounts[topic] = documentsMetadata.filter(d => 
        d.metadata?.analysis?.topics?.includes(topic)
      ).length;
    });
    
    charts.push({
      type: 'bar',
      title: 'Topic Distribution',
      description: 'Topics across all documents',
      data: {
        labels: Object.keys(topicCounts),
        datasets: [{
          label: 'Document Count',
          data: Object.values(topicCounts),
          backgroundColor: 'rgba(139, 92, 246, 0.6)'
        }]
      },
      confidence: 0.85
    });
  }
  
  return charts;
};

// Helper functions
const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) result[group] = [];
    result[group].push(item);
    return result;
  }, {});
};

const summarizeNumericData = (numericData) => {
  if (!numericData || numericData.length === 0) return 'None';
  
  const byType = groupBy(numericData, 'type');
  return Object.entries(byType)
    .map(([type, data]) => `${type}: ${data.length} values`)
    .join(', ');
};
