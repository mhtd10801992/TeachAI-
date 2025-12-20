import React from 'react';

export default function DocumentSummaryCard({ document }) {
  if (!document || !document.analysis) return null;

  const { analysis } = document;

  return (
    <div className="glass-card" style={{
      padding: '25px',
      borderRadius: '16px',
      marginBottom: '20px',
      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          background: 'var(--primary-gradient)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px'
        }}>
          📄
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ 
            margin: '0 0 4px 0',
            fontSize: '18px',
            color: 'var(--text-primary)'
          }}>
            {document.filename}
          </h3>
          <p style={{ 
            margin: 0,
            fontSize: '13px',
            color: 'var(--text-secondary)'
          }}>
            Uploaded {new Date(document.uploadDate).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Summary Section */}
      {analysis.summary && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>📋</span>
            <h4 style={{ 
              margin: 0,
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}>
              Summary
            </h4>
            <ConfidenceBadge confidence={analysis.summary.confidence} />
          </div>
          <p style={{ 
            margin: 0,
            fontSize: '15px',
            lineHeight: '1.6',
            color: 'var(--text-primary)',
            padding: '12px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px'
          }}>
            {analysis.summary.text}
          </p>
        </div>
      )}

      {/* Key Topics */}
      {analysis.topics && analysis.topics.items && analysis.topics.items.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>🏷️</span>
            <h4 style={{ 
              margin: 0,
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}>
              Key Topics
            </h4>
            <ConfidenceBadge confidence={analysis.topics.confidence} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {analysis.topics.items.map((topic, index) => (
              <span key={index} style={{
                padding: '6px 14px',
                background: 'var(--primary-gradient)',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '500',
                color: 'white',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
              }}>
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Important Points / Entities */}
      {analysis.entities && analysis.entities.items && analysis.entities.items.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>⭐</span>
            <h4 style={{ 
              margin: 0,
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}>
              Important Points
            </h4>
            <ConfidenceBadge confidence={analysis.entities.confidence} />
          </div>
          <div style={{ display: 'grid', gap: '8px' }}>
            {analysis.entities.items.map((entity, index) => (
              <div key={index} style={{
                padding: '10px 14px',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <span style={{
                  padding: '4px 10px',
                  background: 'rgba(99, 102, 241, 0.3)',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--primary)',
                  textTransform: 'uppercase'
                }}>
                  {entity.type}
                </span>
                <span style={{ 
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  flex: 1
                }}>
                  {entity.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sentiment */}
      {analysis.sentiment && (
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>
              {analysis.sentiment.value === 'positive' ? '😊' : 
               analysis.sentiment.value === 'negative' ? '😟' : '😐'}
            </span>
            <h4 style={{ 
              margin: 0,
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}>
              Sentiment Analysis
            </h4>
            <ConfidenceBadge confidence={analysis.sentiment.confidence} />
          </div>
          <div style={{
            padding: '10px 14px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            display: 'inline-block'
          }}>
            <span style={{
              fontSize: '14px',
              fontWeight: '600',
              color: analysis.sentiment.value === 'positive' ? '#4ade80' :
                     analysis.sentiment.value === 'negative' ? '#f87171' : '#94a3b8',
              textTransform: 'capitalize'
            }}>
              {analysis.sentiment.value}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfidenceBadge({ confidence }) {
  const percentage = Math.round(confidence * 100);
  const color = confidence >= 0.8 ? '#4ade80' : 
                confidence >= 0.6 ? '#fbbf24' : '#f87171';
  
  return (
    <span style={{
      padding: '3px 8px',
      background: `${color}20`,
      border: `1px solid ${color}`,
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: '600',
      color: color
    }}>
      {percentage}% confident
    </span>
  );
}
