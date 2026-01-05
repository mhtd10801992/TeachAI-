import { useState, useEffect } from 'react';
import API from '../api/api';

// Category colors for visual distinction
const CATEGORY_COLORS = {
  'Cost Saving': '#10b981',
  'Efficiency Improvement': '#3b82f6',
  'Technology Advancement': '#8b5cf6',
  'Employee Training': '#f59e0b',
  'Process Optimization': '#06b6d4',
  'Risk Management': '#ef4444',
  'Customer Experience': '#ec4899',
  'Innovation': '#6366f1',
  'Sustainability': '#14b8a6',
  'Quality Improvement': '#84cc16'
};

// Simple mind-map style canvas with AI-assisted node generation
export default function MindMapCanvas() {
  const [sourceText, setSourceText] = useState('');
  const [rootLabel, setRootLabel] = useState('Learning Map');
  const [processes, setProcesses] = useState([]); // from AI actionable steps
  const [manualNodes, setManualNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // New state for multi-document categorization
  const [availableDocuments, setAvailableDocuments] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [categorizedData, setCategorizedData] = useState(null);
  const [categorizationLoading, setCategorizationLoading] = useState(false);
  const [viewMode, setViewMode] = useState('multi-doc'); // Only multi-doc mode
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showRelationships, setShowRelationships] = useState(true);
  
  // State for saved mind maps
  const [savedMindMaps, setSavedMindMaps] = useState([]);
  const [showSavedMindMaps, setShowSavedMindMaps] = useState(false);
  const [loadingMindMaps, setLoadingMindMaps] = useState(false);
  
  // Canvas interaction state
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState(null);
  const [nodePositions, setNodePositions] = useState({});
  const [showAllCategories, setShowAllCategories] = useState(true);
  const [expandedConcept, setExpandedConcept] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzingFactor, setAnalyzingFactor] = useState(false);

  // Load available documents on mount
  useEffect(() => {
    loadAvailableDocuments();
    loadSavedMindMaps();
  }, []);
  
  const loadSavedMindMaps = async () => {
    try {
      const response = await API.get('/mindmap/saved');
      setSavedMindMaps(response.data.mindMaps || []);
      console.log(`✅ Loaded ${response.data.mindMaps?.length || 0} saved mind maps`);
    } catch (e) {
      console.error('Error loading saved mind maps:', e);
    }
  };
  
  const loadExistingMindMap = async (mindMapId) => {
    setLoadingMindMaps(true);
    setError('');
    try {
      const response = await API.get(`/mindmap/saved/${mindMapId}`);
      setCategorizedData(response.data);
      setViewMode('multi-doc');
      setShowSavedMindMaps(false);
      console.log('✅ Loaded saved mind map:', response.data);
    } catch (e) {
      console.error('Error loading mind map:', e);
      setError('Failed to load mind map. Please try again.');
    } finally {
      setLoadingMindMaps(false);
    }
  };

  const loadAvailableDocuments = async () => {
    try {
      console.log('📚 Fetching documents from /api/mindmap/documents...');
      const response = await API.get('/mindmap/documents');
      console.log('✅ Documents response:', response.data);
      setAvailableDocuments(response.data.documents || []);
      if (response.data.documents && response.data.documents.length > 0) {
        console.log(`✅ Loaded ${response.data.documents.length} documents for selection`);
      } else {
        console.warn('⚠️ No documents found. Please upload some documents first.');
      }
    } catch (e) {
      console.error('❌ Error loading documents:', e);
      setError(`Failed to load documents: ${e.message}`);
    }
  };

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

  const handleCategorizeDocuments = async () => {
    if (selectedDocuments.length === 0) {
      setError('Please select at least one document to categorize.');
      return;
    }
    setError('');
    setCategorizationLoading(true);
    try {
      const response = await API.post('/mindmap/categorize', { 
        documentIds: selectedDocuments 
      });
      setCategorizedData(response.data);
      console.log('✅ Categorization complete:', response.data);
      
      // Refresh saved mind maps list after successful save
      await loadSavedMindMaps();
      console.log('✅ Refreshed saved mind maps list');
    } catch (e) {
      console.error('Error categorizing documents:', e);
      setError('Failed to categorize documents. Please try again.');
    } finally {
      setCategorizationLoading(false);
    }
  };

  const toggleDocumentSelection = (docId) => {
    setSelectedDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  // Canvas interaction handlers
  const handleWheel = (e) => {
    // Remove preventDefault to avoid passive event listener warning
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setCanvasZoom(prev => Math.max(0.3, Math.min(3, prev * delta)));
  };
  
  const handleMouseDown = (e) => {
    if (e.target.classList.contains('canvas-background')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - canvasPan.x, y: e.clientY - canvasPan.y });
    }
  };
  
  const handleMouseMove = (e) => {
    if (isPanning) {
      setCanvasPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    } else if (draggedNode) {
      // Update dragged node position
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left - canvasPan.x) / canvasZoom / rect.width) * 100;
      const y = ((e.clientY - rect.top - canvasPan.y) / canvasZoom / rect.height) * 100;
      
      setNodePositions(prev => ({
        ...prev,
        [draggedNode]: { left: x, top: y }
      }));
    }
  };
  
  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNode(null);
  };
  
  const handleNodeMouseDown = (e, nodeId) => {
    e.stopPropagation();
    setDraggedNode(nodeId);
  };

  const analyzeFactor = async (factorKey, factorValue) => {
    setAnalyzingFactor(true);
    try {
      const response = await API.post('/mindmap/analyze-factor', {
        concept: expandedConcept,
        factorKey,
        factorValue,
        category: expandedConcept.category,
        relationships: categorizedData?.categoryMindMaps?.[expandedConcept.category]?.relationships || [],
        allConcepts: categorizedData?.categoryMindMaps?.[expandedConcept.category]?.concepts || []
      });
      setAiAnalysis({ factorKey, analysis: response.data.analysis });
    } catch (error) {
      console.error('Error analyzing factor:', error);
      setAiAnalysis({ factorKey, analysis: 'Failed to analyze. Please try again.' });
    } finally {
      setAnalyzingFactor(false);
    }
  };
  
  const resetView = () => {
    setCanvasZoom(1);
    setCanvasPan({ x: 0, y: 0 });
  };

  // Download mind map as JSON
  const downloadMindMapJSON = () => {
    if (!categorizedData) {
      alert('No mind map data to download');
      return;
    }
    
    const dataStr = JSON.stringify(categorizedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mindmap-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generate and download Mermaid code
  const downloadMermaidCode = () => {
    if (!categorizedData) {
      alert('No mind map data to download');
      return;
    }

    let mermaidCode = 'graph TD\n';
    mermaidCode += '    Root[Mind Map]\n';
    
    // Add categories
    categorizedData.categories?.forEach((cat, catIdx) => {
      const catId = `Cat${catIdx}`;
      mermaidCode += `    Root --> ${catId}["${cat}"]\n`;
      
      // Add concepts for this category
      const concepts = categorizedData.categoryMindMaps?.[cat]?.concepts || [];
      concepts.forEach((concept, conIdx) => {
        const conceptId = `${catId}_C${conIdx}`;
        mermaidCode += `    ${catId} --> ${conceptId}["${concept.name}"]\n`;
        
        // Add factors for this concept (limit to avoid overcrowding)
        const factors = concept.factors?.slice(0, 3) || [];
        factors.forEach((factor, factIdx) => {
          const factorId = `${conceptId}_F${factIdx}`;
          mermaidCode += `    ${conceptId} --> ${factorId}["${factor.factor}"]\n`;
        });
      });
    });
    
    // Add styling
    mermaidCode += '\n    classDef categoryNode fill:#3b82f6,stroke:#1e40af,color:#fff\n';
    mermaidCode += '    classDef conceptNode fill:#10b981,stroke:#059669,color:#fff\n';
    mermaidCode += '    classDef factorNode fill:#f59e0b,stroke:#d97706,color:#fff\n';
    
    const dataBlob = new Blob([mermaidCode], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mindmap-mermaid-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
      <div className="glass-card" style={{ width: '420px', padding: '20px', overflowY: 'auto' }}>
        <h2 style={{ marginBottom: '10px' }}>🧠 Mind Map Lab</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
          Multi-document categorization and AI-powered mind map generation.
        </p>
        
        {/* Load Saved Mind Maps Button */}
        <button
          onClick={() => {
            setShowSavedMindMaps(!showSavedMindMaps);
            if (!showSavedMindMaps) {
              loadSavedMindMaps(); // Refresh list when opening
            }
          }}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '15px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.2)',
            background: showSavedMindMaps ? 'rgba(99, 102, 241, 0.3)' : 'rgba(0,0,0,0.3)',
            color: 'white',
            fontSize: '13px',
            cursor: 'pointer',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          🗂️ Load Saved Mind Map ({savedMindMaps.length})
        </button>
        
        {/* Saved Mind Maps List */}
        {showSavedMindMaps && (
          <div style={{
            marginBottom: '15px',
            padding: '12px',
            borderRadius: '8px',
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.1)',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            <h4 style={{ fontSize: '13px', marginBottom: '10px', color: 'var(--text-secondary)' }}>
              Saved Mind Maps
            </h4>
            {savedMindMaps.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                <div style={{ marginBottom: '8px' }}>📭 No saved mind maps yet.</div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>
                  Generate a multi-document mind map first, and it will be automatically saved here.
                </div>
              </div>
            ) : (
              savedMindMaps.map(mindMap => (
                <div
                  key={mindMap.id}
                  onClick={() => loadExistingMindMap(mindMap.id)}
                  style={{
                    padding: '10px',
                    marginBottom: '8px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    cursor: loadingMindMaps ? 'wait' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: loadingMindMaps ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                    {new Date(mindMap.createdAt).toLocaleDateString()} {new Date(mindMap.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    📄 {mindMap.totalDocuments} documents • {mindMap.categories?.length || 0} categories
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', opacity: 0.8 }}>
                    {mindMap.documentTitles?.slice(0, 2).join(', ')}
                    {mindMap.documentTitles?.length > 2 && ` +${mindMap.documentTitles.length - 2} more`}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

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

        {/* Multi-Document Categorization Mode */}
        <>
            {/* Multi-Document Categorization Mode */}
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>📚 Select Documents</h4>
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.3)',
                padding: '8px'
              }}>
                {availableDocuments.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                    No documents found. Upload documents first.
                  </div>
                ) : (
                  availableDocuments.map(doc => (
                    <div
                      key={doc.id}
                      onClick={() => toggleDocumentSelection(doc.id)}
                      style={{
                        padding: '10px',
                        marginBottom: '8px',
                        borderRadius: '6px',
                        background: selectedDocuments.includes(doc.id) 
                          ? 'rgba(99, 102, 241, 0.3)' 
                          : 'rgba(0,0,0,0.3)',
                        border: `1px solid ${selectedDocuments.includes(doc.id) 
                          ? 'rgba(99, 102, 241, 0.6)' 
                          : 'rgba(255,255,255,0.1)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        marginBottom: '4px'
                      }}>
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '4px',
                          background: selectedDocuments.includes(doc.id) 
                            ? 'rgba(99, 102, 241, 1)' 
                            : 'transparent',
                          border: '2px solid rgba(99, 102, 241, 0.6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          flexShrink: 0
                        }}>
                          {selectedDocuments.includes(doc.id) && '✓'}
                        </div>
                        <div style={{ 
                          fontSize: '13px', 
                          fontWeight: '500',
                          flex: 1
                        }}>
                          {doc.title}
                        </div>
                      </div>
                      <div style={{ 
                        fontSize: '11px', 
                        color: 'var(--text-secondary)',
                        paddingLeft: '26px'
                      }}>
                        {doc.summary}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: 'var(--text-secondary)', 
                marginTop: '8px'
              }}>
                {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleCategorizeDocuments}
              disabled={categorizationLoading || selectedDocuments.length === 0}
              style={{ width: '100%', marginBottom: '10px' }}
            >
              {categorizationLoading ? '🤖 Categorizing...' : '🎯 Categorize & Generate Mind Maps'}
            </button>

            {categorizedData && (
              <div style={{ 
                marginTop: '15px',
                padding: '12px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  ✅ Analysis Complete
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  • {categorizedData.totalDocuments} documents analyzed<br/>
                  • {categorizedData.categories?.length || 0} categories found<br/>
                  • {categorizedData.categoryRelationships?.length || 0} inter-category relationships
                </div>
              </div>
            )}

            {categorizedData && (
              <>
                <div style={{ 
                  borderTop: '1px solid rgba(255,255,255,0.08)', 
                  paddingTop: '12px', 
                  marginTop: '12px'
                }}>
                  <h4 style={{ fontSize: '13px', marginBottom: '8px' }}>📊 Categories</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {categorizedData.categories?.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: selectedCategory === cat 
                            ? CATEGORY_COLORS[cat] || 'var(--primary-gradient)'
                            : 'rgba(255,255,255,0.1)',
                          color: 'white',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: selectedCategory === cat ? '600' : '400',
                          transition: 'all 0.2s'
                        }}
                      >
                        {cat} ({categorizedData.categoryGroups?.[cat]?.length || 0})
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ 
                  marginTop: '12px',
                  padding: '8px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '6px'
                }}>
                  <label style={{ 
                    fontSize: '12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    cursor: 'pointer',
                    marginBottom: '8px'
                  }}>
                    <input
                      type="checkbox"
                      checked={showRelationships}
                      onChange={(e) => setShowRelationships(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    Show inter-category relationships
                  </label>
                  <label style={{ 
                    fontSize: '12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={showAllCategories}
                      onChange={(e) => {
                        setShowAllCategories(e.target.checked);
                        if (e.target.checked) setSelectedCategory(null);
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    Show all categories at once
                  </label>
                </div>
              </>
            )}
        </>
      </div>

      {/* Canvas area */}
      <div 
        className="glass-card" 
        style={{ 
          flex: 1, 
          position: 'relative', 
          overflow: 'hidden', 
          cursor: isPanning ? 'grabbing' : 'grab',
          touchAction: 'none' // Prevents passive touch events
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Canvas controls */}
        <div style={{ 
          position: 'absolute', 
          top: '10px', 
          right: '10px', 
          zIndex: 10,
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={() => setCanvasZoom(prev => Math.min(3, prev * 1.2))}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            +
          </button>
          <button
            onClick={() => setCanvasZoom(prev => Math.max(0.3, prev * 0.8))}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            −
          </button>
          <button
            onClick={resetView}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Reset
          </button>
          {categorizedData && (
            <>
              <button
                onClick={downloadMindMapJSON}
                title="Download mind map as JSON"
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(0,0,0,0.7)',
                  color: '#10b981',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                📥 JSON
              </button>
              <button
                onClick={downloadMermaidCode}
                title="Download Mermaid diagram code"
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(0,0,0,0.7)',
                  color: '#3b82f6',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                📊 Mermaid
              </button>
            </>
          )}
          <div style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            fontSize: '11px'
          }}>
            {Math.round(canvasZoom * 100)}%
          </div>
        </div>
        
        <div 
          className="canvas-background"
          style={{ 
            position: 'absolute', 
            inset: 0,
            backgroundColor: '#ffffff',
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.15) 1.5px, transparent 0)', 
            backgroundSize: '30px 30px'
          }} 
        />
        
        <div style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${canvasPan.x}px, ${canvasPan.y}px) scale(${canvasZoom})`,
          transformOrigin: 'center center',
          transition: isPanning ? 'none' : 'transform 0.1s ease-out'
        }}>

        {/* Categorized Multi-Doc View */}
        {categorizedData && viewMode === 'multi-doc' ? (
          <>
            {/* Render categorized mind map */}
            {selectedCategory && !showAllCategories ? (
              // Show specific category mind map
              <>
                {/* Category root node */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    padding: '12px 18px',
                    borderRadius: '999px',
                    background: CATEGORY_COLORS[selectedCategory] || 'var(--primary-gradient)',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 600,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                    zIndex: 2
                  }}
                >
                  {selectedCategory}
                </div>

                {/* Category concepts */}
                {categorizedData.categoryMindMaps?.[selectedCategory]?.concepts?.map((concept, idx) => {
                  const angle = (idx / categorizedData.categoryMindMaps[selectedCategory].concepts.length) * 2 * Math.PI;
                  const radius = 35;
                  const top = 50 + radius * Math.sin(angle);
                  const left = 50 + radius * Math.cos(angle);

                  return (
                    <div
                      key={`${selectedCategory}-concept-${idx}`}
                      onClick={() => setSelectedNode({ id: `concept-${idx}`, title: concept.name, ...concept })}
                      style={{
                        position: 'absolute',
                        top: `${top}%`,
                        left: `${left}%`,
                        transform: 'translate(-50%, -50%)',
                        minWidth: '140px',
                        maxWidth: '200px',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        background: 'rgba(15,23,42,0.95)',
                        color: '#e5e7eb',
                        border: `2px solid ${CATEGORY_COLORS[selectedCategory] || 'rgba(148,163,184,0.4)'}`,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.35)',
                        cursor: 'pointer',
                        zIndex: 2
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                        {concept.name}
                      </div>
                      {concept.importance && (
                        <div style={{ fontSize: '10px', color: 'rgba(226,232,240,0.6)' }}>
                          {concept.importance}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Category relationships */}
                {showRelationships && categorizedData.categoryMindMaps?.[selectedCategory]?.relationships?.map((rel, idx) => {
                  const fromIdx = categorizedData.categoryMindMaps[selectedCategory].concepts.findIndex(c => c.name === rel.from);
                  const toIdx = categorizedData.categoryMindMaps[selectedCategory].concepts.findIndex(c => c.name === rel.to);
                  
                  if (fromIdx === -1 || toIdx === -1) return null;

                  const angle1 = (fromIdx / categorizedData.categoryMindMaps[selectedCategory].concepts.length) * 2 * Math.PI;
                  const angle2 = (toIdx / categorizedData.categoryMindMaps[selectedCategory].concepts.length) * 2 * Math.PI;
                  const radius = 35;

                  return (
                    <svg
                      key={`${selectedCategory}-rel-${idx}`}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        zIndex: 1
                      }}
                    >
                      <line
                        x1={`${50 + radius * Math.cos(angle1)}%`}
                        y1={`${50 + radius * Math.sin(angle1)}%`}
                        x2={`${50 + radius * Math.cos(angle2)}%`}
                        y2={`${50 + radius * Math.sin(angle2)}%`}
                        stroke={CATEGORY_COLORS[selectedCategory] || 'rgba(148,163,184,0.3)'}
                        strokeWidth="1"
                        strokeDasharray="4,4"
                        opacity="0.5"
                      />
                    </svg>
                  );
                })}
              </>
            ) : (
              // Show all categories with their concepts expanded
              <>
                {/* Central hub */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    padding: '16px 24px',
                    borderRadius: '999px',
                    background: 'var(--primary-gradient)',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: 700,
                    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                    zIndex: 10,
                    border: '2px solid rgba(255,255,255,0.3)'
                  }}
                >
                  Mind Map
                </div>

                {/* Category clusters with their concepts */}
                {categorizedData.categories?.map((cat, catIdx) => {
                  const categoryAngle = (catIdx / categorizedData.categories.length) * 2 * Math.PI;
                  const categoryRadius = 28;
                  const defaultCatTop = 50 + categoryRadius * Math.sin(categoryAngle);
                  const defaultCatLeft = 50 + categoryRadius * Math.cos(categoryAngle);
                  
                  const catNodeId = `category-${cat}`;
                  const catPosition = nodePositions[catNodeId] || { top: defaultCatTop, left: defaultCatLeft };
                  const catTop = catPosition.top;
                  const catLeft = catPosition.left;
                  
                  const concepts = categorizedData.categoryMindMaps?.[cat]?.concepts || [];
                  
                  return (
                    <div key={`category-cluster-${cat}`}>
                      {/* Category node */}
                      <div
                        onMouseDown={(e) => handleNodeMouseDown(e, catNodeId)}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedCategory === cat) {
                            // Clicking same category: return to full view
                            setSelectedCategory(null);
                            setShowAllCategories(true);
                          } else {
                            // Clicking new category: show its details
                            setSelectedCategory(cat);
                            setShowAllCategories(false);
                            // Debug: Log concept structure
                            console.log('🔍 Selected category:', cat);
                            console.log('🔍 Concepts for category:', concepts);
                            concepts.forEach((concept, idx) => {
                              console.log(`  Concept ${idx}:`, concept);
                              console.log(`  Has factors?`, concept.factors);
                              console.log(`  All keys:`, Object.keys(concept));
                            });
                          }
                        }}
                        style={{
                          position: 'absolute',
                          top: `${catTop}%`,
                          left: `${catLeft}%`,
                          transform: 'translate(-50%, -50%)',
                          minWidth: '140px',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          background: CATEGORY_COLORS[cat] || 'rgba(15,23,42,0.95)',
                          color: '#fff',
                          border: '2px solid rgba(255,255,255,0.4)',
                          boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
                          cursor: draggedNode === catNodeId ? 'grabbing' : 'grab',
                          zIndex: draggedNode === catNodeId ? 100 : 5,
                          transition: draggedNode === catNodeId ? 'none' : 'all 0.2s',
                          userSelect: 'none'
                        }}
                        onMouseEnter={(e) => !draggedNode && (e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.05)')}
                        onMouseLeave={(e) => !draggedNode && (e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)')}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>{cat}</div>
                        <div style={{ fontSize: '10px', opacity: 0.9 }}>
                          {categorizedData.categoryGroups?.[cat]?.length || 0} docs • {concepts.length} concepts
                        </div>
                      </div>
                      
                      {/* Line from center to category */}
                      <svg
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          pointerEvents: 'none',
                          zIndex: 1
                        }}
                      >
                        <line
                          x1="50%"
                          y1="50%"
                          x2={`${catLeft}%`}
                          y2={`${catTop}%`}
                          stroke={CATEGORY_COLORS[cat] || 'rgba(148,163,184,0.4)'}
                          strokeWidth="2"
                          opacity="0.4"
                        />
                      </svg>
                      
                      {/* Subconcepts around category */}
                      {concepts.map((concept, conceptIdx) => {
                        // Get factors - either from factors array or convert other properties
                        let conceptFactors = concept.factors || [];
                        
                        // If no factors array, create factors from other concept properties
                        if (!conceptFactors || conceptFactors.length === 0) {
                          const excludedKeys = ['id', 'name', 'description', 'type', 'relatedDocuments', 'importance', 'sourceDoc', 'category', 'catIdx', 'conceptIdx'];
                          conceptFactors = Object.entries(concept)
                            .filter(([key]) => !excludedKeys.includes(key))
                            .map(([key, value]) => ({
                              factor: key,
                              value: typeof value === 'object' ? JSON.stringify(value) : String(value)
                            }))
                            .slice(0, 5); // Limit to 5 factors
                        }
                        
                        const totalConcepts = concepts.length;
                        const conceptAngle = categoryAngle + ((conceptIdx - (totalConcepts - 1) / 2) * (0.8 / Math.max(1, totalConcepts - 1)));
                        const conceptRadius = categoryRadius + 15;
                        const defaultConceptTop = 50 + conceptRadius * Math.sin(conceptAngle);
                        const defaultConceptLeft = 50 + conceptRadius * Math.cos(conceptAngle);
                        
                        const conceptNodeId = `${cat}-concept-${conceptIdx}`;
                        const conceptPosition = nodePositions[conceptNodeId] || { top: defaultConceptTop, left: defaultConceptLeft };
                        const conceptTop = conceptPosition.top;
                        const conceptLeft = conceptPosition.left;
                        
                        return (
                          <div key={`${cat}-concept-${conceptIdx}`}>
                            <div
                              onMouseDown={(e) => handleNodeMouseDown(e, conceptNodeId)}
                              onClick={() => {
                                setSelectedNode({ id: `concept-${catIdx}-${conceptIdx}`, title: concept.name, category: cat, ...concept });
                                setExpandedConcept({ ...concept, category: cat, catIdx, conceptIdx });
                              }}
                              style={{
                                position: 'absolute',
                                top: `${conceptTop}%`,
                                left: `${conceptLeft}%`,
                                transform: 'translate(-50%, -50%)',
                                minWidth: '100px',
                                maxWidth: '140px',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                background: 'rgba(15,23,42,0.95)',
                                color: '#e5e7eb',
                                border: `1px solid ${CATEGORY_COLORS[cat] || 'rgba(148,163,184,0.3)'}`,
                                boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                                cursor: draggedNode === conceptNodeId ? 'grabbing' : 'grab',
                                zIndex: draggedNode === conceptNodeId ? 100 : 3,
                                fontSize: '11px',
                                transition: draggedNode === conceptNodeId ? 'none' : 'all 0.2s',
                                userSelect: 'none'
                              }}
                              onMouseEnter={(e) => {
                                if (!draggedNode) {
                                  e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)';
                                  e.currentTarget.style.zIndex = '8';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!draggedNode) {
                                  e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
                                  e.currentTarget.style.zIndex = '3';
                                }
                              }}
                            >
                              <div style={{ fontWeight: 600, fontSize: '10px' }}>
                                {concept.name || concept.id}
                              </div>
                            </div>
                            
                            {/* Line from category to concept */}
                            <svg
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                pointerEvents: 'none',
                                zIndex: 2
                              }}
                            >
                              <line
                                x1={`${catLeft}%`}
                                y1={`${catTop}%`}
                                x2={`${conceptLeft}%`}
                                y2={`${conceptTop}%`}
                                stroke={CATEGORY_COLORS[cat] || 'rgba(148,163,184,0.3)'}
                                strokeWidth="1"
                                strokeDasharray="3,3"
                                opacity="0.5"
                              />
                            </svg>
                            
                            {/* Show factors when category is selected */}
                            {selectedCategory === cat && conceptFactors && conceptFactors.length > 0 && (
                              conceptFactors.map((factor, factorIdx) => {
                                const totalFactors = conceptFactors.length;
                                const factorSpread = Math.min(1.2, totalFactors * 0.15);
                                const factorAngle = conceptAngle + ((factorIdx - (totalFactors - 1) / 2) * (factorSpread / Math.max(1, totalFactors - 1)));
                                const factorRadius = conceptRadius + 12;
                                const defaultFactorTop = 50 + factorRadius * Math.sin(factorAngle);
                                const defaultFactorLeft = 50 + factorRadius * Math.cos(factorAngle);
                                
                                const factorNodeId = `${cat}-concept-${conceptIdx}-factor-${factorIdx}`;
                                const factorPosition = nodePositions[factorNodeId] || { top: defaultFactorTop, left: defaultFactorLeft };
                                const factorTop = factorPosition.top;
                                const factorLeft = factorPosition.left;
                                
                                return (
                                  <div key={`${cat}-concept-${conceptIdx}-factor-${factorIdx}`}>
                                    <div
                                      onMouseDown={(e) => handleNodeMouseDown(e, factorNodeId)}
                                      style={{
                                        position: 'absolute',
                                        top: `${factorTop}%`,
                                        left: `${factorLeft}%`,
                                        transform: 'translate(-50%, -50%)',
                                        minWidth: '80px',
                                        maxWidth: '110px',
                                        padding: '6px 8px',
                                        borderRadius: '6px',
                                        background: 'rgba(255,255,255,0.95)',
                                        color: '#1e293b',
                                        border: `1.5px solid ${CATEGORY_COLORS[cat] || 'rgba(148,163,184,0.5)'}`,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                        cursor: draggedNode === factorNodeId ? 'grabbing' : 'grab',
                                        zIndex: draggedNode === factorNodeId ? 100 : 2,
                                        fontSize: '9px',
                                        transition: draggedNode === factorNodeId ? 'none' : 'all 0.2s',
                                        userSelect: 'none'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!draggedNode) {
                                          e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.08)';
                                          e.currentTarget.style.zIndex = '7';
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!draggedNode) {
                                          e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
                                          e.currentTarget.style.zIndex = '2';
                                        }
                                      }}
                                    >
                                      <div style={{ fontWeight: 600, fontSize: '9px', marginBottom: '2px' }}>
                                        {factor.factor}
                                      </div>
                                      {factor.value && (
                                        <div style={{ fontSize: '8px', opacity: 0.7 }}>
                                          {String(factor.value).slice(0, 30)}{String(factor.value).length > 30 ? '...' : ''}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Line from concept to factor */}
                                    <svg
                                      style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        pointerEvents: 'none',
                                        zIndex: 1
                                      }}
                                    >
                                      <line
                                        x1={`${conceptLeft}%`}
                                        y1={`${conceptTop}%`}
                                        x2={`${factorLeft}%`}
                                        y2={`${factorTop}%`}
                                        stroke={CATEGORY_COLORS[cat] || 'rgba(148,163,184,0.4)'}
                                        strokeWidth="1"
                                        strokeDasharray="2,2"
                                        opacity="0.4"
                                      />
                                    </svg>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                {/* Inter-category relationships */}
                {showRelationships && categorizedData.categoryRelationships?.map((rel, idx) => {
                  const fromIdx = categorizedData.categories.indexOf(rel.fromCategory);
                  const toIdx = categorizedData.categories.indexOf(rel.toCategory);
                  
                  if (fromIdx === -1 || toIdx === -1) return null;

                  const angle1 = (fromIdx / categorizedData.categories.length) * 2 * Math.PI;
                  const angle2 = (toIdx / categorizedData.categories.length) * 2 * Math.PI;
                  const radius = 28;

                  return (
                    <svg
                      key={`inter-rel-${idx}`}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        zIndex: 1
                      }}
                    >
                      <line
                        x1={`${50 + radius * Math.cos(angle1)}%`}
                        y1={`${50 + radius * Math.sin(angle1)}%`}
                        x2={`${50 + radius * Math.cos(angle2)}%`}
                        y2={`${50 + radius * Math.sin(angle2)}%`}
                        stroke="rgba(99, 102, 241, 0.4)"
                        strokeWidth="2"
                        opacity="0.6"
                        strokeDasharray="5,5"
                      />
                      {/* Relationship label */}
                      <text
                        x={`${50 + radius * Math.cos((angle1 + angle2) / 2)}%`}
                        y={`${50 + radius * Math.sin((angle1 + angle2) / 2)}%`}
                        fill="rgba(255,255,255,0.7)"
                        fontSize="10"
                        textAnchor="middle"
                      >
                        {rel.relationshipType || ''}
                      </text>
                    </svg>
                  );
                })}
              </>
            )}
          </>
        ) : (
          // Simple mode - original single document view
          <>
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
          </>
        )}
        </div>
      </div>

      {/* Expanded concept detail panel */}
      {expandedConcept && (
        <div className="glass-card" style={{ 
          width: '380px', 
          padding: '20px', 
          overflowY: 'auto',
          background: 'rgba(15, 23, 42, 0.95)',
          border: `2px solid ${CATEGORY_COLORS[expandedConcept.category] || 'rgba(148,163,184,0.3)'}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>
              {expandedConcept.name}
            </h3>
            <button
              onClick={() => setExpandedConcept(null)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              ✕
            </button>
          </div>

          {/* Category Badge */}
          <div style={{
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: '12px',
            background: CATEGORY_COLORS[expandedConcept.category] || 'rgba(148,163,184,0.3)',
            fontSize: '11px',
            fontWeight: '600',
            marginBottom: '12px'
          }}>
            {expandedConcept.category}
          </div>

          {/* Description */}
          {expandedConcept.description && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(226,232,240,0.8)', marginBottom: '6px' }}>
                📋 Description
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(226,232,240,0.9)', lineHeight: '1.5' }}>
                {expandedConcept.description}
              </div>
            </div>
          )}

          {/* Type */}
          {expandedConcept.type && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(226,232,240,0.8)', marginBottom: '6px' }}>
                🏷️ Type
              </div>
              <div style={{ 
                display: 'inline-block',
                padding: '4px 8px',
                borderRadius: '6px',
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                fontSize: '11px',
                color: 'rgba(226,232,240,0.9)'
              }}>
                {expandedConcept.type}
              </div>
            </div>
          )}

          {/* Importance Score */}
          {expandedConcept.importance && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(226,232,240,0.8)', marginBottom: '6px' }}>
                ⭐ Importance
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  flex: 1, 
                  height: '8px', 
                  background: 'rgba(255,255,255,0.1)', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${expandedConcept.importance * 10}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #10b981, #3b82f6)',
                    transition: 'width 0.3s'
                  }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: '600' }}>
                  {expandedConcept.importance}/10
                </span>
              </div>
            </div>
          )}

          {/* Related Documents */}
          {expandedConcept.relatedDocuments && expandedConcept.relatedDocuments.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(226,232,240,0.8)', marginBottom: '6px' }}>
                📄 Related Documents ({expandedConcept.relatedDocuments.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {expandedConcept.relatedDocuments.map((docId, idx) => (
                  <div key={idx} style={{
                    padding: '6px 8px',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.05)',
                    fontSize: '11px',
                    color: 'rgba(226,232,240,0.8)'
                  }}>
                    {docId}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source Document */}
          {expandedConcept.sourceDoc && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(226,232,240,0.8)', marginBottom: '6px' }}>
                📑 Source Document
              </div>
              <div style={{
                padding: '6px 8px',
                borderRadius: '4px',
                background: 'rgba(255,255,255,0.05)',
                fontSize: '11px',
                color: 'rgba(226,232,240,0.8)'
              }}>
                {expandedConcept.sourceDoc}
              </div>
            </div>
          )}

          {/* Relationships */}
          {categorizedData?.categoryMindMaps?.[expandedConcept.category]?.relationships && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(226,232,240,0.8)', marginBottom: '6px' }}>
                🔗 Relationships
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {categorizedData.categoryMindMaps[expandedConcept.category].relationships
                  .filter(rel => rel.from === expandedConcept.name || rel.to === expandedConcept.name)
                  .map((rel, idx) => (
                    <div key={idx} style={{
                      padding: '8px',
                      borderRadius: '6px',
                      background: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid rgba(99, 102, 241, 0.3)'
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '4px', color: 'rgba(147, 197, 253, 0.9)' }}>
                        {rel.from === expandedConcept.name ? '→' : '←'} {rel.type}
                      </div>
                      <div style={{ fontSize: '10px', color: 'rgba(226,232,240,0.7)' }}>
                        {rel.from === expandedConcept.name ? `To: ${rel.to}` : `From: ${rel.from}`}
                      </div>
                      {rel.description && (
                        <div style={{ fontSize: '10px', color: 'rgba(226,232,240,0.6)', marginTop: '2px' }}>
                          {rel.description}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Factors - Dedicated section for factors array */}
          {expandedConcept.factors && expandedConcept.factors.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(226,232,240,0.8)', marginBottom: '6px' }}>
                🔍 Factors
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {expandedConcept.factors.map((factor, idx) => (
                  <div key={idx} style={{
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '4px', color: 'rgba(167, 243, 208, 0.95)' }}>
                      {factor.factor}
                    </div>
                    {factor.value && (
                      <div style={{ fontSize: '10px', color: 'rgba(226,232,240,0.8)', lineHeight: '1.4' }}>
                        {typeof factor.value === 'object' ? JSON.stringify(factor.value, null, 2) : String(factor.value)}
                      </div>
                    )}
                    {factor.importance && (
                      <div style={{ 
                        marginTop: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <div style={{ 
                          flex: 1, 
                          height: '4px', 
                          background: 'rgba(255,255,255,0.1)', 
                          borderRadius: '2px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${factor.importance * 10}%`,
                            height: '100%',
                            background: 'rgba(16, 185, 129, 0.8)',
                            transition: 'width 0.3s'
                          }} />
                        </div>
                        <span style={{ fontSize: '9px', color: 'rgba(226,232,240,0.6)' }}>
                          {factor.importance}/10
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional properties */}
          {Object.keys(expandedConcept)
            .filter(key => !['name', 'description', 'type', 'importance', 'relatedDocuments', 'sourceDoc', 'category', 'catIdx', 'conceptIdx', 'id'].includes(key))
            .length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(226,232,240,0.8)', marginBottom: '6px' }}>
                📊 Additional Factors
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {Object.entries(expandedConcept)
                  .filter(([key]) => !['name', 'description', 'type', 'importance', 'relatedDocuments', 'sourceDoc', 'category', 'catIdx', 'conceptIdx', 'id'].includes(key))
                  .map(([key, value], idx) => (
                    <div key={idx} style={{
                      padding: '8px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.05)',
                      fontSize: '11px',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ color: 'rgba(226,232,240,0.6)', fontWeight: '600' }}>{key}:</span>
                        <button
                          onClick={() => analyzeFactor(key, value)}
                          disabled={analyzingFactor}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            border: 'none',
                            background: 'rgba(99, 102, 241, 0.3)',
                            color: 'rgba(226,232,240,0.9)',
                            fontSize: '9px',
                            cursor: analyzingFactor ? 'wait' : 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          {analyzingFactor ? '⏳' : '🤖 Ask AI'}
                        </button>
                      </div>
                      <span style={{ color: 'rgba(226,232,240,0.9)' }}>
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* AI Analysis Result */}
          {aiAnalysis && (
            <div style={{ 
              marginTop: '15px',
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '2px solid rgba(99, 102, 241, 0.4)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(147, 197, 253, 0.9)' }}>
                  🤖 AI Analysis: {aiAnalysis.factorKey}
                </div>
                <button
                  onClick={() => setAiAnalysis(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(226,232,240,0.6)',
                    cursor: 'pointer',
                    fontSize: '10px',
                    padding: '2px 4px'
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ 
                fontSize: '11px', 
                color: 'rgba(226,232,240,0.85)', 
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {aiAnalysis.analysis}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
