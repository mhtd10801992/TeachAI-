import { useState, useEffect } from 'react';
import API from '../api/api';

export default function ComprehensiveDocumentReview({ documentId, onClose }) {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [validationPoints, setValidationPoints] = useState([]);
  const [userNotes, setUserNotes] = useState({});
  const [highlightedText, setHighlightedText] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState({});

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    try {
      const response = await API.get(`/documents/${documentId}`);
      const doc = response.data.document;
      setDocument(doc);
      
      // Extract validation points from document
      if (doc.document?.analysis?.validationPoints) {
        setValidationPoints(doc.document.analysis.validationPoints);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading document:', error);
      setLoading(false);
    }
  };

  const handleValidationResolve = async (pointId, resolution) => {
    setValidationPoints(prev =>
      prev.map(vp =>
        vp.id === pointId ? { ...vp, resolved: true, userResolution: resolution } : vp
      )
    );
    
    // Save to backend
    try {
      await API.put(`/documents/${documentId}/validation`, {
        pointId,
        resolution
      });
    } catch (error) {
      console.error('Error saving validation:', error);
    }
  };

  const addUserNote = (section, note) => {
    setUserNotes(prev => ({
      ...prev,
      [section]: [...(prev[section] || []), { text: note, timestamp: new Date().toISOString() }]
    }));
  };

  const requestAiClarification = async (validationPoint) => {
    try {
      const response = await API.post('/ai/clarify', {
        documentId,
        text: validationPoint.text,
        context: validationPoint.reason
      });
      
      setAiSuggestions(prev => ({
        ...prev,
        [validationPoint.id]: response.data.clarification
      }));
    } catch (error) {
      console.error('Error getting AI clarification:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="loading-spinner">Loading comprehensive analysis...</div>
      </div>
    );
  }

  if (!document) {
    return <div>Document not found</div>;
  }

  const docData = document.document || document;
  const analysis = docData.analysis || {};

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)' }}>
      {/* Left Sidebar - Navigation */}
      <div className="glass-card" style={{
        width: '250px',
        padding: '20px',
        borderRadius: '0',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ width: '100%', marginBottom: '15px' }}
          >
            ← Back
          </button>
          <h3 style={{ fontSize: '16px', marginBottom: '5px' }}>Document Review</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
            {docData.filename}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { id: 'overview', icon: '📋', label: 'Overview' },
            { id: 'fulltext', icon: '📄', label: 'Full Document' },
            { id: 'summary', icon: '📝', label: 'Summary' },
            { id: 'insights', icon: '💡', label: 'Key Insights' },
            { id: 'sections', icon: '📑', label: 'Sections' },
            { id: 'topics', icon: '🏷️', label: 'Topics' },
            { id: 'entities', icon: '👥', label: 'Entities' },
            { id: 'validation', icon: '⚠️', label: `Validation (${validationPoints.filter(v => !v.resolved).length})` },
            { id: 'notes', icon: '📓', label: 'My Notes' }
          ].map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={activeSection === section.id ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                padding: '10px 15px',
                fontSize: '14px'
              }}
            >
              {section.icon} {section.label}
            </button>
          ))}
        </div>

        {/* Validation Stats */}
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px' }}>
            Validation Progress
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
            <span>Resolved:</span>
            <span>{validationPoints.filter(v => v.resolved).length}/{validationPoints.length}</span>
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${validationPoints.length ? (validationPoints.filter(v => v.resolved).length / validationPoints.length) * 100 : 0}%`,
              height: '100%',
              background: 'var(--primary-gradient)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
        {activeSection === 'overview' && (
          <OverviewSection document={docData} analysis={analysis} />
        )}

        {activeSection === 'fulltext' && (
          <FullTextSection 
            document={docData} 
            validationPoints={validationPoints}
            onHighlight={setHighlightedText}
          />
        )}

        {activeSection === 'summary' && (
          <SummarySection analysis={analysis} documentId={documentId} />
        )}

        {activeSection === 'insights' && (
          <InsightsSection insights={analysis.insights || []} />
        )}

        {activeSection === 'sections' && (
          <SectionsSection sections={analysis.sections || []} />
        )}

        {activeSection === 'topics' && (
          <TopicsSection topics={analysis.topics} />
        )}

        {activeSection === 'entities' && (
          <EntitiesSection entities={analysis.entities} />
        )}

        {activeSection === 'validation' && (
          <ValidationSection
            validationPoints={validationPoints}
            onResolve={handleValidationResolve}
            onRequestClarification={requestAiClarification}
            aiSuggestions={aiSuggestions}
          />
        )}

        {activeSection === 'notes' && (
          <NotesSection
            notes={userNotes}
            onAddNote={addUserNote}
          />
        )}
      </div>
    </div>
  );
}

// Section Components
function OverviewSection({ document, analysis }) {
  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Document Overview</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '5px' }}>File Size</div>
          <div style={{ fontSize: '24px', fontWeight: '600' }}>{(document.size / 1024).toFixed(2)} KB</div>
        </div>
        
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Processing Time</div>
          <div style={{ fontSize: '24px', fontWeight: '600' }}>{((document.processingTime || 0) / 1000).toFixed(1)}s</div>
        </div>
        
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Confidence</div>
          <div style={{ fontSize: '24px', fontWeight: '600' }}>{Math.round((analysis.summary?.confidence || 0) * 100)}%</div>
        </div>
        
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Sections</div>
          <div style={{ fontSize: '24px', fontWeight: '600' }}>{(analysis.sections || []).length}</div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '25px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>Quick Summary</h3>
        <p style={{ lineHeight: '1.8', color: 'var(--text-secondary)' }}>
          {analysis.summary?.text || 'No summary available'}
        </p>
      </div>

      <div className="glass-card" style={{ padding: '25px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>Analysis Status</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {['summary', 'topics', 'entities', 'sentiment'].map(type => {
            const item = analysis[type];
            const confidence = item?.confidence || 0;
            return (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '100px', fontSize: '14px', textTransform: 'capitalize' }}>{type}</div>
                <div style={{ flex: 1, height: '8px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${confidence * 100}%`,
                    height: '100%',
                    background: confidence > 0.8 ? '#10b981' : confidence > 0.6 ? '#fbbf24' : '#ef4444'
                  }} />
                </div>
                <div style={{ width: '60px', fontSize: '14px', textAlign: 'right' }}>
                  {Math.round(confidence * 100)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FullTextSection({ document, validationPoints, onHighlight }) {
  const fullText = document.analysis?.originalText || document.analysis?.documentWithHighlights?.fullText || 'Full document text not available';
  
  const renderTextWithHighlights = () => {
    if (!document.analysis?.documentWithHighlights?.highlights) {
      return fullText;
    }

    const highlights = document.analysis.documentWithHighlights.highlights;
    let lastIndex = 0;
    const parts = [];

    // Sort highlights by start position
    const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start);

    sortedHighlights.forEach((highlight, idx) => {
      // Add text before highlight
      if (highlight.start > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>{fullText.substring(lastIndex, highlight.start)}</span>
        );
      }

      // Add highlighted text
      const priorityColors = {
        high: 'rgba(239, 68, 68, 0.3)',
        medium: 'rgba(251, 191, 36, 0.3)',
        low: 'rgba(59, 130, 246, 0.3)'
      };

      parts.push(
        <mark
          key={`highlight-${idx}`}
          style={{
            background: priorityColors[highlight.priority] || 'rgba(99, 102, 241, 0.3)',
            padding: '2px 4px',
            borderRadius: '3px',
            cursor: 'pointer',
            position: 'relative'
          }}
          title={`${highlight.reason} (${highlight.priority} priority)`}
          onClick={() => onHighlight(highlight)}
        >
          {fullText.substring(highlight.start, highlight.end)}
        </mark>
      );

      lastIndex = highlight.end;
    });

    // Add remaining text
    if (lastIndex < fullText.length) {
      parts.push(
        <span key="text-end">{fullText.substring(lastIndex)}</span>
      );
    }

    return parts;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Full Document</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary">🔍 Search</button>
          <button className="btn btn-secondary">📋 Copy</button>
          <button className="btn btn-secondary">📥 Download</button>
        </div>
      </div>

      {/* Legend */}
      <div className="glass-card" style={{ padding: '15px', marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Highlights Legend:</div>
        <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
          <span><mark style={{ background: 'rgba(239, 68, 68, 0.3)', padding: '2px 6px', borderRadius: '3px' }}>High Priority</mark></span>
          <span><mark style={{ background: 'rgba(251, 191, 36, 0.3)', padding: '2px 6px', borderRadius: '3px' }}>Medium Priority</mark></span>
          <span><mark style={{ background: 'rgba(59, 130, 246, 0.3)', padding: '2px 6px', borderRadius: '3px' }}>Low Priority</mark></span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '10px', marginBottom: 0 }}>
          Click on any highlighted text to see AI's validation point and suggestions
        </p>
      </div>

      {/* Full Document Text */}
      <div className="glass-card" style={{
        padding: '30px',
        whiteSpace: 'pre-wrap',
        lineHeight: '1.8',
        fontSize: '15px',
        fontFamily: 'Georgia, serif',
        maxHeight: '800px',
        overflowY: 'auto'
      }}>
        {renderTextWithHighlights()}
      </div>

      <div style={{ marginTop: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
        Document length: {fullText.length.toLocaleString()} characters | 
        ~{Math.round(fullText.split(/\s+/).length).toLocaleString()} words |
        {validationPoints.length} validation points identified
      </div>
    </div>
  );
}

function SummarySection({ analysis, documentId }) {
  const [editMode, setEditMode] = useState(false);
  const [editedSummary, setEditedSummary] = useState(analysis.summary?.text || '');
  const [aiExplanation, setAiExplanation] = useState('');

  const requestExplanation = async () => {
    try {
      const response = await API.post('/ai/explain', {
        documentId,
        section: 'summary'
      });
      setAiExplanation(response.data.explanation);
    } catch (error) {
      console.error('Error getting explanation:', error);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Comprehensive Summary</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={requestExplanation}>💬 Ask AI to Explain</button>
          <button className="btn btn-secondary" onClick={() => setEditMode(!editMode)}>
            {editMode ? '💾 Save' : '✏️ Edit'}
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '25px', marginBottom: '20px' }}>
        {editMode ? (
          <textarea
            value={editedSummary}
            onChange={(e) => setEditedSummary(e.target.value)}
            style={{
              width: '100%',
              minHeight: '200px',
              padding: '15px',
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '15px',
              lineHeight: '1.8',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        ) : (
          <div style={{ lineHeight: '1.8', fontSize: '15px' }}>
            {analysis.summary?.text || 'No summary available'}
          </div>
        )}
        
        <div style={{ marginTop: '15px', display: 'flex', gap: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <span>Confidence: {Math.round((analysis.summary?.confidence || 0) * 100)}%</span>
          <span>Needs Review: {analysis.summary?.needsReview ? 'Yes' : 'No'}</span>
        </div>
      </div>

      {aiExplanation && (
        <div className="glass-card" style={{ padding: '25px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🤖</span> AI Explanation
          </div>
          <div style={{ lineHeight: '1.7', fontSize: '14px' }}>
            {aiExplanation}
          </div>
        </div>
      )}
    </div>
  );
}

function InsightsSection({ insights }) {
  const priorityColors = {
    high: '#ef4444',
    medium: '#fbbf24',
    low: '#3b82f6'
  };

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Key Insights & Findings</h2>
      
      {insights && insights.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {insights.map((insight, index) => (
            <div key={index} className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>
                  💡 Insight #{index + 1}
                </div>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: `${priorityColors[insight.importance]}20`,
                  color: priorityColors[insight.importance]
                }}>
                  {insight.importance?.toUpperCase()}
                </span>
              </div>
              <div style={{ lineHeight: '1.7', fontSize: '15px' }}>
                {insight.insight}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No key insights extracted. This may be due to document complexity or AI processing limitations.
        </div>
      )}
    </div>
  );
}

function SectionsSection({ sections }) {
  const [expandedSection, setExpandedSection] = useState(null);

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Document Sections</h2>
      
      {sections && sections.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {sections.map((section, index) => (
            <div key={index} className="glass-card" style={{ padding: '20px' }}>
              <div
                onClick={() => setExpandedSection(expandedSection === index ? null : index)}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div style={{ fontSize: '18px', fontWeight: '600' }}>
                  📑 {section.title}
                </div>
                <span style={{ fontSize: '20px' }}>
                  {expandedSection === index ? '▼' : '▶'}
                </span>
              </div>
              
              {expandedSection === index && (
                <div style={{ marginTop: '15px' }}>
                  <div style={{ marginBottom: '15px', lineHeight: '1.7' }}>
                    {section.summary}
                  </div>
                  
                  {section.keyPoints && section.keyPoints.length > 0 && (
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Key Points:</div>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {section.keyPoints.map((point, idx) => (
                          <li key={idx} style={{ marginBottom: '8px', lineHeight: '1.6' }}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No sections identified. Document may not have clear section structure.
        </div>
      )}
    </div>
  );
}

function TopicsSection({ topics }) {
  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Topics & Themes</h2>
      
      <div className="glass-card" style={{ padding: '25px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {(topics?.items || []).map((topic, index) => (
            <div key={index} style={{
              padding: '10px 16px',
              background: 'var(--primary-gradient)',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {topic}
            </div>
          ))}
        </div>
        
        {topics?.confidence && (
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Confidence: {Math.round(topics.confidence * 100)}% | 
              Needs Review: {topics.needsReview ? 'Yes' : 'No'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EntitiesSection({ entities }) {
  const groupedEntities = (entities?.items || []).reduce((acc, entity) => {
    const type = entity.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(entity);
    return acc;
  }, {});

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Named Entities</h2>
      
      {Object.keys(groupedEntities).length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {Object.entries(groupedEntities).map(([type, items]) => (
            <div key={type} className="glass-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px', textTransform: 'capitalize' }}>
                {type === 'organization' ? '🏢' : type === 'person' ? '👤' : type === 'location' ? '📍' : '🔖'} {type}s
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {items.map((entity, idx) => (
                  <span key={idx} style={{
                    padding: '6px 12px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}>
                    {entity.name || entity}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No entities identified in this document.
        </div>
      )}
    </div>
  );
}

function ValidationSection({ validationPoints, onResolve, onRequestClarification, aiSuggestions }) {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [resolutionText, setResolutionText] = useState('');

  const priorityColors = {
    high: '#ef4444',
    medium: '#fbbf24',
    low: '#3b82f6'
  };

  const unresolvedPoints = validationPoints.filter(vp => !vp.resolved);
  const resolvedPoints = validationPoints.filter(vp => vp.resolved);

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Validation Points</h2>
      
      {/* Unresolved Points */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>
          ⚠️ Needs Validation ({unresolvedPoints.length})
        </h3>
        
        {unresolvedPoints.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {unresolvedPoints.map((vp) => (
              <div key={vp.id} className="glass-card" style={{
                padding: '20px',
                border: `2px solid ${priorityColors[vp.priority]}40`,
                background: selectedPoint === vp.id ? 'rgba(99, 102, 241, 0.1)' : undefined
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: `${priorityColors[vp.priority]}20`,
                        color: priorityColors[vp.priority]
                      }}>
                        {vp.priority?.toUpperCase()}
                      </span>
                      {vp.text && (
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          Position: ~{vp.location}
                        </span>
                      )}
                    </div>
                    
                    {vp.text && (
                      <div style={{
                        padding: '12px',
                        background: 'rgba(0, 0, 0, 0.2)',
                        borderLeft: `3px solid ${priorityColors[vp.priority]}`,
                        borderRadius: '6px',
                        marginBottom: '10px',
                        fontSize: '14px',
                        fontStyle: 'italic'
                      }}>
                        "{vp.text}"
                      </div>
                    )}
                    
                    <div style={{ fontSize: '14px', marginBottom: '10px' }}>
                      <strong>Why it needs validation:</strong> {vp.reason}
                    </div>
                    
                    {vp.suggestion && (
                      <div style={{
                        padding: '12px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}>
                        <strong>💡 AI Suggestion:</strong> {vp.suggestion}
                      </div>
                    )}
                    
                    {aiSuggestions[vp.id] && (
                      <div style={{
                        marginTop: '10px',
                        padding: '12px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}>
                        <strong>🤖 AI Clarification:</strong> {aiSuggestions[vp.id]}
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => onRequestClarification(vp)}
                    style={{ fontSize: '13px', padding: '8px 14px' }}
                  >
                    💬 Ask AI for Clarification
                  </button>
                  
                  <button
                    className="btn btn-primary"
                    onClick={() => setSelectedPoint(selectedPoint === vp.id ? null : vp.id)}
                    style={{ fontSize: '13px', padding: '8px 14px' }}
                  >
                    {selectedPoint === vp.id ? 'Cancel' : '✓ Mark as Resolved'}
                  </button>
                </div>
                
                {selectedPoint === vp.id && (
                  <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <textarea
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                      placeholder="Add your resolution notes..."
                      style={{
                        width: '100%',
                        minHeight: '80px',
                        padding: '12px',
                        background: 'rgba(0, 0, 0, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        marginBottom: '10px'
                      }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        onResolve(vp.id, resolutionText);
                        setResolutionText('');
                        setSelectedPoint(null);
                      }}
                    >
                      💾 Save Resolution
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card" style={{
            padding: '40px',
            textAlign: 'center',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            ✅ All validation points have been resolved!
          </div>
        )}
      </div>

      {/* Resolved Points */}
      {resolvedPoints.length > 0 && (
        <div>
          <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>
            ✅ Resolved ({resolvedPoints.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {resolvedPoints.map((vp) => (
              <div key={vp.id} className="glass-card" style={{
                padding: '15px',
                opacity: 0.7,
                background: 'rgba(16, 185, 129, 0.1)'
              }}>
                <div style={{ fontSize: '13px' }}>
                  <strong>{vp.text}</strong> - {vp.reason}
                </div>
                {vp.userResolution && (
                  <div style={{ fontSize: '12px', marginTop: '8px', color: 'var(--text-secondary)' }}>
                    Resolution: {vp.userResolution}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NotesSection({ notes, onAddNote }) {
  const [newNote, setNewNote] = useState('');
  const [selectedSection, setSelectedSection] = useState('general');

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote(selectedSection, newNote);
      setNewNote('');
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>My Notes</h2>
      
      <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>Section</label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}
          >
            <option value="general">General</option>
            <option value="summary">Summary</option>
            <option value="insights">Insights</option>
            <option value="validation">Validation</option>
          </select>
        </div>
        
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add your notes here..."
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '12px',
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontFamily: 'inherit',
            marginBottom: '10px'
          }}
        />
        
        <button className="btn btn-primary" onClick={handleAddNote}>
          📝 Add Note
        </button>
      </div>

      {/* Display Notes */}
      {Object.entries(notes).map(([section, sectionNotes]) => (
        sectionNotes.length > 0 && (
          <div key={section} style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '10px', textTransform: 'capitalize' }}>
              {section} Notes
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sectionNotes.map((note, idx) => (
                <div key={idx} className="glass-card" style={{ padding: '15px' }}>
                  <div style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '8px' }}>
                    {note.text}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {new Date(note.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  );
}
