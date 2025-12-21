import { useState, useRef, useEffect } from 'react';
import API from '../api/api';

export default function AIChat({ documents }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedDocs, setSelectedDocs] = useState([]); // Support multiple docs
  const [searchMode, setSearchMode] = useState('single'); // 'single' or 'all'
  const [showPreview, setShowPreview] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Log available documents for debugging
    console.log('📚 Available documents in chat:', documents?.length || 0);
    if (documents && documents.length > 0) {
      console.log('Documents:', documents.map(d => d.document?.filename || d.filename));
    }
  }, [documents]);

  // Get unique categories from documents
  const categories = documents && documents.length > 0 
    ? ['all', ...new Set(documents.map(d => d.category || 'General'))]
    : ['all'];

  // Filter documents by category
  const filteredDocuments = selectedCategory === 'all' 
    ? documents 
    : documents?.filter(d => (d.category || 'General') === selectedCategory);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      let context;
      
      if (searchMode === 'all' && filteredDocuments && filteredDocuments.length > 0) {
        // Search across all documents (or filtered by category)
        context = {
          mode: 'all',
          documentCount: filteredDocuments.length,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          documents: filteredDocuments.map(doc => ({
            id: doc.document?.id || doc.id,
            filename: doc.document?.filename || doc.filename,
            summary: doc.document?.analysis?.summary?.text || doc.analysis?.summary?.text,
            topics: doc.document?.analysis?.topics?.items || doc.analysis?.topics?.items || [],
            entities: doc.document?.analysis?.entities?.items || doc.analysis?.entities?.items || [],
            category: doc.category
          }))
        };
      } else if (selectedDoc) {
        // Single document mode
        const docData = selectedDoc.document || selectedDoc;
        context = {
          mode: 'single',
          filename: docData.filename,
          summary: docData.analysis?.summary?.text,
          topics: docData.analysis?.topics?.items || [],
          entities: docData.analysis?.entities?.items || [],
          sentiment: docData.analysis?.sentiment
        };
      } else {
        // General query without document context
        context = {
          mode: 'general',
          filename: 'General Query',
          summary: 'No specific document selected'
        };
      }

      const response = await API.post('/ai/ask', {
        question: input,
        context: context
      });

      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.data.answer,
        timestamp: new Date().toISOString(),
        usage: response.data.usage
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: '700px' }}>
      {/* Document Preview Panel (Left Side) */}
      {showPreview && selectedDoc && (
        <div className="glass-card" style={{
          width: '350px',
          padding: '20px',
          borderRadius: '20px',
          overflowY: 'auto',
          flexShrink: 0
        }}>
          <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '16px' }}>📄 Document Preview</h4>
            <button
              onClick={() => setShowPreview(false)}
              className="btn btn-secondary"
              style={{ padding: '4px 8px', fontSize: '12px' }}
            >
              ✕
            </button>
          </div>
          
          {(() => {
            const docData = selectedDoc.document || selectedDoc;
            return (
              <>
                <div style={{
                  padding: '12px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  borderRadius: '8px',
                  marginBottom: '15px'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                    {docData.filename}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Category: {selectedDoc.category || 'General'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Size: {(docData.size / 1024).toFixed(2)} KB
                  </div>
                </div>

                {docData.analysis?.summary?.text && (
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                      📝 Summary
                    </div>
                    <div style={{
                      padding: '10px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      lineHeight: '1.6'
                    }}>
                      {docData.analysis.summary.text}
                    </div>
                  </div>
                )}

                {docData.analysis?.topics?.items && (
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                      🏷️ Topics
                    </div>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px'
                    }}>
                      {(typeof docData.analysis.topics.items === 'string' 
                        ? docData.analysis.topics.items.split(/[,\n]/).map(t => t.trim())
                        : docData.analysis.topics.items
                      ).slice(0, 5).map((topic, i) => (
                        <span key={i} style={{
                          padding: '4px 8px',
                          background: 'rgba(99, 102, 241, 0.2)',
                          borderRadius: '4px',
                          fontSize: '11px'
                        }}>
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {docData.analysis?.sentiment && (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                      😊 Sentiment
                    </div>
                    <div style={{
                      padding: '8px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}>
                      {docData.analysis.sentiment.value} ({Math.round(docData.analysis.sentiment.confidence * 100)}% confidence)
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Chat Panel */}
      <div className="glass-card" style={{
        flex: 1,
        padding: '0',
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
      {/* Header */}
      <div style={{
        padding: '20px 25px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'var(--primary-gradient)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            💬
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '20px' }}>AI Assistant</h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
              Ask questions about your documents
            </p>
          </div>
          <button
            onClick={clearChat}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            🗑️ Clear
          </button>
        </div>

        {/* Document Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Search Mode Toggle */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setSearchMode('single')}
              className={searchMode === 'single' ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ flex: 1, padding: '8px', fontSize: '13px' }}
            >
              📄 Single Document
            </button>
            <button
              onClick={() => setSearchMode('all')}
              className={searchMode === 'all' ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ flex: 1, padding: '8px', fontSize: '13px' }}
            >
              📚 All Documents
            </button>
          </div>

          {/* Category Filter */}
          {categories.length > 2 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--text-primary)',
                fontSize: '13px'
              }}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? '📁 All Categories' : `📂 ${cat}`}
                </option>
              ))}
            </select>
          )}

          {/* Document Selector (only shown in single mode) */}
          {searchMode === 'single' && filteredDocuments && filteredDocuments.length > 0 && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={selectedDoc?.document?.id || selectedDoc?.id || ''}
                onChange={(e) => {
                  const doc = filteredDocuments.find(d => 
                    (d.document?.id || d.id) === e.target.value
                  );
                  setSelectedDoc(doc);
                  if (doc) setShowPreview(true);
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              >
                <option value="">Select a document...</option>
                {filteredDocuments.map(doc => {
                  const docData = doc.document || doc;
                  return (
                    <option key={docData.id} value={docData.id}>
                      📄 {docData.filename}
                    </option>
                  );
                })}
              </select>
              {selectedDoc && !showPreview && (
                <button
                  onClick={() => setShowPreview(true)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '13px' }}
                  title="Show document preview"
                >
                  👁️
                </button>
              )}
            </div>
          )}

          {/* Status Display */}
          {documents && documents.length > 0 && (
            <div style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontSize: '12px',
              color: '#10b981'
            }}>
              {searchMode === 'all' ? (
                <>✅ Searching across {filteredDocuments?.length || documents.length} document{(filteredDocuments?.length || documents.length) !== 1 ? 's' : ''}{selectedCategory !== 'all' ? ` in ${selectedCategory}` : ''}</>
              ) : selectedDoc ? (
                <>✅ Selected: {(selectedDoc.document || selectedDoc).filename}</>
              ) : (
                <>💡 Select a document or switch to "All Documents" mode</>
              )}
            </div>
          )}

          {(!documents || documents.length === 0) && (
            <div style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              fontSize: '12px',
              color: '#fbbf24'
            }}>
              ⚠️ No documents uploaded yet. Upload documents to analyze them.
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '20px',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ fontSize: '64px', opacity: 0.5 }}>🤖</div>
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
                Start a Conversation
              </h4>
              <p style={{ margin: 0, fontSize: '14px' }}>
                Ask me anything about your documents or general questions
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              <button
                onClick={() => setInput('What are the main topics in this document?')}
                className="btn btn-secondary"
                style={{ fontSize: '13px', padding: '8px 14px' }}
              >
                📋 Main topics
              </button>
              <button
                onClick={() => setInput('Summarize the key points')}
                className="btn btn-secondary"
                style={{ fontSize: '13px', padding: '8px 14px' }}
              >
                ✨ Key points
              </button>
              <button
                onClick={() => setInput('What are the important dates mentioned?')}
                className="btn btn-secondary"
                style={{ fontSize: '13px', padding: '8px 14px' }}
              >
                📅 Important dates
              </button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  flexDirection: message.role === 'user' ? 'row-reverse' : 'row'
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: message.role === 'user' 
                    ? 'var(--primary-gradient)' 
                    : 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  flexShrink: 0
                }}>
                  {message.role === 'user' ? '👤' : '🤖'}
                </div>
                <div style={{
                  flex: 1,
                  maxWidth: '80%'
                }}>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: message.role === 'user'
                      ? 'rgba(99, 102, 241, 0.2)'
                      : 'rgba(0, 0, 0, 0.3)',
                    border: message.isError 
                      ? '1px solid var(--error)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {message.content}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    marginTop: '4px',
                    textAlign: message.role === 'user' ? 'right' : 'left'
                  }}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px'
                }}>
                  🤖
                </div>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              resize: 'none',
              minHeight: '50px',
              maxHeight: '120px',
              fontFamily: 'inherit'
            }}
            rows="1"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="btn btn-primary"
            style={{
              padding: '12px 24px',
              minWidth: '80px',
              height: '50px'
            }}
          >
            {loading ? '⏳' : '📤'}
          </button>
        </div>
        <p style={{
          margin: '8px 0 0 0',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          textAlign: 'center'
        }}>
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
    </div>
  );
}
