
import React, { useState } from 'react';
import API from '../api/api';

const WebAnalyzer = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [savedId, setSavedId] = useState(null);

  const handleAnalyze = async () => {
    if (!url) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    setSavedId(null);

    try {
      // We now send saveToHistory: true to automatically save the result
      const response = await API.post('/web/analyze', { 
          url,
          saveToHistory: true 
      });
      
      setResult(response.data);
      if (response.data.savedDocumentId) {
          setSavedId(response.data.savedDocumentId);
      }
    } catch (err) {
      if (err.response && err.response.status === 403) {
          setError(err.response.data.summary); // Show the friendly access denied message
      } else {
          setError(err.message || 'Failed to analyze website');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Compact Input and Button */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: result || error ? '12px' : '0' }}>
        <input 
          type="text" 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter web link or PDF URL..."
          className="input"
          style={{
            flex: 1,
            padding: '10px 12px',
            fontSize: '13px'
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
        />
        <button 
          onClick={handleAnalyze}
          disabled={loading || !url}
          className={`btn ${loading ? 'btn-secondary' : 'btn-success'}`}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            whiteSpace: 'nowrap'
          }}
        >
          {loading ? '⏳ Analyzing...' : '🔍 Analyze'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ 
          padding: '12px', 
          background: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444', 
          borderRadius: '8px', 
          marginBottom: '12px',
          fontSize: '13px' 
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Success Message */}
      {savedId && (
        <div style={{ 
          padding: '12px', 
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981', 
          borderRadius: '8px', 
          marginBottom: '12px', 
          fontSize: '13px'
        }}>
          ✅ Saved to History
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
          {/* Summary */}
          <div style={{ 
            padding: '12px', 
            background: 'var(--bg-secondary)', 
            borderRadius: '8px',
            border: '1px solid var(--glass-border)'
          }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
              📄 Summary
            </h4>
            <div style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
              {result.summary}
            </div>
          </div>

          {/* Scholarly Data */}
          {result.scholarlyData && (
            <div style={{ 
              padding: '12px', 
              background: 'var(--bg-secondary)', 
              borderRadius: '8px',
              border: '1px solid var(--glass-border)'
            }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
                🎓 Insights
              </h4>
              <div style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                {result.scholarlyData}
              </div>
            </div>
          )}

          {/* Images */}
          {result.images && result.images.length > 0 && (
            <div style={{ 
              padding: '12px', 
              background: 'var(--bg-secondary)', 
              borderRadius: '8px',
              border: '1px solid var(--glass-border)'
            }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
                🖼️ Images ({result.images.length})
              </h4>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {result.images.length} image{result.images.length !== 1 ? 's' : ''} found. View in Document History for full gallery.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WebAnalyzer;
