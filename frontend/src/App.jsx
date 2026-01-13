import { useState, useEffect } from 'react';
import FileUploader from "./components/Fileuploader";
import ValidationDashboard from "./components/ValidationDashboard";
import DocumentHistory from "./components/DocumentHistory";
import DocumentSummaryCard from "./components/DocumentSummaryCard";
import AIChat from "./components/AIChat";
import ComprehensiveDocumentReview from "./components/ComprehensiveDocumentReview";
import WebAnalyzer from "./components/WebAnalyzer";
import SystemStatus from "./components/SystemStatus";
import MindMapCanvas from "./components/MindMapCanvas";
import API from "./api/api";
import './main.css';

function App() {
  const [currentView, setCurrentView] = useState('upload');
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentForReview, setSelectedDocumentForReview] = useState(null);

  // Load documents for chat
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const response = await API.get('/documents');
        setDocuments(response.data.documents || []);
      } catch (error) {
        console.error('Failed to load documents:', error);
      }
    };
    
    if (currentView === 'chat') {
      loadDocuments();
    }
  }, [currentView]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Left Sidebar Navigation */}
      <aside style={{
        width: '280px',
        minHeight: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
        background: 'rgba(17, 24, 39, 0.8)',
        backdropFilter: 'blur(10px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Logo / Brand */}
        <div style={{
          padding: '15px',
          background: 'rgba(102, 126, 234, 0.1)',
          borderRadius: '16px',
          border: '1px solid rgba(102, 126, 234, 0.2)',
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
            margin: '0 auto 10px'
          }}>
            🤖
          </div>
          <h1 style={{ 
            margin: 0, 
            fontSize: '20px',
            background: 'var(--primary-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: '600'
          }}>
            TeachAI
          </h1>
          <p style={{ 
            margin: '4px 0 0 0', 
            color: 'var(--text-secondary)', 
            fontSize: '12px' 
          }}>
            Document Intelligence
          </p>
        </div>

        {/* Navigation Buttons */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <NavButton
            icon="📥"
            label="Upload & Analysis"
            active={currentView === 'upload'}
            onClick={() => setCurrentView('upload')}
          />
          
          <NavButton
            icon="📚"
            label="Document History"
            active={currentView === 'history'}
            onClick={() => setCurrentView('history')}
          />
          
          <NavButton
            icon="💬"
            label="AI Chat"
            active={currentView === 'chat'}
            onClick={() => setCurrentView('chat')}
          />
          
          <NavButton
            icon="🔍"
            label="Validation Dashboard"
            active={currentView === 'validation'}
            onClick={() => setCurrentView('validation')}
          />
          
          <NavButton
            icon="🔧"
            label="System Status"
            active={currentView === 'status'}
            onClick={() => setCurrentView('status')}
          />

          <NavButton
            icon="🧠"
            label="Mind Map"
            active={currentView === 'mindmap'}
            onClick={() => setCurrentView('mindmap')}
          />
        </nav>

        {/* Footer Info */}
        <div style={{
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '10px',
          fontSize: '11px',
          color: '#888',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '4px' }}>Powered by AI</div>
          <div style={{ fontSize: '10px' }}>v1.0.0</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ 
        flex: 1, 
        padding: '30px',
        overflowY: 'auto',
        maxHeight: '100vh'
      }}>
        {/* Upload & Web Analysis */}
        <div style={{ display: currentView === 'upload' ? 'block' : 'none' }} className="animate-slideInLeft">
          <div className="glass-card" style={{
            padding: '25px',
            borderRadius: '20px',
            marginBottom: '30px'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h2 style={{ 
                fontSize: '24px', 
                marginBottom: '8px',
                background: 'var(--primary-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                📄 Document & Web Analysis
              </h2>
              <p style={{ 
                color: 'var(--text-secondary)', 
                fontSize: '14px',
                maxWidth: '700px',
                margin: '0 auto 20px'
              }}>
                Upload documents or enter web/PDF URLs for intelligent AI analysis
              </p>
              
              {/* Upload Document Button */}
              <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                <FileUploader onViewHistory={(docId) => {
                  setSelectedDocumentForReview(docId);
                  setCurrentView('review');
                }} />
              </div>
            </div>

            {/* Web Analysis Section */}
            <div style={{
              padding: '20px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '15px', color: '#e5e7eb', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🌐 Web / PDF URL
              </h3>
              <WebAnalyzer />
            </div>

          </div>

          <div className="glass-card" style={{
            padding: '25px',
            borderRadius: '20px',
          }}>
            <h3 style={{ 
              marginBottom: '25px', 
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}>
              <span style={{
                width: '30px',
                height: '30px',
                background: 'var(--secondary-gradient)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                🔄
              </span>
              Processing Workflow
            </h3>
            
            {/* Horizontal Flow */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              overflowX: 'auto',
              padding: '10px 0'
            }}>
              {[
                { icon: '📤', title: 'Upload / Input', desc: 'Secure document upload or web URL' },
                { icon: '🧠', title: 'AI Analysis', desc: 'Extract & summarize content' },
                { icon: '📊', title: 'Confidence Check', desc: 'Flag low confidence items' },
                { icon: '👤', title: 'Human Validation', desc: 'Review and edit analysis' },
                { icon: '🔗', title: 'Vectorization', desc: 'Create searchable vectors' },
                { icon: '🔍', title: 'Smart Search', desc: 'Natural language queries' }
              ].map((step, index, array) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Node */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '15px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    minWidth: '140px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.transform = 'translateY(0px)';
                    e.currentTarget.style.boxShadow = 'none';
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
                      marginBottom: '10px'
                    }}>
                      {step.icon}
                    </div>
                    <div style={{ 
                      fontWeight: '600', 
                      marginBottom: '4px',
                      textAlign: 'center',
                      fontSize: '13px'
                    }}>
                      {step.title}
                    </div>
                    <div style={{ 
                      color: 'var(--text-secondary)', 
                      fontSize: '11px',
                      textAlign: 'center',
                      lineHeight: '1.3'
                    }}>
                      {step.desc}
                    </div>
                  </div>
                  
                  {/* Arrow between nodes */}
                  {index < array.length - 1 && (
                    <div style={{
                      fontSize: '20px',
                      color: 'var(--text-secondary)',
                      flexShrink: 0
                    }}>
                      →
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Document History */}
        <div style={{ display: currentView === 'history' ? 'block' : 'none' }}>
          <div className="glass-card" style={{
            padding: '30px',
            borderRadius: '20px',
            maxWidth: '1000px',
            margin: '0 auto'
          }}>
            <h2 style={{ 
              fontSize: '24px', 
              marginBottom: '20px',
              background: 'var(--primary-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textAlign: 'center'
            }}>
              📚 Document History
            </h2>
            
            <DocumentHistory onReview={(docId) => {
              setSelectedDocumentForReview(docId);
              setCurrentView('review');
            }} />
          </div>
        </div>
        
        {/* AI Chat */}
        <div style={{ display: currentView === 'chat' ? 'block' : 'none' }}>
          <AIChat documents={documents} />
        </div>
        
        {/* Comprehensive Review */}
        {selectedDocumentForReview && (
          <div style={{ display: currentView === 'review' ? 'block' : 'none' }}>
            <ComprehensiveDocumentReview 
              documentId={selectedDocumentForReview} 
              onClose={() => {
                setCurrentView('history');
                setSelectedDocumentForReview(null);
              }}
            />
          </div>
        )}
        
        {/* Mind Map */}
        <div style={{ display: currentView === 'mindmap' ? 'block' : 'none' }}>
          <MindMapCanvas />
        </div>
        
        {/* System Status */}
        <div style={{ display: currentView === 'status' ? 'block' : 'none' }}>
          <SystemStatus />
        </div>
        
        {/* Validation Dashboard */}
        <div style={{ display: currentView === 'validation' ? 'block' : 'none' }}>
          <ValidationDashboard />
        </div>
      </main>
    </div>
  );
}

// Navigation Button Component
const NavButton = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      background: active 
        ? 'linear-gradient(135deg, #667eea, #764ba2)' 
        : 'rgba(255, 255, 255, 0.05)',
      border: active 
        ? '1px solid rgba(102, 126, 234, 0.5)'
        : '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '10px',
      color: active ? '#fff' : '#ccc',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: active ? '600' : '500',
      transition: 'all 0.2s ease',
      textAlign: 'left',
      width: '100%'
    }}
    onMouseEnter={(e) => {
      if (!active) {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
        e.currentTarget.style.color = '#fff';
        e.currentTarget.style.transform = 'translateX(4px)';
      }
    }}
    onMouseLeave={(e) => {
      if (!active) {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
        e.currentTarget.style.color = '#ccc';
        e.currentTarget.style.transform = 'translateX(0)';
      }
    }}
  >
    <span style={{ fontSize: '20px' }}>{icon}</span>
    <span style={{ flex: 1 }}>{label}</span>
  </button>
);

export default App;