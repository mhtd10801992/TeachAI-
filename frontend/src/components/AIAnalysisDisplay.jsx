import React, { useState } from 'react';
import AnalysisEditor from './AnalysisEditor';

export default function AIAnalysisDisplay({ response, onUpdateAnalysis }) {
  const [isEditing, setIsEditing] = useState(false);

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
        {analysis?.topics && (
          <AnalysisCard
            icon="🏷️"
            title="Topics Discovered"
            confidence={analysis.topics.confidence}
            needsReview={analysis.topics.needsReview}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {analysis.topics.items.map((topic, index) => (
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
        {analysis?.entities && analysis.entities.items.length > 0 && (
          <AnalysisCard
            icon="🎯"
            title="Key Entities Found"
            confidence={analysis.entities.confidence}
            needsReview={analysis.entities.needsReview}
          >
            <div style={{ display: 'grid', gap: '8px' }}>
              {analysis.entities.items.map((entity, index) => (
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
                {response.document.questions.map((question, index) => (
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

      {/* Action Buttons */}
      <div style={{ 
        marginTop: '30px', 
        paddingTop: '20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center'
      }}>
        {isValidated ? (
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button 
              onClick={handleEditClick}
              className="btn btn-warning"
            >
              🔍 Review & Edit Analysis
            </button>
            <button className="btn btn-success">
              ✅ Approve & Vectorize
            </button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <button className="btn btn-success" style={{ marginBottom: '10px' }}>
                🎉 Document Successfully Processed!
              </button>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={handleEditClick}
                className="btn btn-warning"
              >
                🔍 Review & Edit Analysis
              </button>
              <button className="btn btn-primary">
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
        )}
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
