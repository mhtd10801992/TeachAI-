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
  const [processing, setProcessing] = useState(false);
  const [hasRawData, setHasRawData] = useState(false);

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
      const eqs = equationsResponse.data.equations || [];
      setEquations(eqs);
      
      // Load numeric data
      const numbersResponse = await API.get(`/metadata/documents/${documentId}/numbers`);
      const nums = numbersResponse.data.numericData || [];
      setNumericData(nums);
      
      // Check if data needs processing (raw data without composed equations)
      const needsProcessing = eqs.some(eq => !eq.composedEquation) || nums.some(num => !num.explanation);
      setHasRawData(needsProcessing);
      
      console.log('✅ Loaded equations and numeric data:', {
        equations: eqs.length,
        numbers: nums.length,
        needsProcessing
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

  const processAnalysis = async () => {
    setProcessing(true);
    setError('');
    
    try {
      const response = await API.post(`/metadata/documents/${documentId}/process-analysis`, {
        processEquations: activeTab === 'equations',
        processNumeric: activeTab === 'numbers'
      });
      
      console.log('✅ Analysis processed:', response.data);
      
      // Reload data to show processed results
      await loadData();
      
    } catch (err) {
      console.error('Error processing analysis:', err);
      setError(`Failed to process analysis: ${err.response?.data?.message || err.message}`);
    } finally {
      setProcessing(false);
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
      {/* Simple Info Bar - No Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        marginBottom: '24px',
        padding: '16px 20px',
        background: 'rgba(99, 102, 241, 0.1)',
        borderRadius: '12px',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#e0e7ff' }}>
              {equations.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Equations
            </div>
          </div>
          <div style={{ 
            width: '1px', 
            height: '40px', 
            background: 'rgba(255,255,255,0.1)' 
          }}></div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#a7f3d0' }}>
              {numericData.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Data Points
            </div>
          </div>
        </div>
        
        <div style={{ 
          fontSize: '13px', 
          color: 'var(--text-secondary)',
          fontStyle: 'italic'
        }}>
          Showing contextual understanding of mathematical relationships
        </div>
      </div>

      {/* Single Unified Canvas - Combined Mathematical Context */}
      <div style={{
        padding: '32px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)',
        borderRadius: '20px',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}>
        <h3 style={{ 
          fontSize: '20px', 
          fontWeight: '700',
          marginBottom: '24px',
          color: '#e0e7ff',
          textAlign: 'center'
        }}>
          📐 Mathematical Content Analysis
        </h3>
        
        <div style={{ 
          fontSize: '14px', 
          color: 'var(--text-secondary)',
          marginBottom: '32px',
          textAlign: 'center',
          lineHeight: '1.6'
        }}>
          This canvas combines all equations, formulas, and numeric data extracted from the document,
          showing how they relate to each other in context.
        </div>

        {/* Combined Content Blocks - Scrollable */}
        <div style={{ 
          maxHeight: '600px',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          padding: '8px'
        }}>
          {equations.length > 0 && equations.map((eq, idx) => {
            // Find related numeric data from same paragraph/sentence
            const relatedNumbers = numericData.filter(num => 
              num.paragraphIndex === eq.paragraphIndex ||
              (num.sentence && eq.sentence && num.sentence.includes(eq.sentence.substring(0, 50)))
            );

            return (
              <div
                key={`context-${idx}`}
                style={{
                  padding: '16px',
                  background: 'rgba(30, 30, 50, 0.6)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(30, 30, 50, 0.6)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                }}
              >
                {/* Context Header */}
                <div style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: 'var(--primary-color)',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Equation #{idx + 1}
                </div>
                {/* Equation Display */}
                <div style={{
                  fontSize: '18px',
                  marginBottom: '12px',
                  padding: '12px',
                  background: 'rgba(0,0,0,0.4)',
                  borderRadius: '8px',
                  textAlign: 'center',
                  color: '#e0e7ff',
                  minHeight: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(99, 102, 241, 0.3)'
                }}>
                  <div dangerouslySetInnerHTML={{ __html: renderEquation(eq, true) }} />
                </div>

                {/* Explanation */}
                {eq.explanation && (
                  <div style={{
                    padding: '10px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '8px',
                    marginBottom: '10px'
                  }}>
                    <div style={{ 
                      fontSize: '10px', 
                      color: '#a7f3d0',
                      marginBottom: '6px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px'
                    }}>
                      💡 Explanation
                    </div>
                    <div style={{ 
                      fontSize: '13px', 
                      color: '#d1fae5',
                      lineHeight: '1.5'
                    }}>
                      {typeof eq.explanation === 'string' ? eq.explanation : eq.explanation.short}
                    </div>
                  </div>
                )}

                {/* Related Numeric Data */}
                {relatedNumbers.length > 0 && (
                  <div style={{
                    padding: '10px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    marginBottom: '10px'
                  }}>
                    <div style={{ 
                      fontSize: '10px', 
                      color: '#a7f3d0',
                      marginBottom: '8px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px'
                    }}>
                      📊 Related Data ({relatedNumbers.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {relatedNumbers.map((num, nIdx) => (
                        <div
                          key={nIdx}
                          style={{
                            padding: '6px 10px',
                            background: 'rgba(16, 185, 129, 0.2)',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '700',
                            fontFamily: 'monospace',
                            color: '#10b981'
                          }}>
                            {num.value}{num.unit ? ` ${num.unit}` : ''}
                          </span>
                          <span style={{
                            fontSize: '9px',
                            color: '#a7f3d0',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {num.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Context Block */}
                <div style={{
                  padding: '10px',
                  background: 'rgba(0,0,0,0.25)',
                  borderRadius: '8px',
                  borderLeft: '3px solid rgba(99, 102, 241, 0.6)'
                }}>
                  <div style={{ 
                    fontSize: '10px', 
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                    fontWeight: '600'
                  }}>
                    📖 Context
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: 'rgba(226,232,240,0.95)',
                    lineHeight: '1.5',
                    fontStyle: 'italic'
                  }}>
                    "{eq.sentence || eq.context}"
                  </div>
                  
                  {/* Expandable full paragraph */}
                  {eq.paragraph && eq.paragraph !== eq.sentence && (
                    <details style={{ marginTop: '8px' }}>
                      <summary style={{
                        fontSize: '10px',
                        color: 'rgba(148, 163, 184, 0.9)',
                        cursor: 'pointer',
                        padding: '4px 0',
                        userSelect: 'none',
                        fontWeight: '500'
                      }}>
                        View full paragraph ▼
                      </summary>
                      <div style={{
                        marginTop: '6px',
                        padding: '8px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: 'rgba(203,213,225,0.9)',
                        lineHeight: '1.5'
                      }}>
                        {eq.paragraph}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            );
          })}

          {/* Show standalone numbers that aren't related to any equation */}
          {numericData.filter(num => {
            return !equations.some(eq => 
              num.paragraphIndex === eq.paragraphIndex ||
              (num.sentence && eq.sentence && num.sentence.includes(eq.sentence.substring(0, 50)))
            );
          }).length > 0 && (
            <div style={{
              padding: '16px',
              background: 'rgba(30, 50, 30, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <div style={{
                fontSize: '10px',
                fontWeight: '700',
                color: '#10b981',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                📊 Additional Numeric Data
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {numericData.filter(num => {
                return !equations.some(eq => 
                  num.paragraphIndex === eq.paragraphIndex ||
                  (num.sentence && eq.sentence && num.sentence.includes(eq.sentence.substring(0, 50)))
                );
              }).map((num, idx) => (
                <div
                  key={`standalone-${idx}`}
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    flexDirection: 'column',
                    gap: '4px',
                    minWidth: '120px'
                  }}
                >
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    fontFamily: 'monospace',
                    color: '#10b981'
                  }}>
                    {num.value}{num.unit ? ` ${num.unit}` : ''}
                  </div>
                  <div style={{
                    fontSize: '9px',
                    color: '#a7f3d0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {num.type.replace(/_/g, ' ')}
                  </div>
                  {num.explanation && (
                    <div style={{
                      fontSize: '10px',
                      color: 'rgba(226,232,240,0.8)',
                      lineHeight: '1.4',
                      marginTop: '4px'
                    }}>
                      {num.explanation}
                    </div>
                  )}
                </div>
              ))}
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {equations.length === 0 && numericData.length === 0 && (
          <div style={{
            padding: '60px 40px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '16px',
            border: '1px dashed rgba(255,255,255,0.1)'
          }}>
            <div style={{ fontSize: '56px', marginBottom: '20px' }}>🔬</div>
            <div style={{ fontSize: '18px', marginBottom: '10px', fontWeight: '600' }}>
              No Mathematical Content Found
            </div>
            <div style={{ fontSize: '14px', opacity: 0.7, lineHeight: '1.6' }}>
              This document doesn't contain extractable equations or numeric data.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
