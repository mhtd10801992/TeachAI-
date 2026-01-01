import { useState, useEffect } from 'react';
import API from '../api/api';

export default function TopicExplorer({ documentId, filename }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [topicDetails, setTopicDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (documentId) {
      loadTopics();
    }
  }, [documentId]);

  const loadTopics = async () => {
    setLoading(true);
    setError(null);
    setTopics([]);
    try {
      console.log(`🏷️ Loading topics for document ${documentId}`);
      const response = await API.get(`/metadata/documents/${documentId}/metadata`);
      
      if (response.data && response.data.success) {
        const metadata = response.data.metadata;
        const topicsList = metadata.analysis?.topics || [];
        setTopics(topicsList);
        console.log(`✅ Found ${topicsList.length} topics`);
      }
    } catch (err) {
      console.error('❌ Error loading topics:', err);
      setError('Failed to load topics from document');
    } finally {
      setLoading(false);
    }
  };

  const loadTopicDetails = async (topicName) => {
    setLoadingDetails(true);
    try {
      console.log(`📖 Loading details for topic: ${topicName}`);
      const encodedTopic = encodeURIComponent(topicName);
      const response = await API.get(`/metadata/documents/${documentId}/topics/${encodedTopic}`);
      
      if (response.data && response.data.success) {
        setTopicDetails(response.data.topicDetails);
        console.log('✅ Topic details loaded');
      }
    } catch (err) {
      console.error('❌ Error loading topic details:', err);
      setTopicDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleTopicSelect = (topic) => {
    if (selectedTopic === topic) {
      setSelectedTopic(null);
      setTopicDetails(null);
    } else {
      setSelectedTopic(topic);
      loadTopicDetails(topic);
    }
  };

  if (!documentId) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: 'var(--text-secondary)'
      }}>
        Select a document to explore topics
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '14px', marginBottom: '10px' }}>Loading topics...</div>
        <div style={{
          display: 'inline-block',
          width: '20px',
          height: '20px',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          borderTopColor: 'var(--primary-color)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        background: 'rgba(239, 68, 68, 0.1)',
        borderRadius: '8px',
        color: '#ef4444',
        fontSize: '14px'
      }}>
        ⚠️ {error}
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: 'var(--text-secondary)'
      }}>
        🏷️ No topics found in this document
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', gap: '20px', padding: '20px' }}>
      {/* Topics List */}
      <div style={{
        width: '35%',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        overflowY: 'auto',
        paddingRight: '15px'
      }}>
        <div style={{
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '15px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🏷️ Topics ({topics.length})
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {topics.map((topic, index) => (
            <div
              key={index}
              onClick={() => handleTopicSelect(topic)}
              style={{
                padding: '12px',
                background: selectedTopic === topic 
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(168, 85, 247, 0.3) 100%)'
                  : 'rgba(0, 0, 0, 0.2)',
                border: selectedTopic === topic
                  ? '2px solid rgba(99, 102, 241, 0.5)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: '600' }}>
                {topic}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Topic #{index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Topic Details */}
      <div style={{
        flex: 1,
        overflowY: 'auto'
      }}>
        {selectedTopic ? (
          loadingDetails ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px'
            }}>
              <div style={{ fontSize: '14px', marginBottom: '10px' }}>Loading topic details...</div>
              <div style={{
                display: 'inline-block',
                width: '20px',
                height: '20px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderTopColor: 'var(--primary-color)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
          ) : topicDetails ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Topic Title */}
              <div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '22px', color: 'var(--primary-color)' }}>
                  {topicDetails.name}
                </h3>
                {topicDetails.frequency && (
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Found <strong>{topicDetails.frequency}</strong> times in document
                  </div>
                )}
              </div>

              {/* Related Entities */}
              {topicDetails.relatedEntities && topicDetails.relatedEntities.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    👥 Related Entities
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {topicDetails.relatedEntities.map((entity, i) => (
                      <span
                        key={i}
                        style={{
                          padding: '6px 12px',
                          background: 'rgba(34, 197, 94, 0.2)',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                          borderRadius: '16px',
                          fontSize: '12px'
                        }}
                      >
                        {entity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Topics */}
              {topicDetails.relatedTopics && topicDetails.relatedTopics.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    🔗 Related Topics
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {topicDetails.relatedTopics.map((relTopic, i) => (
                      <span
                        key={i}
                        style={{
                          padding: '6px 12px',
                          background: 'rgba(99, 102, 241, 0.2)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          borderRadius: '16px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => handleTopicSelect(relTopic)}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(99, 102, 241, 0.3)'}
                        onMouseLeave={(e) => e.target.style.background = 'rgba(99, 102, 241, 0.2)'}
                      >
                        {relTopic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Context / Evidence */}
              {topicDetails.context && topicDetails.context.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    📖 Supporting Evidence ({topicDetails.context.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {topicDetails.context.slice(0, 3).map((evidence, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '12px',
                          background: 'rgba(0, 0, 0, 0.3)',
                          borderLeft: '3px solid rgba(99, 102, 241, 0.5)',
                          borderRadius: '4px',
                          fontSize: '12px',
                          lineHeight: '1.6'
                        }}
                      >
                        {evidence}
                      </div>
                    ))}
                    {topicDetails.context.length > 3 && (
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        textAlign: 'center',
                        padding: '10px'
                      }}>
                        +{topicDetails.context.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mentions */}
              {topicDetails.mentions && topicDetails.mentions.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    📍 Mentions ({topicDetails.mentions.length})
                  </h4>
                  <div style={{
                    padding: '10px',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: 'var(--text-secondary)'
                  }}>
                    {topicDetails.mentions.slice(0, 5).join(', ')}
                    {topicDetails.mentions.length > 5 && `, +${topicDetails.mentions.length - 5} more`}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              Unable to load topic details
            </div>
          )
        ) : (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '14px'
          }}>
            Select a topic to view details
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
