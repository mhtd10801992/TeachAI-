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
      setError(null);
      console.log('🔄 Fetching documents from API...');
      const response = await API.get('/documents');
      console.log('✅ API Response:', response.data);
      
      if (response.data && response.data.documents) {
        setDocuments(response.data.documents);
        console.log('✅ Set documents:', response.data.documents.length);
      } else {
        console.warn('⚠️ No documents in response');
        setDocuments([]);
      }
    } catch (err) {
      console.error('❌ API Error:', err);
      console.error('❌ Error details:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      console.error('❌ Error message:', err.message);
      
      // Set error but keep any existing documents
      const errorMessage = err.code === 'ERR_NETWORK' || err.message.includes('Network Error')
        ? 'Cannot connect to backend server. Please ensure backend is running on http://localhost:4000'
        : 'Failed to fetch documents';
      
      setError(errorMessage);
      
      // Don't clear documents on error - keep showing what we have
      if (documents.length === 0) {
        setDocuments([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await API.get('/documents/stats');
      if (response.data && response.data.stats) {
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Don't fail if stats don't load - just log it
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
      <div>
        {/* Header with back button */}
        <div className="glass-card" style={{
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '16px',
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
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '16px'
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
      {/* Header */}
      <div className="glass-card" style={{
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          background: 'var(--primary-gradient)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          margin: '0 auto 12px'
        }}>
          📚
        </div>
        <h2 style={{
          marginBottom: '6px',
          fontSize: '18px',
          fontWeight: '700',
          background: 'var(--primary-gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Document History & Analysis Ledger
        </h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '12px' }}>
          View and manage all your uploaded documents and their AI analysis results
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <StatCard
            icon="📊"
            title="Total Documents"
            value={stats.totalDocuments}
            color="var(--primary-gradient)"
          />
          <StatCard
            icon="⏳"
            title="Pending Review"
            value={stats.pendingValidation}
            color="linear-gradient(135deg, #f59e0b, #d97706)"
          />
          <StatCard
            icon="✅"
            title="Processed"
            value={stats.processed}
            color="linear-gradient(135deg, #10b981, #059669)"
          />
          <StatCard
            icon="🎯"
            title="Avg Confidence"
            value={`${Math.round(stats.averageConfidence * 100)}%`}
            color="var(--secondary-gradient)"
          />
        </div>
      )}

      {/* Search Bar */}
      <div className="glass-card" style={{
        padding: '20px',
        borderRadius: '16px',
        marginBottom: '25px'
      }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '15px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by filename, content, or topics..."
            className="input"
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary">
            🔍 Search
          </button>
          <button 
            type="button" 
            onClick={() => {
              setSearchQuery('');
              fetchDocuments();
            }}
            className="btn btn-secondary"
          >
            Clear
          </button>
        </form>
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="glass-card" style={{
          padding: '40px',
          textAlign: 'center',
          borderRadius: '16px'
        }}>
          <div className="animate-pulse" style={{
            width: '40px',
            height: '40px',
            background: 'var(--primary-gradient)',
            borderRadius: '50%',
            margin: '0 auto 15px'
          }}></div>
          <p>Loading documents...</p>
        </div>
      ) : error && documents.length === 0 ? (
        <div className="glass-card" style={{
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid var(--error)'
        }}>
          <p style={{ color: 'var(--error)', margin: 0 }}>
            ⚠️ {error}
          </p>
        </div>
      ) : documents.length === 0 ? (
        <div className="glass-card" style={{
          padding: '40px',
          textAlign: 'center',
          borderRadius: '16px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.6 }}>
            📁
          </div>
          <h3 style={{ marginBottom: '8px' }}>No documents found</h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {searchQuery ? 'Try adjusting your search terms' : 'Upload some documents to get started'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {error && (
            <div className="glass-card" style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              background: 'rgba(245, 158, 11, 0.1)',
              marginBottom: '15px'
            }}>
              <p style={{ color: '#f59e0b', margin: 0, fontSize: '12px' }}>
                ⚠️ {error}
              </p>
            </div>
          )}
          {documents.map((doc, index) => (
            <DocumentCard
              key={doc.document?.id || index}
              document={doc}
              onView={() => viewDocument(doc)}
              onDelete={() => doc.document?.id && deleteDocument(doc.document.id)}
              onReview={() => doc.document?.id && onReview && onReview(doc.document.id)}
              formatDate={formatDate}
              formatFileSize={formatFileSize}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Statistics Card Component
const StatCard = ({ icon, title, value, color }) => (
  <div className="glass-card" style={{
    padding: '20px',
    borderRadius: '16px',
    textAlign: 'center'
  }}>
    <div style={{
      width: '50px',
      height: '50px',
      background: color,
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      margin: '0 auto 15px'
    }}>
      {icon}
    </div>
    <div style={{ fontWeight: '600', fontSize: '24px', marginBottom: '4px' }}>
      {value}
    </div>
    <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
      {title}
    </div>
  </div>
);

// Document Card Component
const DocumentCard = ({ document, onView, onDelete, onReview, formatDate, formatFileSize }) => {
  // Safety checks
  if (!document || !document.document) {
    console.error('Invalid document structure:', document);
    return null;
  }

  const doc = document.document;
  const analysis = doc.analysis || {};
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'processed': return 'var(--success)';
      case 'pending_validation': return 'var(--warning)';
      default: return 'var(--text-secondary)';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'var(--success)';
    if (confidence >= 0.6) return 'var(--warning)';
    return 'var(--error)';
  };

  const averageConfidence = analysis ? (
    (analysis.summary?.confidence || 0) +
    (analysis.topics?.confidence || 0) +
    (analysis.entities?.confidence || 0) +
    (analysis.sentiment?.confidence || 0)
  ) / 4 : 0;

  return (
    <div className="glass-card animate-fadeInUp" style={{
      padding: '20px',
      borderRadius: '16px',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
        {/* File Icon */}
        <div style={{
          width: '60px',
          height: '60px',
          background: 'var(--primary-gradient)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          flexShrink: 0
        }}>
          📄
        </div>

        {/* Document Info */}
        <div style={{ flex: 1, minWidth: '250px', maxWidth: '600px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <h4 style={{ 
              margin: 0, 
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              flex: 1,
              maxWidth: '100%'
            }}>
              {doc.filename || 'Unknown Document'}
            </h4>
            <span style={{
              background: getStatusColor(document.status),
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: '600',
              textTransform: 'uppercase'
            }}>
              {(document.status || 'unknown').replace('_', ' ')}
            </span>
          </div>
          
          <div style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '14px',
            marginBottom: '10px'
          }}>
            {formatFileSize(doc.size || 0)} • 
            Uploaded {formatDate(doc.uploadDate || new Date())}
          </div>

          {/* Topics */}
          {analysis?.topics?.items && Array.isArray(analysis.topics.items) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
              {analysis.topics.items.slice(0, 3).map((topic, i) => (
                <span key={i} style={{
                  background: 'rgba(102, 126, 234, 0.2)',
                  color: 'var(--accent-blue)',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}>
                  {topic}
                </span>
              ))}
              {analysis.topics.items.length > 3 && (
                <span style={{
                  color: 'var(--text-secondary)',
                  fontSize: '12px'
                }}>
                  +{analysis.topics.items.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Confidence Score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Avg Confidence:
            </span>
            <div style={{
              background: getConfidenceColor(averageConfidence),
              color: 'white',
              padding: '2px 6px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: '600'
            }}>
              {Math.round(averageConfidence * 100)}%
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px',
          minWidth: '200px',
          flexShrink: 0
        }}>
          {onReview && (
            <button 
              onClick={onReview}
              className="btn btn-secondary"
              style={{ 
                padding: '8px 16px', 
                fontSize: '13px',
                background: 'var(--primary-gradient)',
                border: 'none'
              }}
            >
              🔍 Comprehensive Review
            </button>
          )}
          <button 
            onClick={onView}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            📖 View Analysis
          </button>
          <button 
            onClick={onDelete}
            className="btn btn-danger"
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
};
