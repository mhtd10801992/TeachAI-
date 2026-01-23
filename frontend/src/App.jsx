import { useState, useEffect } from 'react';
import FileUploader from "./components/Fileuploader";
import ValidationDashboard from "./components/ValidationDashboard";
import DocumentHistory from "./components/DocumentHistory";
import AIChat from "./components/AIChat";
import ComprehensiveDocumentReview from "./components/ComprehensiveDocumentReview";
import WebAnalyzer from "./components/WebAnalyzer";
import SystemStatus from "./components/SystemStatus";
import MindMapCanvas from "./components/MindMapCanvas";
import API from "./api/api";
import './main.css';

function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentForReview, setSelectedDocumentForReview] = useState(null);
  const [currentView, setCurrentView] = useState('upload');

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const response = await API.get('/documents');
        setDocuments(response.data.documents || []);
      } catch (error) {
        console.error('Failed to load documents:', error);
      }
    };
    loadDocuments();
  }, []);

  const menuItems = [
    { id: 'upload', icon: '📤', label: 'File Upload', badge: null },
    { id: 'web', icon: '🌐', label: 'Web Analyzer', badge: null },
    { id: 'history', icon: '📚', label: 'Document History', badge: documents.length },
    { id: 'chat', icon: '💬', label: 'AI Chat', badge: null },
    { id: 'validation', icon: '🔍', label: 'Validation', badge: null },
    { id: 'mindmap', icon: '🧠', label: 'Mind Map', badge: null },
    { id: 'status', icon: '🔧', label: 'System Status', badge: null },
  ];

  if (selectedDocumentForReview) {
    return (
      <div style={{ minHeight: '100vh', padding: '10px' }}>
        <button
          onClick={() => setSelectedDocumentForReview(null)}
          style={{
            marginBottom: '10px',
            padding: '6px 12px',
            fontSize: '10px',
            background: 'rgba(168, 181, 255, 0.3)',
            border: '1px solid rgba(168, 181, 255, 0.4)',
            borderRadius: '5px',
            color: '#1e1b4b',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          ← Back to Dashboard
        </button>
        <ComprehensiveDocumentReview 
          documentId={selectedDocumentForReview} 
          onClose={() => setSelectedDocumentForReview(null)}
        />
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex',
      minHeight: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden'
    }}>
      {/* Left Sidebar Navigation */}
      <div style={{
        width: '220px',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRight: '1px solid rgba(100, 100, 150, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 10px rgba(0, 0, 0, 0.05)'
      }}>
        {/* Header */}
        <div style={{
          padding: '12px',
          borderBottom: '1px solid rgba(100, 100, 150, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: 'var(--primary-gradient)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}>
              🤖
            </div>
            <div>
              <h1 style={{ 
                margin: 0, 
                fontSize: '14px',
                fontWeight: '700',
                color: '#1e1b4b'
              }}>
                TeachAI
              </h1>
              <p style={{ 
                margin: 0, 
                color: '#6b7280', 
                fontSize: '9px' 
              }}>
                Intelligence Platform
              </p>
            </div>
          </div>
          
          <div style={{
            padding: '4px 8px',
            background: 'rgba(134, 239, 172, 0.2)',
            borderRadius: '5px',
            fontSize: '9px',
            color: '#064e3b',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            {documents.length} Documents Loaded
          </div>
        </div>

        {/* Navigation Menu */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px'
        }}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                marginBottom: '4px',
                background: currentView === item.id 
                  ? 'var(--primary-gradient)' 
                  : 'transparent',
                border: currentView === item.id 
                  ? '1px solid rgba(168, 181, 255, 0.3)' 
                  : '1px solid transparent',
                borderRadius: '6px',
                color: currentView === item.id ? '#1e1b4b' : '#4b5563',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: currentView === item.id ? '700' : '600',
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                if (currentView !== item.id) {
                  e.currentTarget.style.background = 'rgba(168, 181, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentView !== item.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge !== null && item.badge > 0 && (
                <span style={{
                  background: currentView === item.id 
                    ? 'rgba(30, 27, 75, 0.15)' 
                    : 'rgba(168, 181, 255, 0.3)',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontSize: '9px',
                  fontWeight: '700'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Footer Info */}
        <div style={{
          padding: '8px',
          borderTop: '1px solid rgba(100, 100, 150, 0.1)',
          fontSize: '8px',
          color: '#9ca3af'
        }}>
          <div style={{ 
            padding: '6px', 
            background: 'rgba(168, 181, 255, 0.1)', 
            borderRadius: '4px',
            marginBottom: '4px'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '2px', color: '#6b7280' }}>Quick Actions</div>
            <div>📤 Upload → 🧠 Analyze → ✓ Validate</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        background: 'var(--light-gradient)'
      }}>
        {/* Content Header */}
        <div className="glass-card" style={{
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '700',
              color: '#111827'
            }}>
              {menuItems.find(m => m.id === currentView)?.icon} {menuItems.find(m => m.id === currentView)?.label}
            </h2>
            <p style={{
              margin: 0,
              fontSize: '10px',
              color: '#6b7280'
            }}>
              {currentView === 'upload' && 'Upload and process document files'}
              {currentView === 'web' && 'Analyze web pages and PDF URLs'}
              {currentView === 'history' && 'View all processed documents'}
              {currentView === 'chat' && 'Chat with your documents using AI'}
              {currentView === 'validation' && 'Review and validate AI analysis'}
              {currentView === 'mindmap' && 'Generate knowledge mind maps'}
              {currentView === 'status' && 'System health and configuration'}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '6px 12px',
              background: 'rgba(168, 181, 255, 0.2)',
              border: '1px solid rgba(168, 181, 255, 0.3)',
              borderRadius: '5px',
              color: '#1e1b4b',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: '600'
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Content Body */}
        <div style={{
          padding: '16px',
          minHeight: 'calc(100vh - 120px)',
          overflow: 'auto'
        }}>
          {currentView === 'upload' && (
            <FileUploader onViewHistory={(docId) => setSelectedDocumentForReview(docId)} />
          )}
          
          {currentView === 'web' && (
            <WebAnalyzer />
          )}
          
          {currentView === 'history' && (
            <DocumentHistory onReview={(docId) => setSelectedDocumentForReview(docId)} />
          )}
          
          {currentView === 'chat' && (
            <AIChat documents={documents} />
          )}
          
          {currentView === 'validation' && (
            <ValidationDashboard />
          )}
          
          {currentView === 'mindmap' && (
            <MindMapCanvas />
          )}
          
          {currentView === 'status' && (
            <SystemStatus />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;