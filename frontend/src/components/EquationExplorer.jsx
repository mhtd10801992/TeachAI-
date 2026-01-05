import { useState, useEffect } from 'react';
import API from '../api/api';

export default function EquationExplorer({ documentId }) {
  const [equations, setEquations] = useState([]);
  const [numericData, setNumericData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('equations'); // 'equations' or 'numbers'
  const [filterType, setFilterType] = useState('all');
  const [expandedEquation, setExpandedEquation] = useState(null);
  const [showRawMetadata, setShowRawMetadata] = useState(false);
  const [loadingExplanation, setLoadingExplanation] = useState(null);

  // Load MathJax script
  useEffect(() => {
    // Only load if not already present
    if (!document.getElementById('mathjax-script')) {
      const script = document.createElement('script');
      script.id = 'mathjax-script';
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
      script.async = true;
      script.onload = () => {
        // Configure MathJax
        if (window.MathJax) {
          window.MathJax.typesetPromise && window.MathJax.typesetPromise();
        }
      };
      document.head.appendChild(script);
    }
  }, []);

  // Re-render MathJax when equations change
  useEffect(() => {
    if (window.MathJax && equations.length > 0) {
      setTimeout(() => {
        window.MathJax.typesetPromise && window.MathJax.typesetPromise();
      }, 100);
    }
  }, [equations, expandedEquation]);

  useEffect(() => {
    if (documentId) {
      loadData();
    }
  }, [documentId]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Load equations
      const equationsResponse = await API.get(`/metadata/documents/${documentId}/equations`);
      setEquations(equationsResponse.data.equations || []);
      
      // Load numeric data
      const numbersResponse = await API.get(`/metadata/documents/${documentId}/numbers`);
      setNumericData(numbersResponse.data.numericData || []);
      
      console.log('✅ Loaded equations and numeric data:', {
        equations: equationsResponse.data.equations?.length || 0,
        numbers: numbersResponse.data.numericData?.length || 0
      });
    } catch (err) {
      console.error('Error loading data:', err);
      
      // Check if it's a 404 error (old document without this data)
      if (err.response?.status === 404) {
        setError(err.response?.data?.message || 'This document was uploaded before equation/numeric extraction was available. Please re-upload the document to extract this data.');
      } else {
        setError(`Failed to load equations and numeric data: ${err.response?.data?.details || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const requestAIExplanation = async (equation, sentence) => {
    setLoadingExplanation(equation);
    
    try {
      const response = await API.post(`/metadata/documents/${documentId}/equations/explain`, {
        equation,
        sentence
      });
      
      return response.data.explanation;
    } catch (err) {
      console.error('Error requesting AI explanation:', err);
      return 'Failed to generate explanation';
    } finally {
      setLoadingExplanation(null);
    }
  };

  const handleExplainClick = async (eq, index) => {
    if (!eq.aiExplanation) {
      const explanation = await requestAIExplanation(eq.composedEquation || eq.equation, eq.sentence);
      
      // Update equation with AI explanation
      const updatedEquations = [...equations];
      updatedEquations[index] = { ...eq, aiExplanation: explanation };
      setEquations(updatedEquations);
    }
  };

  const renderEquation = (equation, isDisplay = false) => {
    // Use composed equation if available, otherwise use original
    const eqText = equation.displayEquation || equation.composedEquation || equation.equation;
    
    // Convert equation to MathJax-compatible format
    let formatted = eqText
      .replace(/\^(\d+)/g, '^{$1}')  // Superscripts
      .replace(/×/g, '\\times')        // Multiplication
      .replace(/÷/g, '\\div');         // Division
    
    return isDisplay ? `$$${formatted}$$` : `\\(${formatted}\\)`;
  };

  const filteredNumbers = filterType === 'all' 
    ? numericData 
    : numericData.filter(n => n.type === filterType);

  const numberTypes = [...new Set(numericData.map(n => n.type))];

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '60px',
        color: 'var(--text-secondary)' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ 
            margin: '0 auto 15px',
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255,255,255,0.1)',
            borderTop: '4px solid var(--primary-color)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <div>Loading data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '30px',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '12px',
        color: '#ef4444',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '15px' }}>⚠️</div>
        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>
          Data Not Available
        </div>
        <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'rgba(239, 68, 68, 0.9)' }}>
          {error}
        </div>
        <button
          onClick={loadData}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        borderBottom: '2px solid rgba(255,255,255,0.1)',
        paddingBottom: '10px'
      }}>
        <button
          onClick={() => setActiveTab('equations')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'equations' 
              ? 'var(--primary-gradient)' 
              : 'rgba(255,255,255,0.05)',
            color: activeTab === 'equations' ? '#fff' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: activeTab === 'equations' ? '600' : '400',
            transition: 'all 0.2s'
          }}
        >
          🧮 Equations ({equations.length})
        </button>
        <button
          onClick={() => setActiveTab('numbers')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'numbers' 
              ? 'var(--primary-gradient)' 
              : 'rgba(255,255,255,0.05)',
            color: activeTab === 'numbers' ? '#fff' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: activeTab === 'numbers' ? '600' : '400',
            transition: 'all 0.2s'
          }}
        >
          📊 Numeric Data ({numericData.length})
        </button>
      </div>

      {/* Equations Tab */}
      {activeTab === 'equations' && (
        <div>
          {equations.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              border: '1px dashed rgba(255,255,255,0.1)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔬</div>
              <div style={{ fontSize: '16px', marginBottom: '8px' }}>No equations found</div>
              <div style={{ fontSize: '13px', opacity: 0.7 }}>
                This document doesn't contain any scientific equations or formulas.
              </div>
            </div>
          ) : (
            <>
              {/* Toggle for raw metadata */}
              <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showRawMetadata}
                    onChange={(e) => setShowRawMetadata(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Show Raw Metadata
                  </span>
                </label>
              </div>

              <div style={{ display: 'grid', gap: '15px' }}>
                {equations.map((eq, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '20px',
                      background: 'rgba(99, 102, 241, 0.05)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      borderRadius: '12px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {/* Composed Equation (Main Display with MathJax) */}
                    <div style={{
                      fontSize: '20px',
                      marginBottom: '15px',
                      padding: '15px',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '8px',
                      textAlign: 'center',
                      color: '#e0e7ff',
                      minHeight: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div dangerouslySetInnerHTML={{ __html: renderEquation(eq, true) }} />
                    </div>

                    {/* Basic Explanation (from composer) */}
                    {eq.explanation && (
                      <div style={{
                        padding: '12px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: '8px',
                        marginBottom: '12px'
                      }}>
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#a7f3d0',
                          marginBottom: '6px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          💡 Explanation
                        </div>
                        <div style={{ 
                          fontSize: '14px', 
                          color: '#d1fae5',
                          lineHeight: '1.6'
                        }}>
                          {typeof eq.explanation === 'string' ? eq.explanation : eq.explanation.short}
                        </div>
                      </div>
                    )}

                    {/* AI Explanation (if available or can be requested) */}
                    {eq.aiExplanation ? (
                      <div style={{
                        padding: '12px',
                        background: 'rgba(147, 51, 234, 0.1)',
                        border: '1px solid rgba(147, 51, 234, 0.2)',
                        borderRadius: '8px',
                        marginBottom: '12px'
                      }}>
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#e9d5ff',
                          marginBottom: '6px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          🤖 AI Detailed Explanation
                        </div>
                        <div style={{ 
                          fontSize: '14px', 
                          color: '#f3e8ff',
                          lineHeight: '1.6'
                        }}>
                          {eq.aiExplanation}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleExplainClick(eq, idx)}
                        disabled={loadingExplanation === (eq.composedEquation || eq.equation)}
                        style={{
                          padding: '10px 15px',
                          background: 'rgba(147, 51, 234, 0.2)',
                          border: '1px solid rgba(147, 51, 234, 0.3)',
                          borderRadius: '8px',
                          color: '#e9d5ff',
                          cursor: loadingExplanation === (eq.composedEquation || eq.equation) ? 'wait' : 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          marginBottom: '12px',
                          width: '100%',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => !loadingExplanation && (e.currentTarget.style.background = 'rgba(147, 51, 234, 0.3)')}
                        onMouseLeave={(e) => !loadingExplanation && (e.currentTarget.style.background = 'rgba(147, 51, 234, 0.2)')}
                      >
                        {loadingExplanation === (eq.composedEquation || eq.equation) 
                          ? '🤖 Generating AI Explanation...' 
                          : '✨ Get AI Explanation'}
                      </button>
                    )}

                    {/* Variables */}
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '8px',
                      marginBottom: '12px'
                    }}>
                      <span style={{ 
                        fontSize: '12px', 
                        color: 'var(--text-secondary)',
                        marginRight: '8px'
                      }}>
                        Variables:
                      </span>
                      {eq.variables && eq.variables.map((v, vIdx) => (
                        <span
                          key={vIdx}
                          style={{
                            padding: '4px 10px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            color: '#a7f3d0'
                          }}
                        >
                          {v}
                        </span>
                      ))}
                    </div>

                    {/* Features */}
                    {eq.features && (
                      <div style={{ 
                        display: 'flex', 
                        gap: '8px',
                      marginBottom: '12px',
                      flexWrap: 'wrap'
                    }}>
                      {eq.features.hasGreekLetters && (
                        <span style={{
                          padding: '3px 8px',
                          background: 'rgba(139, 92, 246, 0.15)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          borderRadius: '4px',
                          fontSize: '10px',
                          color: '#c4b5fd'
                        }}>
                          Greek Letters
                        </span>
                      )}
                      {eq.features.hasSuperscripts && (
                        <span style={{
                          padding: '3px 8px',
                          background: 'rgba(236, 72, 153, 0.15)',
                          border: '1px solid rgba(236, 72, 153, 0.3)',
                          borderRadius: '4px',
                          fontSize: '10px',
                          color: '#f9a8d4'
                        }}>
                          Exponents
                        </span>
                      )}
                      <span style={{
                        padding: '3px 8px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '4px',
                        fontSize: '10px',
                        color: '#93c5fd'
                      }}>
                        {eq.features.variableCount} variables
                      </span>
                    </div>
                  )}

                  {/* Context - sentence with expand button */}
                  <div style={{
                    marginTop: '15px',
                    padding: '12px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '8px',
                    borderLeft: '3px solid rgba(99, 102, 241, 0.5)'
                  }}>
                    <div style={{ 
                      fontSize: '11px', 
                      color: 'var(--text-secondary)',
                      marginBottom: '6px',
                      fontWeight: '600',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>📝 Context (Sentence {eq.sentenceIndex !== undefined ? eq.sentenceIndex + 1 : ''})</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedEquation(expandedEquation === idx ? null : idx);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: '2px 6px'
                        }}
                      >
                        {expandedEquation === idx ? '▼' : '▶'}
                      </button>
                    </div>
                    <div style={{ 
                      fontSize: '13px', 
                      color: 'rgba(226,232,240,0.9)',
                      lineHeight: '1.6',
                      marginBottom: expandedEquation === idx && eq.paragraph ? '12px' : '0'
                    }}>
                      {eq.sentence || eq.context}
                    </div>
                    
                    {/* Paragraph context - only shown when expanded */}
                    {expandedEquation === idx && eq.paragraph && eq.paragraph !== eq.sentence && (
                      <>
                        <div style={{ 
                          fontSize: '11px', 
                          color: 'var(--text-secondary)',
                          marginBottom: '6px',
                          marginTop: '12px',
                          fontWeight: '600'
                        }}>
                          📄 Full Paragraph:
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: 'rgba(203,213,225,0.8)',
                          lineHeight: '1.6'
                        }}>
                          {eq.paragraph}
                        </div>
                      </>
                    )}

                    {/* Raw Metadata - only shown if toggle is on */}
                    {showRawMetadata && (
                      <>
                        <div style={{ 
                          fontSize: '11px', 
                          color: 'var(--text-secondary)',
                          marginBottom: '6px',
                          marginTop: '12px',
                          fontWeight: '600'
                        }}>
                          🔧 Raw Metadata:
                        </div>
                        <pre style={{ 
                          fontSize: '10px', 
                          color: 'rgba(148,163,184,0.7)',
                          lineHeight: '1.4',
                          background: 'rgba(0,0,0,0.3)',
                          padding: '8px',
                          borderRadius: '6px',
                          overflow: 'auto',
                          maxHeight: '200px'
                        }}>
                          {JSON.stringify(eq, null, 2)}
                        </pre>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      )}

      {/* Numeric Data Tab */}
      {activeTab === 'numbers' && (
        <div>
          {/* Filter */}
          {numberTypes.length > 0 && (
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              marginBottom: '20px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => setFilterType('all')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: filterType === 'all' 
                    ? 'rgba(16, 185, 129, 0.2)' 
                    : 'rgba(255,255,255,0.03)',
                  color: filterType === 'all' ? '#a7f3d0' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'all 0.2s'
                }}
              >
                All ({numericData.length})
              </button>
              {numberTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: filterType === type 
                      ? 'rgba(16, 185, 129, 0.2)' 
                      : 'rgba(255,255,255,0.03)',
                    color: filterType === type ? '#a7f3d0' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    textTransform: 'capitalize',
                    transition: 'all 0.2s'
                  }}
                >
                  {type.replace(/_/g, ' ')} ({numericData.filter(n => n.type === type).length})
                </button>
              ))}
            </div>
          )}

          {filteredNumbers.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              border: '1px dashed rgba(255,255,255,0.1)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>📊</div>
              <div style={{ fontSize: '16px', marginBottom: '8px' }}>No numeric data found</div>
              <div style={{ fontSize: '13px', opacity: 0.7 }}>
                This document doesn't contain any extractable numeric data.
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {filteredNumbers.map((num, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '15px',
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'}
                >
                  {/* Type Badge */}
                  <div style={{
                    padding: '8px 12px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#a7f3d0',
                    textTransform: 'capitalize',
                    whiteSpace: 'nowrap',
                    minWidth: '100px',
                    textAlign: 'center'
                  }}>
                    {num.type.replace(/_/g, ' ')}
                  </div>

                  {/* Value */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '20px',
                      fontFamily: 'monospace',
                      fontWeight: '600',
                      color: '#e0e7ff',
                      marginBottom: '6px'
                    }}>
                      {num.value}
                      {num.unit && <span style={{ fontSize: '14px', marginLeft: '4px', color: '#a7f3d0' }}> {num.unit}</span>}
                    </div>
                    
                    {/* AI Explanation */}
                    {num.explanation && (
                      <div style={{
                        padding: '8px 12px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        borderRadius: '6px',
                        marginBottom: '8px'
                      }}>
                        <div style={{ 
                          fontSize: '10px', 
                          color: '#c4b5fd',
                          marginBottom: '4px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          🤖 Meaning
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#e0e7ff',
                          lineHeight: '1.5'
                        }}>
                          {num.explanation}
                        </div>
                      </div>
                    )}
                    
                    {/* Context (Sentence) */}
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      fontStyle: 'italic',
                      lineHeight: '1.5',
                      marginBottom: '6px'
                    }}>
                      {num.sentence || num.context}
                    </div>
                    
                    {/* Paragraph Context (if different from sentence) */}
                    {num.paragraph && num.paragraph !== num.sentence && (
                      <details style={{ marginTop: '8px' }}>
                        <summary style={{
                          fontSize: '11px',
                          color: 'rgba(148, 163, 184, 0.8)',
                          cursor: 'pointer',
                          padding: '4px 0',
                          userSelect: 'none'
                        }}>
                          📄 Full Paragraph Context
                        </summary>
                        <div style={{
                          marginTop: '8px',
                          padding: '10px',
                          background: 'rgba(0,0,0,0.2)',
                          borderRadius: '6px',
                          fontSize: '11px',
                          color: 'rgba(226,232,240,0.8)',
                          lineHeight: '1.6',
                          borderLeft: '2px solid rgba(16, 185, 129, 0.3)'
                        }}>
                          {num.paragraph}
                        </div>
                      </details>
                    )}
                  </div>

                  {/* Location */}
                  <div style={{
                    padding: '6px 10px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '6px',
                    fontSize: '10px',
                    color: '#93c5fd',
                    whiteSpace: 'nowrap'
                  }}>
                    ¶{num.paragraphIndex + 1} §{num.sentenceIndex + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
