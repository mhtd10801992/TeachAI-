import React, { useState } from "react";
import API from "../api/api";
import AIAnalysisDisplay from "./AIAnalysisDisplay";
import DocumentSummaryCard from "./DocumentSummaryCard";

// Simple Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-card" style={{
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid #ef4444',
          background: 'rgba(239, 68, 68, 0.1)'
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
              ❌
            </div>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '4px', color: '#ef4444' }}>
                Display Error
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                {this.state.error?.message || 'Failed to display analysis results'}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function FileUploader({ onViewHistory }) {
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

      console.log('✅ Upload successful, response received:', {
        success: res.data.success,
        hasDocument: !!res.data.document,
        documentId: res.data.document?.id,
        fileName: res.data.document?.filename,
        hasAnalysis: !!res.data.document?.analysis
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
    <div>
      {/* Compact Upload Area */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        alignItems: 'center', 
        justifyContent: file ? 'flex-start' : 'center',
        marginBottom: file ? '12px' : '0' 
      }}>
        <label className="btn btn-primary" style={{ 
          cursor: 'pointer',
          padding: '10px 20px',
          fontSize: '14px',
          flexShrink: 0
        }}>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            disabled={loading}
            style={{ display: 'none' }}
            accept=".pdf,.doc,.docx,.txt"
          />
          📁 Choose File
        </label>
        
        {file && (
          <>
            <div style={{ 
              flex: 1,
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {file.name}
            </div>
            <button 
              onClick={() => setFile(null)}
              className="btn btn-outline"
              style={{ 
                padding: '10px 16px',
                fontSize: '14px'
              }}
            >
              ✕
            </button>
          </>
        )}
      </div>

      {/* Upload Button */}
      {file && !response && (
        <button 
          onClick={uploadFile}
          disabled={!file || loading}
          className={`btn ${loading ? 'btn-secondary' : 'btn-success'}`}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            width: '100%'
          }}
        >
          {loading ? '⏳ Processing...' : '🚀 Upload & Analyze'}
        </button>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '12px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          marginTop: '12px',
          fontSize: '13px',
          color: '#ef4444'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Success Response */}
      {response && (
        <div style={{ marginTop: '12px' }}>
          <div style={{
            padding: '12px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            marginBottom: '12px',
            fontSize: '13px',
            color: '#10b981'
          }}>
            ✅ Upload successful!
          </div>

          {/* Document Summary Card */}
          {response.document && (
            <DocumentSummaryCard document={response.document} />
          )}

          {/* AI Analysis Display */}
          <ErrorBoundary>
            <AIAnalysisDisplay 
              response={response} 
              onUpdateAnalysis={handleAnalysisUpdate}
              onViewHistory={onViewHistory}
            />
          </ErrorBoundary>
        </div>
      )}
    </div>
  );
}