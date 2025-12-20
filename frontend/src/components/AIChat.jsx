import { useState, useRef, useEffect } from 'react';
import API from '../api/api';

export default function AIChat({ documents }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      const context = selectedDoc ? {
        filename: selectedDoc.filename,
        summary: selectedDoc.analysis?.summary?.text,
        topics: selectedDoc.analysis?.topics?.items || [],
        entities: selectedDoc.analysis?.entities?.items || [],
        sentiment: selectedDoc.analysis?.sentiment
      } : {
        filename: 'General Query',
        summary: 'No specific document selected'
      };

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
    <div className="glass-card" style={{
      padding: '0',
      borderRadius: '20px',
      height: '700px',
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
        {documents && documents.length > 0 && (
          <select
            value={selectedDoc?.id || ''}
            onChange={(e) => {
              const doc = documents.find(d => d.id === e.target.value);
              setSelectedDoc(doc);
            }}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}
          >
            <option value="">General questions (no document selected)</option>
            {documents.map(doc => (
              <option key={doc.id} value={doc.id}>
                📄 {doc.filename}
              </option>
            ))}
          </select>
        )}
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
  );
}
