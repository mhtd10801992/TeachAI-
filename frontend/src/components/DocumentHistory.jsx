import React, { useState, useEffect } from 'react';
import API from '../api/api';
import AIAnalysisDisplay from './AIAnalysisDisplay';

export default function DocumentHistory({ onReview }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [stats, setStats] = useState(null);
  const [view, setView] = useState('list'); // 'list' or 'detail'

  useEffect(() => {
    fetchDocuments();
    fetchStats();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching documents from API...');
      const response = await API.get('/documents');
      console.log('✅ API Response:', response.data);
      setDocuments(response.data.documents || []);
    } catch (err) {
      setError('Failed to fetch documents');
      console.error('❌ API Error:', err);
      console.error('❌ Error details:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      console.error('❌ Error message:', err.message);
      console.error('❌ Request URL:', err.config?.url);
      
      // Check if it's a network error
      if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        setError('Cannot connect to backend server. If running locally, ensure backend is running on http://localhost:4000 and you are accessing the app at http://localhost:5173');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await API.get('/documents/stats');
      setStats(response.data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const searchDocuments = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/documents/search?query=${encodeURIComponent(searchQuery)}`);
      setDocuments(response.data.documents || []);
    } catch (err) {
      setError('Failed to search documents');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (id) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await API.delete(`/documents/${id}`);
      setDocuments(documents.filter(doc => doc.document.id !== id));
      if (selectedDocument?.document.id === id) {
        setSelectedDocument(null);
        setView('list');
      }
    } catch (err) {
      setError('Failed to delete document');
      console.error('Error:', err);
    }
  };

  const viewDocument = (document) => {
    setSelectedDocument(document);
    setView('detail');
  };

  const handleAnalysisUpdate = async (updatedDocument) => {
    try {
      // Update the document in the backend
      await API.put(`/documents/${updatedDocument.id}`, {
        analysis: updatedDocument.analysis,
        humanReviewed: true
      });
      
      // Update the selected document
      setSelectedDocument(prev => ({
        ...prev,
        document: updatedDocument
      }));
      
      // Update the documents list
      setDocuments(prev => prev.map(doc => 
        doc.document.id === updatedDocument.id 
          ? { ...doc, document: updatedDocument }
          : doc
      ));
      
      console.log('Analysis updated successfully');
    } catch (error) {
      console.error('Failed to update analysis:', error);
      // You could add error handling here
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchDocuments();
    } else {
      fetchDocuments();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (view === 'detail' && selectedDocument) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {/* Header with back button */}
        <div className="glass-card" style={{
          padding: '20px',
          borderRadius: '16px',
          marginBottom: '25px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <button 
              onClick={() => setView('list')}
              className="btn btn-secondary"
              style={{ marginRight: '15px' }}
            >
              ← Back to Documents
            </button>
            <h2 style={{ display: 'inline', margin: 0 }}>Document Analysis</h2>
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {formatDate(selectedDocument.createdAt)}
          </div>
        </div>

        {/* Document metadata */}
        <div className="glass-card" style={{
          padding: '20px',
          borderRadius: '16px',
          marginBottom: '25px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              background: 'var(--primary-gradient)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              📄
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, marginBottom: '4px' }}>
                {selectedDocument.document.filename}
              </h3>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                {formatFileSize(selectedDocument.document.size)} • 
                Uploaded {formatDate(selectedDocument.document.uploadDate)} • 
                Status: <span style={{ 
                  color: selectedDocument.status === 'processed' ? 'var(--success)' : 'var(--warning)',
                  fontWeight: '600',
                  textTransform: 'capitalize'
                }}>
                  {selectedDocument.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Analysis Display */}
        <AIAnalysisDisplay 
          response={selectedDocument} 
          onUpdateAnalysis={handleAnalysisUpdate}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Search Bar - Compact */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '15px',
        background: 'rgba(102, 126, 234, 0.08)',
        padding: '12px',
        borderRadius: '12px',
        border: '1px solid rgba(102, 126, 234, 0.2)'
      }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search documents..."
          className="input"
          style={{ 
            flex: 1,
            padding: '8px 12px',
            fontSize: '14px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#fff'
          }}
          onKeyPress={(e) => e.key === 'Enter' && searchDocuments()}
        />
        <button 
          onClick={searchDocuments} 
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          🔍
        </button>
        <button 
          onClick={() => {
            setSearchQuery('');
            fetchDocuments();
          }}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#ccc',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = '#ccc';
          }}
        >
          Clear
        </button>
      </div>

      {/* Stats Bar - Compact */}
      {stats && (
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '15px',
          flexWrap: 'wrap'
        }}>
          {[
            { icon: '📊', label: 'Total', value: stats.totalDocuments, color: '#667eea' },
            { icon: '⏳', label: 'Pending', value: stats.pendingValidation, color: '#f59e0b' },
            { icon: '✅', label: 'Done', value: stats.processed, color: '#10b981' },
            { icon: '🎯', label: 'Confidence', value: `${Math.round(stats.averageConfidence * 100)}%`, color: '#ec4899' }
          ].map((stat, i) => (
            <div key={i} style={{
              flex: '1 1 auto',
              minWidth: '100px',
              padding: '10px 15px',
              background: `linear-gradient(135deg, ${stat.color}22, ${stat.color}11)`,
              border: `1px solid ${stat.color}44`,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '18px' }}>{stat.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '2px' }}>{stat.label}</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: stat.color }}>{stat.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Documents List - Scrollable */}
      <div style={{
        maxHeight: '500px',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '5px',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        {loading ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#aaa'
          }}>
            <div style={{
              width: '30px',
              height: '30px',
              border: '3px solid rgba(102, 126, 234, 0.3)',
              borderTop: '3px solid #667eea',
              borderRadius: '50%',
              margin: '0 auto 10px',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ margin: 0, fontSize: '14px' }}>Loading...</p>
          </div>
        ) : error ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#ef4444',
            fontSize: '14px'
          }}>
            ⚠️ {error}
          </div>
        ) : documents.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#888'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '10px', opacity: 0.4 }}>📁</div>
            <p style={{ margin: 0, fontSize: '14px' }}>
              {searchQuery ? 'No documents found' : 'Upload documents to get started'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {documents.map((doc) => {
              const averageConfidence = doc.document.analysis ? (
                (doc.document.analysis.summary?.confidence || 0) +
                (doc.document.analysis.topics?.confidence || 0) +
                (doc.document.analysis.entities?.confidence || 0) +
                (doc.document.analysis.sentiment?.confidence || 0)
              ) / 4 : 0;

              const confColor = averageConfidence >= 0.8 ? '#10b981' : averageConfidence >= 0.6 ? '#f59e0b' : '#ef4444';

              return (
                <div 
                  key={doc.document.id}
                  style={{
                    padding: '12px 15px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.12)';
                    e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
                    e.currentTarget.style.transform = 'translateX(3px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    flexShrink: 0
                  }}>
                    📄
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#fff',
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {doc.document.filename}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#aaa',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}>
                      <span>{formatFileSize(doc.document.size)}</span>
                      <span>•</span>
                      <span>{formatDate(doc.document.uploadDate)}</span>
                      <span>•</span>
                      <span style={{
                        background: `${confColor}33`,
                        color: confColor,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        {Math.round(averageConfidence * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReview && onReview(doc.document.id);
                      }}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        border: 'none',
                        borderRadius: '6px',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      🔍 Review
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        viewDocument(doc);
                      }}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        background: 'rgba(102, 126, 234, 0.2)',
                        border: '1px solid rgba(102, 126, 234, 0.3)',
                        borderRadius: '6px',
                        color: '#a5b4fc',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.3)';
                        e.currentTarget.style.color = '#c7d2fe';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                        e.currentTarget.style.color = '#a5b4fc';
                      }}
                    >
                      View
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDocument(doc.document.id);
                      }}
                      style={{
                        padding: '6px 10px',
                        fontSize: '12px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '6px',
                        color: '#fca5a5',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                        e.currentTarget.style.color = '#fecaca';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                        e.currentTarget.style.color = '#fca5a5';
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}