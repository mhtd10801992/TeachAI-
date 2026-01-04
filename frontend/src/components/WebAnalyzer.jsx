
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
    <div className="web-analyzer-container" style={{ 
      padding: '20px', 
      backgroundColor: '#f9fafb', 
      borderRadius: '8px', 
      height: '350px', // Fixed smaller height
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <input 
          type="text" 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter web link or PDF URL..."
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            fontSize: '13px',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = '#2563eb'}
          onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
        />
        <button 
          onClick={handleAnalyze}
          disabled={loading || !url}
          style={{
            padding: '0 16px',
            backgroundColor: loading ? '#9ca3af' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            whiteSpace: 'nowrap',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#1d4ed8')}
          onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2563eb')}
        >
          {loading ? 'Processing...' : 'Analyze'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '10px', whiteSpace: 'pre-line', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {savedId && (
        <div style={{ padding: '8px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '6px', marginBottom: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
           <span>✅</span> Saved to History
        </div>
      )}

      {result && (
        <div className="analysis-results" style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1, paddingRight: '5px' }}>
          {/* Summary Card */}
          <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>
              📄 Summary
            </h4>
            <div style={{ fontSize: '12px', lineHeight: '1.4', color: '#4b5563', whiteSpace: 'pre-line' }}>
              {result.summary}
            </div>
          </div>

          {/* Scholarly Data Card */}
          <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>
              🎓 Insights
            </h4>
            <div style={{ fontSize: '12px', lineHeight: '1.4', color: '#4b5563', whiteSpace: 'pre-line' }}>
              {result.scholarlyData || "No data found."}
            </div>
          </div>

          {/* Image Analysis Card */}
          <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>
              🖼️ Visuals {result.images && result.images.length > 0 && `(${result.images.length} image${result.images.length !== 1 ? 's' : ''})`}
            </h4>
            
            {/* Display extracted images with thumbnails */}
            {result.images && result.images.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {result.images.map((img, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    gap: '10px',
                    padding: '8px',
                    background: 'rgba(99, 102, 241, 0.05)',
                    borderRadius: '6px',
                    border: '1px solid rgba(99, 102, 241, 0.1)'
                  }}>
                    {/* Image thumbnail */}
                    {img.imageUrl && (
                      <div style={{ flexShrink: 0 }}>
                        <img
                          src={img.imageUrl}
                          alt={img.caption || `Image ${idx + 1}`}
                          style={{
                            width: '80px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            border: '1px solid rgba(0,0,0,0.1)',
                            cursor: 'pointer'
                          }}
                          onClick={() => window.open(img.imageUrl, '_blank')}
                          title="Click to view full size"
                        />
                      </div>
                    )}
                    
                    {/* Image details */}
                    <div style={{ flex: 1, fontSize: '11px' }}>
                      <div style={{ fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                        {img.caption || `Image ${img.imageIndex || idx + 1}`}
                        {img.pageNumber && ` (Page ${img.pageNumber})`}
                      </div>
                      <div style={{ color: '#6b7280', lineHeight: '1.4' }}>
                        {img.description || 'No description available'}
                      </div>
                      {img.dimensions && (
                        <div style={{ color: '#9ca3af', marginTop: '4px', fontSize: '10px' }}>
                          📐 {img.dimensions}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                <div style={{ 
                  fontSize: '11px', 
                  color: '#6b7280',
                  padding: '8px',
                  background: 'rgba(34, 197, 94, 0.05)',
                  borderRadius: '6px',
                  border: '1px solid rgba(34, 197, 94, 0.2)'
                }}>
                  💡 <strong>Tip:</strong> Save to history to access the full Images & Tables gallery with advanced AI analysis features.
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '12px', lineHeight: '1.4', color: '#4b5563', whiteSpace: 'pre-line' }}>
                {result.imageAnalysis || 'No images found in this document.'}
              </div>
            )}
          </div>
        </div>
      )}
      
      {!result && !loading && !error && (
        <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#9ca3af',
            textAlign: 'center',
            padding: '10px'
        }}>
            <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }}>🌐</div>
            <p style={{ fontSize: '13px' }}>Enter a URL to analyze web content<br/>or online PDF documents.</p>
        </div>
      )}
    </div>
  );
};

export default WebAnalyzer;
