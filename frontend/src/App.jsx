import { useState, useEffect } from 'react';
import FileUploader from "./components/Fileuploader";
import ValidationDashboard from "./components/ValidationDashboard";
import DocumentHistory from "./components/DocumentHistory";
import DocumentSummaryCard from "./components/DocumentSummaryCard";
import AIChat from "./components/AIChat";
import ComprehensiveDocumentReview from "./components/ComprehensiveDocumentReview";
import WebAnalyzer from "./components/WebAnalyzer";
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
    <div style={{ minHeight: '100vh' }}>
      {/* Navigation */}
      <nav className="glass-card animate-fadeInUp" style={{
        margin: '20px',
        marginBottom: '30px',
        padding: '20px 30px',
        borderRadius: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              background: 'var(--primary-gradient)',
              borderRadius: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              🤖
            </div>
            <div>
              <h1 style={{ 
                margin: 0, 
                fontSize: '24px',
                background: 'var(--primary-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                TeachAI
              </h1>
              <p style={{ 
                margin: 0, 
                color: 'var(--text-secondary)', 
                fontSize: '14px' 
              }}>
                Document Intelligence Platform
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => setCurrentView('upload')}
              className={currentView === 'upload' ? 'btn btn-primary' : 'btn btn-secondary'}
            >
              📥 Upload & Web Analysis
            </button>
            
            <button
              onClick={() => setCurrentView('history')}
              className={currentView === 'history' ? 'btn btn-primary' : 'btn btn-secondary'}
            >
              📚 Document History
            </button>
            
            <button
              onClick={() => setCurrentView('chat')}
              className={currentView === 'chat' ? 'btn btn-primary' : 'btn btn-secondary'}
            >
              💬 AI Chat
            </button>
            
            <button
              onClick={() => setCurrentView('validation')}
              className={currentView === 'validation' ? 'btn btn-primary' : 'btn btn-secondary'}
            >
              🔍 Validation Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div style={{ padding: '0 20px', paddingBottom: '40px' }}>
        {currentView === 'upload' ? (
          <div className="animate-slideInLeft">
            <div className="glass-card" style={{
              padding: '30px',
              borderRadius: '24px',
              marginBottom: '30px'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h2 style={{ 
                  fontSize: '32px', 
                  marginBottom: '12px',
                  background: 'var(--primary-gradient)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  📄 Document & Web Analysis
                </h2>
                <p style={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: '16px',
                  maxWidth: '600px',
                  margin: '0 auto',
                  lineHeight: '1.8'
                }}>
                  Upload documents or enter web/PDF URLs for intelligent AI analysis. 
                  Our system extracts key information, summarizes content, and identifies topics.
                </p>
              </div>

              {/* Combined Interface */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                
                {/* Left Column: File Upload */}
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '15px', color: '#e5e7eb' }}>
                    📤 Upload File
                  </h3>
                  <FileUploader />
                </div>

                {/* Right Column: Web Analysis */}
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '15px', color: '#e5e7eb' }}>
                    🌐 Web / PDF Link
                  </h3>
                  <WebAnalyzer />
                </div>

              </div>

            </div>

            <div className="glass-card" style={{
              padding: '25px',
              borderRadius: '20px',
            }}>
              <h3 style={{ 
                marginBottom: '20px', 
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
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
              <div style={{ display: 'grid', gap: '15px' }}>
                {[
                  { icon: '📤', title: 'Upload / Input', desc: 'Secure document upload or web URL analysis' },
                  { icon: '🧠', title: 'AI Analysis', desc: 'Extract text, summarize, identify topics and entities' },
                  { icon: '📊', title: 'Confidence Check', desc: 'Low confidence items flagged for review' },
                  { icon: '👤', title: 'Human Validation', desc: 'Review and edit AI analysis if needed' },
                  { icon: '🔗', title: 'Vectorization', desc: 'Convert approved content to searchable vectors' },
                  { icon: '🔍', title: 'Smart Search', desc: 'Ask natural language questions about documents' }
                ].map((step, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    padding: '15px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.transform = 'translateX(5px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.transform = 'translateX(0px)';
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: 'var(--primary-gradient)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      flexShrink: 0
                    }}>
                      {step.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                        {index + 1}. {step.title}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {step.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : currentView === 'history' ? (
          <DocumentHistory onReview={(docId) => {
            setSelectedDocumentForReview(docId);
            setCurrentView('review');
          }} />
        ) : currentView === 'chat' ? (
          <AIChat documents={documents} />
        ) : currentView === 'review' && selectedDocumentForReview ? (
          <ComprehensiveDocumentReview 
            documentId={selectedDocumentForReview} 
            onClose={() => {
              setCurrentView('history');
              setSelectedDocumentForReview(null);
            }}
          />
        ) : (
          <ValidationDashboard />
        )}
      </div>
    </div>
  );
}

export default App;