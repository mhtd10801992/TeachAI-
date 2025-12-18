import React, { useState } from 'react';
import { aiService } from '../services/aiService.js';

export default function AnalysisEditor({ document, onSave, onCancel }) {
  const [editedAnalysis, setEditedAnalysis] = useState({
    summary: {
      text: document.analysis?.summary?.text || '',
      confidence: document.analysis?.summary?.confidence || 0.5
    },
    topics: {
      items: document.analysis?.topics?.items || [],
      confidence: document.analysis?.topics?.confidence || 0.5
    },
    entities: {
      items: document.analysis?.entities?.items || [],
      confidence: document.analysis?.entities?.confidence || 0.5
    },
    sentiment: {
      value: document.analysis?.sentiment?.value || 'neutral',
      confidence: document.analysis?.sentiment?.confidence || 0.5
    }
  });

  const [newTopic, setNewTopic] = useState('');
  const [newEntity, setNewEntity] = useState({ name: '', type: '' });
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  const handleSummaryChange = (text) => {
    setEditedAnalysis(prev => ({
      ...prev,
      summary: { ...prev.summary, text }
    }));
  };

  const addTopic = () => {
    if (newTopic.trim()) {
      setEditedAnalysis(prev => ({
        ...prev,
        topics: {
          ...prev.topics,
          items: [...prev.topics.items, newTopic.trim()]
        }
      }));
      setNewTopic('');
    }
  };

  const removeTopic = (index) => {
    setEditedAnalysis(prev => ({
      ...prev,
      topics: {
        ...prev.topics,
        items: prev.topics.items.filter((_, i) => i !== index)
      }
    }));
  };

  const addEntity = () => {
    if (newEntity.name.trim() && newEntity.type.trim()) {
      setEditedAnalysis(prev => ({
        ...prev,
        entities: {
          ...prev.entities,
          items: [...prev.entities.items, { ...newEntity }]
        }
      }));
      setNewEntity({ name: '', type: '' });
    }
  };

  const removeEntity = (index) => {
    setEditedAnalysis(prev => ({
      ...prev,
      entities: {
        ...prev.entities,
        items: prev.entities.items.filter((_, i) => i !== index)
      }
    }));
  };

  const updateConfidence = (section, confidence) => {
    setEditedAnalysis(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        confidence: confidence / 100
      }
    }));
  };

  const handleSave = () => {
    const updatedDocument = {
      ...document,
      analysis: editedAnalysis,
      updatedAt: new Date().toISOString(),
      humanReviewed: true
    };
    onSave(updatedDocument);
  };

  const askAI = async () => {
    if (!aiQuestion.trim()) return;
    
    setIsAsking(true);
    try {
      // Call the real AI service
      const response = await aiService.askQuestion(document, aiQuestion);
      setAiResponse(response);
    } catch (error) {
      console.error('AI Error:', error);
      setAiResponse(error.message || 'Sorry, I encountered an error while processing your question. Please try again.');
    } finally {
      setIsAsking(false);
    }
  };

  const clearAIChat = () => {
    setAiQuestion('');
    setAiResponse('');
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div className="glass-card" style={{
        padding: '25px',
        borderRadius: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ 
              margin: 0, 
              marginBottom: '8px',
              background: 'var(--primary-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              🔍 Review & Edit AI Analysis
            </h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              {document.filename} • Make corrections to improve accuracy
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onCancel} className="btn btn-secondary">
              ❌ Cancel
            </button>
            <button onClick={handleSave} className="btn btn-success">
              ✅ Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Document Summary Editor */}
      <div className="glass-card" style={{
        padding: '25px',
        borderRadius: '16px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'var(--primary-gradient)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            📋
          </div>
          <h3 style={{ margin: 0 }}>Document Summary</h3>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Confidence:
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={editedAnalysis.summary.confidence * 100}
              onChange={(e) => updateConfidence('summary', e.target.value)}
              style={{ width: '100px' }}
            />
            <span style={{ fontSize: '12px', fontWeight: '600' }}>
              {Math.round(editedAnalysis.summary.confidence * 100)}%
            </span>
          </div>
        </div>
        
        <textarea
          value={editedAnalysis.summary.text}
          onChange={(e) => handleSummaryChange(e.target.value)}
          className="textarea"
          placeholder="Enter a summary of the document..."
          style={{
            width: '100%',
            minHeight: '120px',
            resize: 'vertical'
          }}
        />
      </div>

      {/* Topics Editor */}
      <div className="glass-card" style={{
        padding: '25px',
        borderRadius: '16px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'var(--primary-gradient)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            🏷️
          </div>
          <h3 style={{ margin: 0 }}>Topics</h3>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Confidence:
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={editedAnalysis.topics.confidence * 100}
              onChange={(e) => updateConfidence('topics', e.target.value)}
              style={{ width: '100px' }}
            />
            <span style={{ fontSize: '12px', fontWeight: '600' }}>
              {Math.round(editedAnalysis.topics.confidence * 100)}%
            </span>
          </div>
        </div>

        {/* Existing Topics */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
          {editedAnalysis.topics.items.map((topic, index) => (
            <div key={index} style={{
              background: 'var(--primary-gradient)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {topic}
              <button
                onClick={() => removeTopic(index)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Add New Topic */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder="Add new topic..."
            className="input"
            style={{ flex: 1 }}
            onKeyPress={(e) => e.key === 'Enter' && addTopic()}
          />
          <button onClick={addTopic} className="btn btn-primary">
            + Add Topic
          </button>
        </div>
      </div>

      {/* Entities Editor */}
      <div className="glass-card" style={{
        padding: '25px',
        borderRadius: '16px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'var(--primary-gradient)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            🎯
          </div>
          <h3 style={{ margin: 0 }}>Key Entities</h3>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Confidence:
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={editedAnalysis.entities.confidence * 100}
              onChange={(e) => updateConfidence('entities', e.target.value)}
              style={{ width: '100px' }}
            />
            <span style={{ fontSize: '12px', fontWeight: '600' }}>
              {Math.round(editedAnalysis.entities.confidence * 100)}%
            </span>
          </div>
        </div>

        {/* Existing Entities */}
        <div style={{ display: 'grid', gap: '8px', marginBottom: '15px' }}>
          {editedAnalysis.entities.items.map((entity, index) => (
            <div key={index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 15px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontWeight: '500' }}>{entity.name}</span>
                <span style={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  fontWeight: '600',
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '2px 6px',
                  borderRadius: '8px'
                }}>
                  {entity.type}
                </span>
              </div>
              <button
                onClick={() => removeEntity(index)}
                className="btn btn-danger"
                style={{ padding: '5px 10px', fontSize: '12px' }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Add New Entity */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={newEntity.name}
            onChange={(e) => setNewEntity(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Entity name..."
            className="input"
            style={{ flex: 2 }}
          />
          <select
            value={newEntity.type}
            onChange={(e) => setNewEntity(prev => ({ ...prev, type: e.target.value }))}
            className="select"
            style={{ flex: 1 }}
          >
            <option value="">Select type...</option>
            <option value="PERSON">Person</option>
            <option value="ORGANIZATION">Organization</option>
            <option value="LOCATION">Location</option>
            <option value="DATE">Date</option>
            <option value="MONEY">Money</option>
            <option value="CONCEPT">Concept</option>
            <option value="METRIC">Metric</option>
            <option value="PROCESS">Process</option>
            <option value="DOCUMENT">Document</option>
            <option value="LEGAL">Legal</option>
            <option value="OTHER">Other</option>
          </select>
          <button onClick={addEntity} className="btn btn-primary">
            + Add Entity
          </button>
        </div>
      </div>

      {/* Sentiment Editor */}
      <div className="glass-card" style={{
        padding: '25px',
        borderRadius: '16px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'var(--primary-gradient)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            😊
          </div>
          <h3 style={{ margin: 0 }}>Document Sentiment</h3>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Confidence:
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={editedAnalysis.sentiment.confidence * 100}
              onChange={(e) => updateConfidence('sentiment', e.target.value)}
              style={{ width: '100px' }}
            />
            <span style={{ fontSize: '12px', fontWeight: '600' }}>
              {Math.round(editedAnalysis.sentiment.confidence * 100)}%
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          {['positive', 'neutral', 'negative'].map((sentiment) => (
            <label key={sentiment} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              padding: '10px 15px',
              borderRadius: '12px',
              background: editedAnalysis.sentiment.value === sentiment 
                ? 'var(--primary-gradient)' 
                : 'rgba(255, 255, 255, 0.05)',
              border: editedAnalysis.sentiment.value === sentiment 
                ? '1px solid var(--accent-blue)' 
                : '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s ease'
            }}>
              <input
                type="radio"
                name="sentiment"
                value={sentiment}
                checked={editedAnalysis.sentiment.value === sentiment}
                onChange={(e) => setEditedAnalysis(prev => ({
                  ...prev,
                  sentiment: { ...prev.sentiment, value: e.target.value }
                }))}
                style={{ margin: 0 }}
              />
              <span style={{ 
                textTransform: 'capitalize', 
                fontWeight: '500',
                color: editedAnalysis.sentiment.value === sentiment 
                  ? 'white' 
                  : 'var(--text-primary)'
              }}>
                {sentiment === 'positive' ? '😊 Positive' : 
                 sentiment === 'negative' ? '😞 Negative' : 
                 '😐 Neutral'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* AI Assistant Section */}
      <div className="glass-card" style={{
        padding: '25px',
        borderRadius: '16px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'var(--primary-gradient)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            🤖
          </div>
          <h3 style={{ margin: 0 }}>Ask AI for Details</h3>
          <div style={{ marginLeft: 'auto' }}>
            {aiResponse && (
              <button 
                onClick={clearAIChat} 
                className="btn btn-secondary"
                style={{ padding: '5px 12px', fontSize: '12px' }}
              >
                🗑️ Clear
              </button>
            )}
          </div>
        </div>

        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: '14px', 
          marginBottom: '15px',
          margin: '0 0 15px 0'
        }}>
          Ask the AI specific questions about the document content, missing details, or request clarifications.
        </p>

        {/* Question Input */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <input
            type="text"
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            placeholder="Ask about the document... (e.g., 'What are the key stakeholders?', 'Summarize the main points')"
            className="input"
            style={{ flex: 1 }}
            onKeyPress={(e) => e.key === 'Enter' && !isAsking && askAI()}
            disabled={isAsking}
          />
          <button 
            onClick={askAI} 
            className="btn btn-primary"
            disabled={!aiQuestion.trim() || isAsking}
            style={{ 
              minWidth: '100px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            {isAsking ? (
              <>
                <div style={{
                  width: '12px',
                  height: '12px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Asking...
              </>
            ) : (
              '🤖 Ask AI'
            )}
          </button>
        </div>

        {/* AI Response */}
        {aiResponse && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '15px',
            marginBottom: '15px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '10px' 
            }}>
              <span style={{ fontSize: '16px' }}>🤖</span>
              <span style={{ 
                fontWeight: '600', 
                color: 'var(--accent-blue)',
                fontSize: '14px'
              }}>
                AI Response:
              </span>
            </div>
            <div style={{ 
              color: 'var(--text-primary)',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap'
            }}>
              {aiResponse}
            </div>
          </div>
        )}

        {/* Quick Question Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {[
            'What is the main topic?',
            'Summarize key points',
            'What are the important dates?',
            'Who are the stakeholders?',
            'What actions are required?',
            'Any missing information?'
          ].map((question, index) => (
            <button
              key={index}
              onClick={() => {
                setAiQuestion(question);
                setAiResponse('');
              }}
              className="btn btn-outline"
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'var(--text-secondary)',
                borderRadius: '16px',
                transition: 'all 0.3s ease'
              }}
              disabled={isAsking}
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Save/Cancel Actions */}
      <div className="glass-card" style={{
        padding: '20px',
        borderRadius: '16px',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button onClick={onCancel} className="btn btn-secondary">
            ❌ Cancel Changes
          </button>
          <button onClick={handleSave} className="btn btn-success">
            ✅ Save & Update Analysis
          </button>
        </div>
        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: '14px', 
          marginTop: '10px',
          margin: '10px 0 0 0'
        }}>
          Your changes will be saved and the document will be marked as human-reviewed
        </p>
      </div>
    </div>
  );
}
