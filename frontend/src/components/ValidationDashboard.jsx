import React, { useState, useEffect } from 'react';
import API from '../api/api';

export default function ValidationDashboard() {
  const [pendingDocs, setPendingDocs] = useState([]);
  const [questionQueue, setQuestionQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [pendingResponse, queueResponse] = await Promise.all([
        API.get('/validation/pending'),
        API.get('/validation/questions')
      ]);
      
      setPendingDocs(pendingResponse.data.pendingDocuments);
      setQuestionQueue(queueResponse.data.queue);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const openDocumentValidator = (docId) => {
    setSelectedDoc(docId);
  };

  if (loading) return <div>Loading validation dashboard...</div>;

  if (selectedDoc) {
    // Show DocumentValidator component
    return (
      <div>
        <button 
          onClick={() => setSelectedDoc(null)}
          style={{ marginBottom: '20px', padding: '8px 16px' }}
        >
          ← Back to Dashboard
        </button>
        <DocumentValidator documentId={selectedDoc} />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>🔍 Document Validation Dashboard</h1>
      
      {/* Stats Overview */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        <StatCard 
          title="Pending Documents" 
          value={pendingDocs.length}
          color="#ffc107"
          description="Documents awaiting review"
        />
        <StatCard 
          title="Question Queue" 
          value={questionQueue.length}
          color="#17a2b8"
          description="Questions saved for later"
        />
        <StatCard 
          title="High Priority" 
          value={questionQueue.filter(q => q.priority === 'high').length}
          color="#dc3545"
          description="Urgent questions"
        />
      </div>

      {/* Pending Documents Section */}
      <div style={{ marginBottom: '40px' }}>
        <h2>📄 Documents Awaiting Validation</h2>
        {pendingDocs.length === 0 ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            backgroundColor: '#f8f9fa',
            borderRadius: '8px' 
          }}>
            <p>🎉 No documents pending validation!</p>
            <p>All uploaded documents have been processed and approved.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {pendingDocs.map(doc => (
              <DocumentCard 
                key={doc.id}
                document={doc}
                onValidate={() => openDocumentValidator(doc.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Question Queue Section */}
      <div>
        <h2>❓ Question Queue</h2>
        {questionQueue.length === 0 ? (
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#f8f9fa',
            borderRadius: '8px' 
          }}>
            <p>No questions in queue</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {questionQueue.map(item => (
              <QuestionCard 
                key={item.id}
                queueItem={item}
                onAnswer={() => {/* Handle answer */}}
                onViewDocument={() => openDocumentValidator(item.documentId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const StatCard = ({ title, value, color, description }) => (
  <div style={{
    padding: '20px',
    backgroundColor: 'white',
    borderLeft: `4px solid ${color}`,
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  }}>
    <div style={{ fontSize: '32px', fontWeight: 'bold', color }}>{value}</div>
    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{title}</div>
    <div style={{ color: '#666', fontSize: '14px' }}>{description}</div>
  </div>
);

const DocumentCard = ({ document, onValidate }) => (
  <div style={{
    padding: '15px',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <h3 style={{ margin: 0, marginBottom: '8px' }}>{document.filename}</h3>
        <div style={{ color: '#666', fontSize: '14px' }}>
          Uploaded: {new Date(document.createdAt).toLocaleString()}
        </div>
        
        {/* Confidence Issues */}
        {document.confidenceIssues.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            <span style={{ color: '#dc3545', fontSize: '14px' }}>
              ⚠️ Issues: {document.confidenceIssues.join(', ')}
            </span>
          </div>
        )}
        
        {/* Questions Count */}
        {document.questionsCount > 0 && (
          <div style={{ marginTop: '4px' }}>
            <span style={{ color: '#17a2b8', fontSize: '14px' }}>
              🤔 {document.questionsCount} AI questions need answers
            </span>
          </div>
        )}
      </div>
      
      <button
        onClick={onValidate}
        style={{
          padding: '8px 16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Validate Document
      </button>
    </div>
  </div>
);

const QuestionCard = ({ queueItem, onAnswer, onViewDocument }) => {
  const priorityColors = {
    high: '#dc3545',
    medium: '#ffc107', 
    low: '#28a745'
  };

  return (
    <div style={{
      padding: '12px',
      backgroundColor: 'white',
      border: '1px solid #ddd',
      borderLeft: `4px solid ${priorityColors[queueItem.priority]}`,
      borderRadius: '8px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ 
              backgroundColor: priorityColors[queueItem.priority],
              color: 'white',
              padding: '2px 6px',
              borderRadius: '3px',
              fontSize: '12px',
              marginRight: '8px'
            }}>
              {queueItem.priority.toUpperCase()}
            </span>
            <span style={{ color: '#666', fontSize: '14px' }}>
              {new Date(queueItem.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            {queueItem.questions.slice(0, 2).map((question, index) => (
              <div key={index} style={{ fontSize: '14px', marginBottom: '4px' }}>
                • {question}
              </div>
            ))}
            {queueItem.questions.length > 2 && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                +{queueItem.questions.length - 2} more questions
              </div>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onViewDocument}
            style={{
              padding: '4px 8px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            View Doc
          </button>
          <button
            onClick={onAnswer}
            style={{
              padding: '4px 8px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            Answer
          </button>
        </div>
      </div>
    </div>
  );
};
