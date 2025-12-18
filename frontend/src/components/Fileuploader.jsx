import { useState } from "react";
import API from "../api/api";
import AIAnalysisDisplay from "./AIAnalysisDisplay";

export default function FileUploader() {
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await API.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setResponse(res.data);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleAnalysisUpdate = (updatedDocument) => {
    // Update the response with the new analysis
    setResponse(prev => ({
      ...prev,
      document: updatedDocument
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Drag & Drop Upload Area */}
      <div 
        className="glass-card"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          padding: '40px',
          textAlign: 'center',
          borderRadius: '20px',
          border: dragOver ? '2px dashed var(--accent-blue)' : '2px dashed rgba(255, 255, 255, 0.2)',
          background: dragOver ? 'rgba(79, 70, 229, 0.1)' : 'var(--glass-bg)',
          transition: 'all 0.3s ease',
          marginBottom: '25px',
          cursor: 'pointer'
        }}
      >
        <div style={{
          fontSize: '48px',
          marginBottom: '20px',
          opacity: dragOver ? 1 : 0.6
        }}>
          📁
        </div>
        
        <h3 style={{ 
          marginBottom: '12px',
          color: dragOver ? 'var(--accent-blue)' : 'var(--text-primary)'
        }}>
          {dragOver ? 'Drop your file here!' : 'Drag & drop your document'}
        </h3>
        
        <p style={{ 
          color: 'var(--text-secondary)', 
          marginBottom: '25px',
          fontSize: '14px'
        }}>
          Supports PDF, DOC, DOCX, TXT files up to 10MB
        </p>

        <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            disabled={loading}
            style={{ display: 'none' }}
            accept=".pdf,.doc,.docx,.txt"
          />
          Choose File
        </label>
      </div>

      {/* Selected File Display */}
      {file && (
        <div className="glass-card animate-fadeInUp" style={{
          padding: '20px',
          borderRadius: '16px',
          marginBottom: '20px'
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
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                {file.name}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                {formatFileSize(file.size)} • {file.type || 'Unknown type'}
              </div>
            </div>
            <button 
              onClick={() => setFile(null)}
              className="btn btn-secondary"
              style={{ 
                padding: '8px 12px',
                borderRadius: '8px'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Upload Button */}
      {file && (
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <button 
            onClick={uploadFile}
            disabled={!file || loading}
            className={`btn ${loading ? 'btn-secondary' : 'btn-primary'}`}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              borderRadius: '15px'
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="animate-pulse" style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'var(--primary-gradient)'
                }}></div>
                Processing...
              </span>
            ) : (
              '🚀 Upload & Process'
            )}
          </button>
        </div>
      )}

      {/* Loading Progress */}
      {loading && (
        <div className="glass-card animate-fadeInUp" style={{
          padding: '25px',
          borderRadius: '16px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ marginBottom: '8px' }}>🧠 AI Processing in Progress</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Analyzing document content and extracting insights...
            </p>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '70%' }}></div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="glass-card animate-fadeInUp" style={{
          padding: '20px',
          borderRadius: '16px',
          marginBottom: '20px',
          border: '1px solid var(--error)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              ⚠️
            </div>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '4px', color: 'var(--error)' }}>
                Upload Failed
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Response */}
      {response && (
        <div>
          <div className="glass-card animate-fadeInUp" style={{
            padding: '25px',
            borderRadius: '16px',
            border: '1px solid var(--success)',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                ✅
              </div>
              <div>
                <h4 style={{ margin: 0, color: 'var(--success)' }}>Upload Successful!</h4>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Your document has been processed and analyzed by our AI
                </p>
              </div>
            </div>
          </div>

          {/* AI Analysis Display */}
          <AIAnalysisDisplay 
            response={response} 
            onUpdateAnalysis={handleAnalysisUpdate}
          />
        </div>
      )}
    </div>
  );
}