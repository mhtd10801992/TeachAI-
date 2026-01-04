import React, { useState } from 'react';
import API from '../api/api';
import AnalysisEditor from './AnalysisEditor';

export default function AIAnalysisDisplay({ response, onUpdateAnalysis, onViewHistory }) {
  const [isEditing, setIsEditing] = useState(false);
  const [actionableSteps, setActionableSteps] = useState([]);
  const [loadingActions, setLoadingActions] = useState(false);
  const [errorActions, setErrorActions] = useState(null);

  console.log('AIAnalysisDisplay rendered with response:', {
    hasResponse: !!response,
    hasDocument: !!response?.document,
    hasAnalysis: !!response?.document?.analysis,
    documentId: response?.document?.id,
    fileName: response?.document?.filename
  });

  const handleFetchActionableSteps = async () => {
    setLoadingActions(true);
    setErrorActions(null);
    setActionableSteps([]);
    try {
      const text = response.document?.analysis?.originalText ||
                   response.document?.text ||
                   response.document?.rawText || '';
      if (!text) throw new Error('No document text available.');
      const res = await API.post('/ai/actionable-steps', { text });
      if (res.data && res.data.success) {
        setActionableSteps(res.data.steps);
      } else {
        setErrorActions('No process flows found in the document. Try uploading a document with case studies or experimental results.');
      }
    } catch (err) {
      setErrorActions('Failed to extract process flows. Please check your document contains case studies or experimental data.');
    } finally {
      setLoadingActions(false);
    }
  };

  if (!response) return null;

  const isValidated = response.status === 'pending_validation';
  const analysis = response.document?.analysis;

  const handleEditClick = () => {
    console.log('Edit button clicked');
    console.log('Current document:', response.document);
    setIsEditing(true);
  };

  const handleSaveEdit = (updatedDocument) => {
    // Call the parent component to update the analysis
    if (onUpdateAnalysis) {
      onUpdateAnalysis(updatedDocument);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // Show the editor if in editing mode
  if (isEditing) {
    return (
      <AnalysisEditor
        document={response.document}
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
      />
    );
  }

  return (
    <div className="glass-card animate-fadeInUp" style={{
      padding: '30px',
      borderRadius: '20px',
      marginTop: '25px'
    }}>
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          background: 'var(--primary-gradient)',
          borderRadius: '15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          margin: '0 auto 15px'
        }}>
          🧠
        </div>
        <h3 style={{ 
          marginBottom: '8px',
          background: 'var(--primary-gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          AI Analysis Results
        </h3>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Here's what our AI discovered about your document
        </p>
      </div>

      {/* PDF Image Analysis Results */}
      {analysis?.imageAnalysis && analysis.imageAnalysis.length > 0 && (
        <AnalysisCard
          icon="🖼️"
          title={`Visual Analysis (${analysis.imageAnalysis.length} image${analysis.imageAnalysis.length !== 1 ? 's' : ''})`}
          confidence={1}
          needsReview={false}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {(analysis.imageAnalysis || []).map((img, idx) => (
              <div key={idx} style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '12px',
                padding: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '18px'
              }}>
                {/* Show image preview for scanned pages */}
                {img.imageUrl && (
                  <div style={{ flexShrink: 0 }}>
                    <img
                      src={img.imageUrl}
                      alt={`Page ${img.pageNumber || img.imageIndex}`}
                      style={{
                        width: '120px',
                        height: 'auto',
                        maxHeight: '160px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        objectFit: 'contain',
                        cursor: 'pointer'
                      }}
                      onClick={() => window.open(img.imageUrl, '_blank')}
                      title="Click to view full size"
                    />
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 600,
                    marginBottom: 6,
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {img.type === 'scanned_page' ? `📄 Page ${img.pageNumber}` : `🖼️ Image ${img.imageIndex}`}
                    {img.type === 'scanned_page' && (
                      <span style={{
                        fontSize: '12px',
                        background: 'rgba(59, 130, 246, 0.2)',
                        color: '#3b82f6',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 500
                      }}>
                        Scanned
                      </span>
                    )}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 8 }}>
                    {img.description}
                  </div>
                  {img.dimensions && (
                    <div style={{
                      fontSize: '13px',
                      color: 'var(--text-tertiary)',
                      marginTop: 4
                    }}>
                      📐 {img.dimensions} • 📊 {Math.round(img.size / 1024)} KB
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Info box pointing to Images tab */}
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(99, 102, 241, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '16px' }}>💡</span>
            <span>
              <strong>Tip:</strong> Go to the <strong>"Images & Tables"</strong> tab in Comprehensive Review to view all images in a gallery, 
              select specific images for deeper AI analysis, and see how they relate to the document content.
            </span>
          </div>
        </AnalysisCard>
      )}

      {/* Analysis Cards */}
      <div style={{ display: 'grid', gap: '20px' }}>
        
        {/* Document Summary */}
        {analysis?.summary && (
          <AnalysisCard
            icon="📋"
            title="Document Summary"
            confidence={analysis.summary.confidence}
            needsReview={analysis.summary.needsReview}
          >
            <p style={{ 
              fontSize: '16px', 
              lineHeight: '1.6', 
              margin: 0,
              color: 'var(--text-primary)'
            }}>
              {analysis.summary.text}
            </p>
          </AnalysisCard>
        )}

        {/* Topics Discovered */}
        {analysis?.topics && analysis.topics.items && analysis.topics.items.length > 0 && (
          <AnalysisCard
            icon="🏷️"
            title="Topics Discovered"
            confidence={analysis.topics.confidence}
            needsReview={analysis.topics.needsReview}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {(analysis.topics.items || []).map((topic, index) => (
                <span key={index} style={{
                  background: 'var(--primary-gradient)',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {topic}
                </span>
              ))}
            </div>
          </AnalysisCard>
        )}

        {/* Entities Found */}
        {analysis?.entities && analysis.entities.items && analysis.entities.items.length > 0 && (
          <AnalysisCard
            icon="🎯"
            title="Key Entities Found"
            confidence={analysis.entities.confidence}
            needsReview={analysis.entities.needsReview}
          >
            <div style={{ display: 'grid', gap: '8px' }}>
              {(analysis.entities.items || []).map((entity, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <span style={{ fontWeight: '500' }}>{entity.name}</span>
                  <span style={{ 
                    color: 'var(--text-secondary)', 
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    fontWeight: '600'
                  }}>
                    {entity.type}
                  </span>
                </div>
              ))}
            </div>
          </AnalysisCard>
        )}

        {/* Sentiment Analysis */}
        {analysis?.sentiment && (
          <AnalysisCard
            icon="😊"
            title="Document Sentiment"
            confidence={analysis.sentiment.confidence}
            needsReview={analysis.sentiment.needsReview}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                background: getSentimentGradient(analysis.sentiment.value),
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                {getSentimentEmoji(analysis.sentiment.value)}
              </div>
              <div>
                <div style={{ 
                  fontWeight: '600', 
                  textTransform: 'capitalize',
                  marginBottom: '4px'
                }}>
                  {analysis.sentiment.value} Sentiment
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Overall emotional tone of the document
                </div>
              </div>
            </div>
          </AnalysisCard>
        )}

        {/* AI Questions (if any) */}
        {response.document?.questions && response.document.questions.length > 0 && (
          <AnalysisCard
            icon="❓"
            title="AI has questions"
            confidence={0.5}
            needsReview={true}
          >
            <div style={{ 
              background: 'rgba(245, 158, 11, 0.1)',
              padding: '15px',
              borderRadius: '12px',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              marginBottom: '15px'
            }}>
              <p style={{ 
                color: 'var(--warning)', 
                fontWeight: '600', 
                margin: '0 0 8px 0' 
              }}>
                🤔 The AI needs clarification on some parts of your document:
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {(response.document?.questions || []).map((question, index) => (
                  <li key={index} style={{ 
                    color: 'var(--text-secondary)', 
                    marginBottom: '4px' 
                  }}>
                    {question}
                  </li>
                ))}
              </ul>
            </div>
          </AnalysisCard>
        )}
      </div>

      {/* Action Buttons & Actionable Steps */}
      <div style={{ 
        marginTop: '30px', 
        paddingTop: '20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '15px' }}>
          <button onClick={handleEditClick} className="btn btn-warning">
            🔍 Review & Edit Analysis
          </button>
          <button className="btn btn-primary" onClick={handleFetchActionableSteps} disabled={loadingActions}>
            � Extract Process Flows from Case Studies
          </button>
        </div>
        {loadingActions && <div style={{ color: '#818cf8', marginBottom: '10px' }}>🔬 Analyzing case studies and experiments for process flows...</div>}
        {errorActions && <div style={{ color: '#ef4444', marginBottom: '10px' }}>{errorActions}</div>}
        {actionableSteps.length > 0 && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid #10b98133',
            borderRadius: '14px',
            padding: '18px 24px',
            margin: '0 auto 10px auto',
            maxWidth: 600,
            textAlign: 'left'
          }}>
            <h4 style={{ color: '#10b981', margin: '0 0 15px 0' }}>🚗 Actionable Process Flows from Case Studies & Experiments</h4>
            {(actionableSteps || []).map((process, idx) => (
              <div key={idx} style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #0ea5e9',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '15px'
              }}>
                <h5 style={{ color: '#0ea5e9', margin: '0 0 10px 0', fontSize: '16px' }}>
                  📋 {process.title}
                </h5>

                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ color: '#059669' }}>Implementation Steps:</strong>
                  <ol style={{ margin: '5px 0 0 20px', padding: 0 }}>
                    {process.steps?.map((step, stepIdx) => (
                      <li key={stepIdx} style={{ marginBottom: '3px', color: '#047857' }}>{step}</li>
                    ))}
                  </ol>
                </div>

                {process.outcomes && process.outcomes.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong style={{ color: '#059669' }}>Expected Outcomes:</strong>
                    <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
                      {process.outcomes.map((outcome, outcomeIdx) => (
                        <li key={outcomeIdx} style={{ marginBottom: '2px', color: '#047857' }}>✓ {outcome}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {process.resources && process.resources.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong style={{ color: '#059669' }}>Required Resources:</strong>
                    <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
                      {process.resources.map((resource, resourceIdx) => (
                        <li key={resourceIdx} style={{ marginBottom: '2px', color: '#047857' }}>🔧 {resource}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {process.risks && process.risks.length > 0 && (
                  <div>
                    <strong style={{ color: '#dc2626' }}>Risk Mitigation:</strong>
                    <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
                      {process.risks.map((risk, riskIdx) => (
                        <li key={riskIdx} style={{ marginBottom: '2px', color: '#dc2626' }}>⚠️ {risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '10px' }}>
          <button 
            className="btn btn-primary"
            onClick={() => {
              if (onViewHistory && response.document?.id) {
                onViewHistory(response.document.id);
              }
            }}
          >
            📚 View in Document History
          </button>
        </div>
        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: '14px', 
          marginTop: '10px' 
        }}>
          Your document is now searchable and ready for AI-powered queries
        </p>
      </div>
    </div>
  );
}

// Individual analysis card component
const AnalysisCard = ({ icon, title, confidence, needsReview, children }) => {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: `1px solid ${needsReview ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
      borderRadius: '16px',
      padding: '20px',
      transition: 'all 0.3s ease'
    }}>
      {/* Card Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'var(--primary-gradient)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            {icon}
          </div>
          <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>
            {title}
          </h4>
        </div>
        
        {/* Confidence Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {needsReview && (
            <span style={{
              background: 'var(--warning)',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: '600'
            }}>
              REVIEW
            </span>
          )}
          <div style={{
            background: getConfidenceColor(confidence),
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {Math.round(confidence * 100)}%
          </div>
        </div>
      </div>

      {/* Card Content */}
      {children}
    </div>
  );
};

// Helper functions
const getConfidenceColor = (confidence) => {
  if (confidence >= 0.8) return 'linear-gradient(135deg, #10b981, #059669)';
  if (confidence >= 0.6) return 'linear-gradient(135deg, #f59e0b, #d97706)';
  return 'linear-gradient(135deg, #ef4444, #dc2626)';
};

const getSentimentGradient = (sentiment) => {
  switch (sentiment?.toLowerCase()) {
    case 'positive': return 'linear-gradient(135deg, #10b981, #059669)';
    case 'negative': return 'linear-gradient(135deg, #ef4444, #dc2626)';
    default: return 'linear-gradient(135deg, #6b7280, #4b5563)';
  }
};

const getSentimentEmoji = (sentiment) => {
  switch (sentiment?.toLowerCase()) {
    case 'positive': return '😊';
    case 'negative': return '😞';
    default: return '😐';
  }
};
