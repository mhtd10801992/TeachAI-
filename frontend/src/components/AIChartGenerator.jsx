import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie, Scatter } from 'react-chartjs-2';
import API from '../api/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AIChartGenerator({ documentId, metadata }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);
  const [selectedChart, setSelectedChart] = useState(null);

  const generateCharts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (documentId) {
        // Generate from document ID
        response = await API.post('/charts/suggest-from-document', {
          documentId
        });
      } else if (metadata) {
        // Generate from metadata
        response = await API.post('/charts/suggest', {
          metadata
        });
      } else {
        throw new Error('Either documentId or metadata must be provided');
      }
      
      console.log('📊 Chart suggestions:', response.data);
      setSuggestions(response.data.suggestions || []);
      
      if (response.data.suggestions.length === 0) {
        setError('No chart suggestions available. Document may not have enough data.');
      }
    } catch (err) {
      console.error('❌ Error generating charts:', err);
      setError(err.response?.data?.message || err.message || 'Failed to generate charts');
    } finally {
      setLoading(false);
    }
  };

  const renderChart = (suggestion) => {
    // Validate and ensure proper chart data structure
    if (!suggestion || !suggestion.data) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          color: 'rgba(255,255,255,0.6)', 
          fontSize: '12px' 
        }}>
          No data available for this chart
        </div>
      );
    }

    // Ensure datasets array exists
    const chartData = {
      labels: suggestion.data.labels || [],
      datasets: Array.isArray(suggestion.data.datasets) 
        ? suggestion.data.datasets 
        : []
    };

    // If no valid datasets, show message
    if (chartData.datasets.length === 0) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          color: 'rgba(255,255,255,0.6)', 
          fontSize: '12px' 
        }}>
          No datasets available for visualization
        </div>
      );
    }

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: 'rgba(255,255,255,0.8)',
            font: {
              size: 11
            }
          }
        },
        title: {
          display: true,
          text: suggestion.title,
          color: 'rgba(255,255,255,0.9)',
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      },
      scales: suggestion.type !== 'pie' ? {
        x: {
          ticks: {
            color: 'rgba(255,255,255,0.7)',
            font: { size: 10 }
          },
          grid: {
            color: 'rgba(255,255,255,0.1)'
          }
        },
        y: {
          ticks: {
            color: 'rgba(255,255,255,0.7)',
            font: { size: 10 }
          },
          grid: {
            color: 'rgba(255,255,255,0.1)'
          }
        }
      } : undefined
    };

    switch (suggestion.type) {
      case 'line':
        return <Line data={chartData} options={chartOptions} />;
      case 'bar':
        return <Bar data={chartData} options={chartOptions} />;
      case 'pie':
        return <Pie data={chartData} options={chartOptions} />;
      case 'scatter':
        return <Scatter data={chartData} options={chartOptions} />;
      case 'network':
        // Render network as scatter plot with connections
        return <Scatter data={chartData} options={{
          ...chartOptions,
          plugins: {
            ...chartOptions.plugins,
            title: {
              ...chartOptions.plugins.title,
              text: suggestion.title + ' (Network View)'
            }
          }
        }} />;
      case 'rangeBar':
        return <Bar data={chartData} options={chartOptions} />;
      default:
        return <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
          Chart type "{suggestion.type}" not yet supported
        </div>;
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '16px', margin: 0, marginBottom: '4px', color: 'var(--primary-color)' }}>
            📊 AI Chart Generator
          </h3>
          <p style={{ fontSize: '12px', margin: 0, color: 'rgba(255,255,255,0.6)' }}>
            Automatically generate insightful charts from document data
          </p>
        </div>
        
        <button
          onClick={generateCharts}
          disabled={loading}
          className="btn btn-primary"
          style={{ fontSize: '13px', padding: '8px 16px' }}
        >
          {loading ? '🔄 Generating...' : '✨ Generate Charts'}
        </button>
      </div>

      {error && (
        <div className="glass-card" style={{ 
          padding: '12px', 
          marginBottom: '16px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        }}>
          <div style={{ fontSize: '12px', color: '#EF4444' }}>
            ❌ {error}
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginBottom: '8px' }}>
              💡 Found {suggestions.length} chart suggestion{suggestions.length !== 1 ? 's' : ''}
            </div>
            
            {/* Chart selector */}
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              flexWrap: 'wrap',
              marginBottom: '16px'
            }}>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedChart(index)}
                  className="btn"
                  style={{
                    fontSize: '11px',
                    padding: '6px 12px',
                    background: selectedChart === index 
                      ? 'var(--primary-color)' 
                      : 'rgba(255,255,255,0.1)',
                    border: selectedChart === index
                      ? '1px solid var(--primary-color)'
                      : '1px solid rgba(255,255,255,0.2)',
                    color: selectedChart === index
                      ? '#fff'
                      : 'rgba(255,255,255,0.7)'
                  }}
                >
                  {getChartIcon(suggestion.type)} {suggestion.title}
                  {suggestion.aiGenerated && ' 🤖'}
                </button>
              ))}
            </div>
          </div>

          {/* Display selected chart */}
          {selectedChart !== null && suggestions[selectedChart] && (
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <div>
                    <h4 style={{ 
                      fontSize: '14px', 
                      margin: 0,
                      marginBottom: '4px',
                      color: 'var(--primary-color)'
                    }}>
                      {suggestions[selectedChart].title}
                    </h4>
                    <p style={{ 
                      fontSize: '12px', 
                      margin: 0,
                      color: 'rgba(255,255,255,0.6)'
                    }}>
                      {suggestions[selectedChart].description}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {suggestions[selectedChart].confidence && (
                      <span style={{
                        fontSize: '10px',
                        padding: '3px 8px',
                        background: getConfidenceColor(suggestions[selectedChart].confidence),
                        borderRadius: '4px',
                        color: '#fff',
                        fontWeight: '600'
                      }}>
                        {Math.round(suggestions[selectedChart].confidence * 100)}% confidence
                      </span>
                    )}
                    
                    {suggestions[selectedChart].aiGenerated && (
                      <span style={{
                        fontSize: '10px',
                        padding: '3px 8px',
                        background: 'rgba(139, 92, 246, 0.3)',
                        borderRadius: '4px',
                        color: 'rgba(255,255,255,0.9)',
                        fontWeight: '600'
                      }}>
                        🤖 AI Suggested
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Chart container */}
              <div style={{ 
                height: '400px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                {(() => {
                  try {
                    return renderChart(suggestions[selectedChart]);
                  } catch (err) {
                    console.error('Error rendering chart:', err);
                    return (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: 'rgba(239, 68, 68, 0.8)',
                        fontSize: '12px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '32px', marginBottom: '10px' }}>⚠️</div>
                        <div>Failed to render chart</div>
                        <div style={{ fontSize: '10px', marginTop: '5px', opacity: 0.7 }}>
                          {err.message || 'Invalid chart data structure'}
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>

              {/* Context information */}
              {suggestions[selectedChart].context && suggestions[selectedChart].context.length > 0 && (
                <div style={{ 
                  marginTop: '16px',
                  padding: '12px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  borderRadius: '6px',
                  border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                  <div style={{ 
                    fontSize: '11px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: '#6366F1'
                  }}>
                    📝 Data Context
                  </div>
                  <div style={{ 
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.7)',
                    maxHeight: '120px',
                    overflowY: 'auto'
                  }}>
                    {suggestions[selectedChart].context.slice(0, 3).map((ctx, i) => (
                      <div key={i} style={{ 
                        marginBottom: '4px',
                        paddingLeft: '8px',
                        borderLeft: '2px solid rgba(99, 102, 241, 0.3)'
                      }}>
                        "{ctx}"
                      </div>
                    ))}
                    {suggestions[selectedChart].context.length > 3 && (
                      <div style={{ 
                        fontSize: '10px',
                        color: 'rgba(255,255,255,0.5)',
                        marginTop: '4px'
                      }}>
                        +{suggestions[selectedChart].context.length - 3} more data points
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div style={{ 
                marginTop: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                gap: '8px'
              }}>
                <button
                  onClick={() => setSelectedChart(Math.max(0, selectedChart - 1))}
                  disabled={selectedChart === 0}
                  className="btn btn-secondary"
                  style={{ fontSize: '11px', padding: '6px 12px' }}
                >
                  ← Previous
                </button>
                
                <span style={{ 
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.6)',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {selectedChart + 1} of {suggestions.length}
                </span>
                
                <button
                  onClick={() => setSelectedChart(Math.min(suggestions.length - 1, selectedChart + 1))}
                  disabled={selectedChart === suggestions.length - 1}
                  className="btn btn-secondary"
                  style={{ fontSize: '11px', padding: '6px 12px' }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && suggestions.length === 0 && !error && (
        <div className="glass-card" style={{ 
          padding: '40px',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.6)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>
            Ready to generate insightful charts
          </div>
          <div style={{ fontSize: '12px' }}>
            Click "Generate Charts" to analyze the document and create visualizations
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getChartIcon(type) {
  const icons = {
    line: '📈',
    bar: '📊',
    pie: '🥧',
    scatter: '🔵',
    network: '🕸️',
    rangeBar: '📊',
    heatmap: '🔥'
  };
  return icons[type] || '📊';
}

function getConfidenceColor(confidence) {
  if (confidence >= 0.8) return 'rgba(34, 197, 94, 0.6)'; // Green
  if (confidence >= 0.6) return 'rgba(251, 191, 36, 0.6)'; // Yellow
  return 'rgba(239, 68, 68, 0.6)'; // Red
}
