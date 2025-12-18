import React, { useState, useEffect } from 'react';
import API from '../api/api';

export default function DocumentValidator({ documentId }) {
  const [document, setDocument] = useState(null);
  const [editing, setEditing] = useState({});
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    try {
      const response = await API.get(`/validation/document/${documentId}`);
      setDocument(response.data.document);
      setQuestions(response.data.document.questions || []);
    } catch (error) {
      console.error('Failed to load document:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (field, value) => {
    setEditing(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveChanges = async () => {
    try {
      await API.put(`/validation/document/${documentId}`, editing);
      alert('Changes saved successfully!');
      loadDocument(); // Reload to get updated data
    } catch (error) {
      console.error('Failed to save changes:', error);
      alert('Failed to save changes');
    }
  };

  const approveDocument = async () => {
    try {
      await API.post(`/validation/document/${documentId}/approve`);
      alert('Document approved and vectorized!');
      // Redirect or update UI
    } catch (error) {
      console.error('Failed to approve document:', error);
      alert('Failed to approve document');
    }
  };

  const saveQuestionsForLater = async () => {
    try {
      await API.post(`/validation/document/${documentId}/questions`, {
        questions: questions,
        priority: 'medium'
      });
      alert('Questions saved to your queue for later review');
    } catch (error) {
      console.error('Failed to save questions:', error);
    }
  };

  if (loading) return <div>Loading document for validation...</div>;
  if (!document) return <div>Document not found</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px' }}>
      <h1>Document Validation: {document.filename}</h1>
      
      {/* Confidence Overview */}
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '20px' 
      }}>
        <h3>AI Confidence Scores</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {Object.entries(document.analysis).map(([key, analysis]) => (
            <ConfidenceCard 
              key={key}
              title={key.charAt(0).toUpperCase() + key.slice(1)}
              confidence={analysis.confidence}
              needsReview={analysis.needsReview}
            />
          ))}
        </div>
      </div>

      {/* Summary Validation */}
      <ValidationSection
        title="Summary"
        original={document.analysis.summary.text}
        confidence={document.analysis.summary.confidence}
        needsReview={document.analysis.summary.needsReview}
        onEdit={(value) => handleEdit('summary', value)}
        textExcerpts={document.textExcerpts?.filter(e => e.type === 'summary')}
      />

      {/* Topics Validation */}
      <ValidationSection
        title="Topics"
        original={document.analysis.topics.items}
        confidence={document.analysis.topics.confidence}
        needsReview={document.analysis.topics.needsReview}
        onEdit={(value) => handleEdit('topics', value)}
        isArray={true}
      />

      {/* Entities Validation */}
      <ValidationSection
        title="Entities"
        original={document.analysis.entities.items}
        confidence={document.analysis.entities.confidence}
        needsReview={document.analysis.entities.needsReview}
        onEdit={(value) => handleEdit('entities', value)}
        isEntityList={true}
        textExcerpts={document.textExcerpts?.filter(e => e.type === 'entity')}
      />

      {/* Sentiment Validation */}
      <ValidationSection
        title="Sentiment"
        original={document.analysis.sentiment.value}
        confidence={document.analysis.sentiment.confidence}
        needsReview={document.analysis.sentiment.needsReview}
        onEdit={(value) => handleEdit('sentiment', value)}
        isSelect={true}
        options={['positive', 'negative', 'neutral']}
      />

      {/* AI Questions */}
      {questions.length > 0 && (
        <div style={{ 
          backgroundColor: '#fff3cd', 
          padding: '15px', 
          borderRadius: '8px',
          marginTop: '20px'
        }}>
          <h3>🤔 AI has questions that need clarification:</h3>
          {questions.map((question, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              <p><strong>Q{index + 1}:</strong> {question}</p>
              <textarea
                placeholder="Your answer..."
                style={{ width: '100%', height: '60px', padding: '8px' }}
                onChange={(e) => {
                  const updatedQuestions = [...questions];
                  updatedQuestions[index] = {
                    question,
                    answer: e.target.value
                  };
                  setQuestions(updatedQuestions);
                  handleEdit('questionAnswers', updatedQuestions);
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ 
        marginTop: '30px', 
        display: 'flex', 
        gap: '10px',
        justifyContent: 'flex-end'
      }}>
        <button 
          onClick={saveQuestionsForLater}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#ffc107', 
            border: 'none', 
            borderRadius: '4px' 
          }}
        >
          Save Questions for Later
        </button>
        
        <button 
          onClick={saveChanges}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px' 
          }}
        >
          Save Changes
        </button>
        
        <button 
          onClick={approveDocument}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px' 
          }}
        >
          Approve & Vectorize
        </button>
      </div>
    </div>
  );
}

