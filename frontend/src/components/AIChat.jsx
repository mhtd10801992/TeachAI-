import { useState, useRef, useEffect } from 'react';
import API from '../api/api';
import mermaid from 'mermaid';

// Initialize mermaid
mermaid.initialize({ startOnLoad: false, theme: 'default' });

export default function AIChat({ documents }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedDocs, setSelectedDocs] = useState([]); // Support multiple docs
  const [searchMode, setSearchMode] = useState('single'); // 'single' or 'all'
  const [showPreview, setShowPreview] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [useMetadata, setUseMetadata] = useState(true); // Enable metadata queries
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [metadataContext, setMetadataContext] = useState(null);
  const messagesEndRef = useRef(null);

  // Mermaid and DOE state
  const [mermaidCode, setMermaidCode] = useState('');
  const [mermaidLoading, setMermaidLoading] = useState(false);
  const [mermaidError, setMermaidError] = useState(null);
  const [doeFactors, setDoeFactors] = useState([]);
  const [doeLoading, setDoeLoading] = useState(false);
  const [doeError, setDoeError] = useState(null);

  // Fetch Mermaid graph for selected document
  const handleGenerateMermaid = async () => {
    setMermaidLoading(true);
    setMermaidError(null);
    setMermaidCode('');
    try {
      const docText = (selectedDoc?.document?.text || selectedDoc?.text || '');
      if (!docText) throw new Error('No document text available.');
      const res = await API.post('/ai/mermaid-graph', { text: docText });
      if (res.data && res.data.success) {
        setMermaidCode(res.data.code);
      } else {
        setMermaidError('No Mermaid code generated.');
      }
    } catch (err) {
      setMermaidError('Failed to generate Mermaid diagram.');
    } finally {
      setMermaidLoading(false);
    }
  };

  // Fetch DOE factors for selected document
  const handleGenerateDOE = async () => {
    setDoeLoading(true);
    setDoeError(null);
    setDoeFactors([]);
    try {
      const docText = (selectedDoc?.document?.text || selectedDoc?.text || '');
      if (!docText) throw new Error('No document text available.');
      const res = await API.post('/ai/doe-factors', { text: docText });
      if (res.data && res.data.success) {
        setDoeFactors(res.data.factors);
      } else {
        setDoeError('No DOE factors found.');
      }
    } catch (err) {
      setDoeError('Failed to extract DOE factors.');
    } finally {
      setDoeLoading(false);
    }
  };

  // Query metadata for document context
  const queryDocumentMetadata = async (docId, query, limit = 5) => {
    try {
      console.log(`🔍 Querying metadata for doc ${docId}: "${query}"`);
      const response = await API.post(`/metadata/documents/${docId}/metadata/query`, {
        query: query,
        limit: limit
      });
      
      if (response.data && response.data.success) {
        console.log('✅ Metadata query successful:', response.data);
        return response.data.results;
      }
      return null;
    } catch (error) {
      console.warn('⚠️ Metadata query failed:', error.message);
      return null;
    }
  };

  // Get full metadata for document
  const getDocumentMetadata = async (docId) => {
    try {
      const response = await API.get(`/metadata/documents/${docId}/metadata`);
      if (response.data && response.data.success) {
        return response.data.metadata;
      }
      return null;
    } catch (error) {
      console.warn('⚠️ Failed to get document metadata:', error.message);
      return null;
    }
  };

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
    setMetadataContext(null);

    try {
      let context;
      let metadataQueryResults = null;

      // Query metadata if enabled and document is selected
      if (useMetadata && selectedDoc) {
        setMetadataLoading(true);
        const docId = selectedDoc.document?.id || selectedDoc.id;
        metadataQueryResults = await queryDocumentMetadata(docId, input, 5);
        setMetadataContext(metadataQueryResults);
        setMetadataLoading(false);
      }

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
          })),
          summarize: true,
          metadataContext: metadataQueryResults
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
          sentiment: docData.analysis?.sentiment,
          summarize: true,
          metadataContext: metadataQueryResults
        };
      } else {
        // General query without document context
        context = {
          mode: 'general',
          filename: 'General Query',
          summary: 'No specific document selected',
          summarize: true
        };
      }

      const response = await API.post('/ai/ask', {
        text: input,
        options: context
      });


      const aiResult = response.data.result;
      let aiContent;
      if (typeof aiResult === 'string') {
        aiContent = aiResult;
      } else if (aiResult) {
        aiContent = (
          <div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Summary:</strong> {aiResult.summary || <em>No summary available.</em>}
            </div>
            {Array.isArray(aiResult.topics) && aiResult.topics.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Topics:</strong> {aiResult.topics.join(', ')}
              </div>
            )}
            {Array.isArray(aiResult.entities) && aiResult.entities.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Entities:</strong> {aiResult.entities.map(e => e.name || e).join(', ')}
              </div>
            )}
            {aiResult.sentiment && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Sentiment:</strong> {aiResult.sentiment}
              </div>
            )}
            {/* Hide embeddings/chunks for chat */}
          </div>
        );
      } else {
        aiContent = 'No answer returned.';
      }
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: aiContent,
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

          {/* Metadata Context Toggle */}
          {selectedDoc && (
            <button
              onClick={() => setUseMetadata(!useMetadata)}
              className={useMetadata ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ 
                width: '100%', 
                padding: '8px', 
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
              title={useMetadata ? 'Metadata context enabled' : 'Metadata context disabled'}
            >
              {useMetadata ? '✅' : '⭕'} Document Context
              {metadataLoading && ' (loading...)'}
            </button>
          )}

          {/* Metadata Query Results Display */}
          {metadataContext && (
            <div style={{
              padding: '10px',
              background: 'rgba(34, 197, 94, 0.1)',
              borderRadius: '6px',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              fontSize: '12px',
              maxHeight: '100px',
              overflowY: 'auto'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '4px', color: '#22c55e' }}>
                📍 Found {metadataContext.relevantSections?.length || 0} relevant sections
              </div>
              {metadataContext.matchingTopics && metadataContext.matchingTopics.length > 0 && (
                <div style={{ fontSize: '11px', marginBottom: '4px' }}>
                  Topics: {metadataContext.matchingTopics.slice(0, 3).join(', ')}
                </div>
              )}
              {metadataContext.evidence && metadataContext.evidence.length > 0 && (
                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.8)' }}>
                  Evidence available from {metadataContext.evidence.length} location(s)
                </div>
              )}
            </div>
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

    {/* --- Mermaid & DOE Section Below Chat --- */}
    <div style={{
      margin: '40px auto 0 auto',
      maxWidth: 800,
      background: 'rgba(99, 102, 241, 0.07)',
      border: '1px solid rgba(99, 102, 241, 0.15)',
      borderRadius: '18px',
      padding: '28px 32px',
      boxShadow: '0 2px 12px 0 rgba(99,102,241,0.04)'
    }}>
      <h3 style={{ margin: '0 0 18px 0', color: '#6366f1' }}>🔗 Document Relationship & DOE Tools</h3>
      <div style={{ display: 'flex', gap: '18px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={handleGenerateMermaid} disabled={!selectedDoc || mermaidLoading}>
          {mermaidLoading ? 'Generating...' : 'Generate Mermaid Diagram'}
        </button>
        <button className="btn btn-primary" onClick={handleGenerateDOE} disabled={!selectedDoc || doeLoading}>
          {doeLoading ? 'Extracting...' : 'Extract DOE Factor List'}
        </button>
      </div>
      {/* Mermaid Output */}
      {mermaidError && <div style={{ color: '#ef4444', marginBottom: '10px' }}>{mermaidError}</div>}
      {mermaidCode && (
        <div style={{ marginBottom: '18px' }}>
          <h4 style={{ color: '#6366f1', margin: '0 0 8px 0' }}>Mermaid Diagram (Live)</h4>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '16px', marginBottom: '10px', overflowX: 'auto' }}>
            <MermaidDiagram chart={mermaidCode} />
          </div>
          <h4 style={{ color: '#6366f1', margin: '12px 0 8px 0' }}>Mermaid Diagram Code</h4>
          <pre style={{ background: '#18181b', color: '#a5b4fc', padding: '16px', borderRadius: '10px', fontSize: '14px', overflowX: 'auto' }}>{mermaidCode}</pre>
        </div>
      )}
      {/* DOE Output */}
      {doeError && <div style={{ color: '#ef4444', marginBottom: '10px' }}>{doeError}</div>}
      {doeFactors.length > 0 && (
        <div>
          <h4 style={{ color: '#6366f1', margin: '0 0 8px 0' }}>DOE Factor List</h4>
          <table style={{ width: '100%', background: '#18181b', color: '#a5b4fc', borderRadius: '10px', fontSize: '14px', marginBottom: '10px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Levels</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {doeFactors.map((factor, idx) => (
                <tr key={idx}>
                  <td style={{ padding: '8px' }}>{factor.name}</td>
                  <td style={{ padding: '8px' }}>{Array.isArray(factor.levels) ? factor.levels.join(', ') : factor.levels}</td>
                  <td style={{ padding: '8px' }}>{factor.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </div>
  );
}

// Mermaid component for rendering diagrams
function MermaidDiagram({ chart }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && chart) {
      ref.current.removeAttribute('data-processed');
      ref.current.innerHTML = chart;
      mermaid.contentLoaded();
    }
  }, [chart]);

  return <div ref={ref} className="mermaid"></div>;
}
