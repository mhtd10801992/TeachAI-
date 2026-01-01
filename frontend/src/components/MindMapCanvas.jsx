import { useState } from 'react';
import API from '../api/api';

// Simple mind-map style canvas with AI-assisted node generation
export default function MindMapCanvas() {
  const [sourceText, setSourceText] = useState('');
  const [rootLabel, setRootLabel] = useState('Learning Map');
  const [processes, setProcesses] = useState([]); // from AI actionable steps
  const [manualNodes, setManualNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateFromAI = async () => {
    if (!sourceText.trim()) {
      setError('Please paste some text or notes to analyze.');
      return;
    }
    setError('');
    setLoading(true);
    setSelectedNode(null);
    try {
      const response = await API.post('/ai/actionable-steps', { text: sourceText });
      const steps = response.data?.steps || [];
      setProcesses(steps);
    } catch (e) {
      console.error('Error generating actionable steps:', e);
      setError('AI analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddManualNode = () => {
    const id = `manual-${manualNodes.length + 1}`;
    const angle = (manualNodes.length / Math.max(1, processes.length + manualNodes.length)) * Math.PI * 2;
    const node = {
      id,
      title: `Note ${manualNodes.length + 1}`,
      description: '',
      top: 50 + 25 * Math.sin(angle),
      left: 50 + 35 * Math.cos(angle)
    };
    setManualNodes([...manualNodes, node]);
    setSelectedNode(node);
  };

  const allNodes = () => {
    const aiNodes = processes.map((p, index) => {
      const angle = (index / Math.max(1, processes.length)) * Math.PI * 2;
      return {
        id: `ai-${index}`,
        title: p.title || `Flow ${index + 1}`,
        steps: p.steps || [],
        outcomes: p.outcomes || [],
        resources: p.resources || [],
        risks: p.risks || [],
        top: 50 + 25 * Math.sin(angle),
        left: 50 + 35 * Math.cos(angle)
      };
    });
    return aiNodes.concat(manualNodes);
  };

  const chartData = processes.map((p, idx) => ({
    label: p.title || `Flow ${idx + 1}`,
    value: (p.steps || []).length || 1
  }));

  const handleNodeTitleChange = (nodeId, newTitle) => {
    setManualNodes(prev => prev.map(n => n.id === nodeId ? { ...n, title: newTitle } : n));
  };

  const handleNodeDescriptionChange = (nodeId, newDesc) => {
    setManualNodes(prev => prev.map(n => n.id === nodeId ? { ...n, description: newDesc } : n));
  };

  const nodes = allNodes();

  return (
    <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 140px)' }}>
      {/* Left control panel */}
      <div className="glass-card" style={{ width: '360px', padding: '20px', overflowY: 'auto' }}>
        <h2 style={{ marginBottom: '10px' }}>🧠 Mind Map Lab</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
          Paste document text or notes, then let AI extract actionable learning flows. You can also add your own nodes on the canvas.
        </p>

        <label style={{ fontSize: '13px', marginBottom: '4px', display: 'block' }}>Root topic / title</label>
        <input
          type="text"
          value={rootLabel}
          onChange={e => setRootLabel(e.target.value)}
          style={{
            width: '100%',
            marginBottom: '12px',
            padding: '8px 10px',
            borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.25)',
            color: 'var(--text-primary)',
            fontSize: '14px'
          }}
        />

        <label style={{ fontSize: '13px', marginBottom: '4px', display: 'block' }}>Source text / notes</label>
        <textarea
          value={sourceText}
          onChange={e => setSourceText(e.target.value)}
          placeholder="Paste a paragraph, meeting notes, or learning content here..."
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.3)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            marginBottom: '10px',
            resize: 'vertical'
          }}
        />

        {error && (
          <div style={{
            marginBottom: '10px',
            padding: '8px 10px',
            borderRadius: '6px',
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.4)',
            fontSize: '12px'
          }}>
            {error}
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleGenerateFromAI}
          disabled={loading}
          style={{ width: '100%', marginBottom: '10px' }}
        >
          {loading ? 'Analyzing with AI…' : '✨ Extract Learning Flows'}
        </button>

        <button
          className="btn btn-secondary"
          onClick={handleAddManualNode}
          style={{ width: '100%', marginBottom: '16px' }}
        >
          ➕ Add Manual Node
        </button>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px', marginTop: '8px' }}>
          <h4 style={{ fontSize: '13px', marginBottom: '8px' }}>📊 Learning Flow Size</h4>
          {chartData.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Run AI extraction to see chart.</div>
          ) : (
            <div>
              {chartData.map((d, idx) => (
                <div key={idx} style={{ marginBottom: '6px' }}>
                  <div style={{ fontSize: '12px', marginBottom: '2px' }}>{d.label}</div>
                  <div style={{
                    height: '6px',
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div
                      style={{
                        width: `${Math.min(100, d.value * 15)}%`,
                        height: '100%',
                        background: 'var(--primary-gradient)'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedNode && (
          <div style={{
            marginTop: '14px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255,255,255,0.08)'
          }}>
            <h4 style={{ fontSize: '13px', marginBottom: '6px' }}>📝 Selected Node</h4>
            <input
              type="text"
              value={selectedNode.title}
              onChange={e => {
                const value = e.target.value;
                if (selectedNode.id.startsWith('manual-')) {
                  handleNodeTitleChange(selectedNode.id, value);
                  setSelectedNode(prev => prev ? { ...prev, title: value } : prev);
                }
              }}
              style={{
                width: '100%',
                marginBottom: '6px',
                padding: '6px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.3)',
                color: 'var(--text-primary)',
                fontSize: '13px'
              }}
            />
            {selectedNode.id.startsWith('manual-') && (
              <textarea
                value={selectedNode.description || ''}
                onChange={e => {
                  const value = e.target.value;
                  handleNodeDescriptionChange(selectedNode.id, value);
                  setSelectedNode(prev => prev ? { ...prev, description: value } : prev);
                }}
                placeholder="Notes or key points for this node..."
                style={{
                  width: '100%',
                  minHeight: '60px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.3)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  resize: 'vertical'
                }}
              />
            )}

            {selectedNode.steps && selectedNode.steps.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '12px', marginBottom: '4px' }}>Key steps:</div>
                <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '12px' }}>
                  {selectedNode.steps.slice(0, 4).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedNode.outcomes && selectedNode.outcomes.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '12px', marginBottom: '4px' }}>Expected outcomes:</div>
                <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '12px' }}>
                  {selectedNode.outcomes.slice(0, 3).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Canvas area */}
      <div className="glass-card" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)', backgroundSize: '24px 24px', opacity: 0.4 }} />

        {/* Root node */}
        <div
          onClick={() => setSelectedNode({ id: 'root', title: rootLabel })}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '12px 18px',
            borderRadius: '999px',
            background: 'var(--primary-gradient)',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            cursor: 'pointer',
            zIndex: 2
          }}
        >
          {rootLabel}
        </div>

        {/* AI & manual nodes */}
        {nodes.map(node => (
          <div
            key={node.id}
            onClick={() => setSelectedNode(node)}
            style={{
              position: 'absolute',
              top: `${node.top}%`,
              left: `${node.left}%`,
              transform: 'translate(-50%, -50%)',
              minWidth: '160px',
              maxWidth: '220px',
              padding: '10px 12px',
              borderRadius: '12px',
              background: selectedNode?.id === node.id ? 'rgba(59,130,246,0.9)' : 'rgba(15,23,42,0.95)',
              color: '#e5e7eb',
              border: '1px solid rgba(148,163,184,0.4)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.35)',
              cursor: 'pointer',
              zIndex: 2
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{node.title}</div>
            {node.steps && node.steps.length > 0 && (
              <div style={{ fontSize: '11px', color: 'rgba(226,232,240,0.8)' }}>
                {node.steps[0]}
              </div>
            )}
            {node.description && (
              <div style={{ fontSize: '11px', color: 'rgba(226,232,240,0.8)' }}>
                {node.description}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