// Confidence indicator component
const ConfidenceCard = ({ title, confidence, needsReview }) => {
  const getColor = () => {
    if (confidence >= 0.8) return '#28a745'; // Green
    if (confidence >= 0.6) return '#ffc107'; // Yellow
    return '#dc3545'; // Red
  };

  return (
    <div style={{
      padding: '10px',
      border: `2px solid ${getColor()}`,
      borderRadius: '4px',
      textAlign: 'center'
    }}>
      <div style={{ fontWeight: 'bold' }}>{title}</div>
      <div style={{ fontSize: '24px', color: getColor() }}>
        {Math.round(confidence * 100)}%
      </div>
      {needsReview && <div style={{ color: '#dc3545', fontSize: '12px' }}>Needs Review</div>}
    </div>
  );
};

// Validation section component
const ValidationSection = ({ 
  title, 
  original, 
  confidence, 
  needsReview, 
  onEdit, 
  isArray, 
  isEntityList, 
  isSelect, 
  options, 
  textExcerpts 
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState(original);

  const bgColor = needsReview ? '#ffebee' : '#e8f5e8';

  return (
    <div style={{ 
      backgroundColor: bgColor, 
      padding: '15px', 
      borderRadius: '8px',
      marginBottom: '15px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>{title} {needsReview && '⚠️'}</h3>
        <div>
          Confidence: <span style={{ fontWeight: 'bold' }}>{Math.round(confidence * 100)}%</span>
          <button 
            onClick={() => setEditMode(!editMode)}
            style={{ marginLeft: '10px', padding: '4px 8px' }}
          >
            {editMode ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Show original value */}
      <div style={{ marginBottom: '10px' }}>
        <strong>AI Analysis:</strong>
        <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '4px' }}>
          {isArray ? (
            <div>{Array.isArray(original) ? original.join(', ') : original}</div>
          ) : isEntityList ? (
            <div>
              {Array.isArray(original) ? original.map(entity => 
                `${entity.name} (${entity.type})`
              ).join(', ') : original}
            </div>
          ) : (
            <div>{original}</div>
          )}
        </div>
      </div>

      {/* Show text excerpts for context */}
      {textExcerpts && textExcerpts.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <strong>Context from document:</strong>
          {textExcerpts.slice(0, 2).map((excerpt, index) => (
            <div key={index} style={{ 
              padding: '8px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '4px', 
              margin: '4px 0',
              fontSize: '14px'
            }}>
              {excerpt.text}
            </div>
          ))}
        </div>
      )}

      {/* Edit mode */}
      {editMode && (
        <div>
          <strong>Your correction:</strong>
          {isSelect ? (
            <select 
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            >
              {options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          ) : (
            <textarea
              value={isArray ? (Array.isArray(editValue) ? editValue.join(', ') : editValue) : editValue}
              onChange={(e) => {
                const value = isArray ? e.target.value.split(',').map(s => s.trim()) : e.target.value;
                setEditValue(value);
              }}
              style={{ width: '100%', height: '80px', padding: '8px', marginTop: '4px' }}
            />
          )}
          <button 
            onClick={() => {
              onEdit(editValue);
              setEditMode(false);
            }}
            style={{ 
              marginTop: '8px', 
              padding: '4px 12px', 
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            Apply Changes
          </button>
        </div>
      )}
    </div>
  );
};
