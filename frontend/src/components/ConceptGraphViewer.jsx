import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000';

// Helper: Call LLM for graph interactions
const callLLM = async (endpoint, data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/ai/graph/${endpoint}`, data);
    return response.data;
  } catch (error) {
    console.error(`LLM call failed (${endpoint}):`, error);
    throw error;
  }
};

// Helper: Find path between two nodes using BFS
const findReasoningPath = (cy, sourceId, targetId) => {
  if (!cy) return null; // Guard against null cy instance
  
  const visited = new Set();
  const queue = [[sourceId, [sourceId]]];

  while (queue.length > 0) {
    const [current, path] = queue.shift();
    if (current === targetId) return path;
    if (visited.has(current)) continue;
    visited.add(current);

    const sourceNode = cy.getElementById(current);
    if (!sourceNode.length) continue; // Node not found, skip
    
    const neighbors = sourceNode.neighborhood('node');
    neighbors.forEach(n => {
      const nid = n.id();
      if (!visited.has(nid)) {
        queue.push([nid, [...path, nid]]);
      }
    });
  }
  return null;
};

// Helper: Create consistent ID from concept name
function makeConceptId(name) {
  if (!name) return 'unknown';
  // Use the name as-is for ID to match relationship references
  return String(name).trim();
}

// 1. Node Builder (Concept → Cytoscape Node)
function buildNodes(concepts) {
  if (!Array.isArray(concepts)) return [];
  return concepts.map((c) => ({
    data: {
      id: makeConceptId(c.id || c.name),  // Use id if available, else name
      label: c.name || c.id || 'Unknown',
      type: c.type || 'supporting',
      definition: c.definition || '',
      examples: c.examples || [],
      pageRange: c.pageRange || [],
      headingPath: c.headingPath || [],
      // Additional metadata for display
      evidence: c.evidence || '',
      openQuestions: c.open_questions || c.openQuestions || [],
      dependsOn: c.depends_on || c.dependsOn || [],
      relatedTo: c.related_to || c.relatedTo || [],
      contrastsWith: c.contrasts_with || c.contrastsWith || [],
      mergedFrom: c.mergedFrom || []
    },
  }));
}

// 2. Edge Builder (Relationship → Cytoscape Edge)
function buildEdges(relationships, nodes) {
  if (!Array.isArray(relationships)) return [];
  
  // Create a Set of valid node IDs for quick lookup
  const validNodeIds = new Set(nodes.map(n => n.data.id));
  
  // Track missing nodes for debugging
  const missingNodes = new Set();
  
  const edges = relationships
    .map((r) => {
      const source = makeConceptId(r.source || r.from);
      const target = makeConceptId(r.target || r.to);
      const relType = r.type || r.relationship || 'related_to';
      
      // Skip edges where source or target node doesn't exist
      if (!validNodeIds.has(source)) {
        if (!missingNodes.has(source)) {
          console.warn(`⚠️ Skipping edge: source node "${source}" not found`);
          missingNodes.add(source);
        }
        return null;
      }
      if (!validNodeIds.has(target)) {
        if (!missingNodes.has(target)) {
          console.warn(`⚠️ Skipping edge: target node "${target}" not found`);
          missingNodes.add(target);
        }
        return null;
      }
      
      return {
        data: {
          id: `${source}_${relType}_${target}`,
          source,
          target,
          relationship: relType,
          description: r.description || '',
          evidence: r.evidence || '',
          strength: r.strength || 'medium'
        },
      };
    })
    .filter(Boolean); // Remove null entries
    
  if (missingNodes.size > 0) {
    console.log(`📝 Available nodes: [${Array.from(validNodeIds).join(', ')}]`);
  }
  
  return edges;
}

export default function ConceptGraphViewer({ mindMap }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const isMountedRef = useRef(false);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [llmResponse, setLlmResponse] = useState(null);
  const [llmLoading, setLlmLoading] = useState(false);
  const [interactionMode, setInteractionMode] = useState('explain'); // 'explain', 'compare', 'chain', 'quiz'

  useEffect(() => {
    // Prevent double initialization in StrictMode
    if (isMountedRef.current) return;
    isMountedRef.current = true;

    if (!containerRef.current || !mindMap) {
      console.log('⚠️ ConceptGraphViewer: Missing container or mindMap', {
        hasContainer: !!containerRef.current,
        hasMindMap: !!mindMap
      });
      return undefined;
    }

    console.log('🎨 Rendering Cytoscape graph with:', {
      concepts: mindMap.concepts?.length || 0,
      relationships: mindMap.relationships?.length || 0
    });

    const nodes = buildNodes(mindMap.concepts);
    const edges = buildEdges(mindMap.relationships, nodes);
    
    console.log('📊 Built elements:', {
      nodeCount: nodes.length,
      edgeCount: edges.length
    });

    if (nodes.length === 0) {
      console.warn('⚠️ No nodes to render in graph');
      return undefined;
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: {
        nodes,
        edges,
      },
      
      // Interaction settings - enable left-click drag
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      autoungrabify: false, // Allow nodes to be dragged with left-click
      autounselectify: false, // Allow selection
      
      // 3. Graph Styling (Readable, Clean, Professional)
      style: [
        // Base node style
        {
          selector: 'node',
          style: {
            'background-color': '#4A90E2',
            'label': 'data(label)',
            'color': '#fff',
            'font-size': '12px',
            'text-wrap': 'wrap',
            'text-max-width': '120px',
            'padding': '10px',
            'shape': 'round-rectangle',
            'width': '150px',
            'height': '40px',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-weight': '500',
            'border-width': 2,
            'border-color': '#ffffff',
            'border-opacity': 0.3
          },
        },
        
        // Type-specific node colors
        {
          selector: 'node[type="core"]',
          style: {
            'background-color': '#1B75D1',
            'font-weight': 'bold',
            'border-color': '#fff',
            'border-width': 3
          }
        },
        {
          selector: 'node[type="supporting"]',
          style: {
            'background-color': '#4A90E2'
          }
        },
        {
          selector: 'node[type="example"]',
          style: {
            'background-color': '#7BC96F'
          }
        },
        {
          selector: 'node[type="definition"]',
          style: {
            'background-color': '#9B59B6'
          }
        },
        {
          selector: 'node[type="method"]',
          style: {
            'background-color': '#F5A623'
          }
        },
        {
          selector: 'node[type="metric"]',
          style: {
            'background-color': '#E67E22'
          }
        },
        {
          selector: 'node[type="assumption"]',
          style: {
            'background-color': '#3498DB'
          }
        },
        {
          selector: 'node[type="limitation"]',
          style: {
            'background-color': '#E74C3C'
          }
        },
        
        // Base edge style
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#999',
            'target-arrow-color': '#999',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(relationship)',
            'font-size': '10px',
            'text-background-color': '#fff',
            'text-background-opacity': 0.8,
            'text-background-padding': '2px',
            'text-rotation': 'autorotate',
            'color': '#666'
          }
        },
        
        // Relationship type-specific edge colors
        {
          selector: 'edge[relationship="depends_on"]',
          style: {
            'line-color': '#F59E0B',
            'target-arrow-color': '#F59E0B',
            'width': 3
          }
        },
        {
          selector: 'edge[relationship="related_to"]',
          style: {
            'line-color': '#3B82F6',
            'target-arrow-color': '#3B82F6'
          }
        },
        {
          selector: 'edge[relationship="contrasts_with"]',
          style: {
            'line-color': '#EF4444',
            'target-arrow-color': '#EF4444',
            'line-style': 'dashed'
          }
        },
        {
          selector: 'edge[relationship="causes"]',
          style: {
            'line-color': '#8B5CF6',
            'target-arrow-color': '#8B5CF6'
          }
        },
        {
          selector: 'edge[relationship="caused_by"]',
          style: {
            'line-color': '#FB923C',
            'target-arrow-color': '#FB923C'
          }
        },
        {
          selector: 'edge[relationship="example_of"]',
          style: {
            'line-color': '#10B981',
            'target-arrow-color': '#10B981'
          }
        },
        {
          selector: 'edge[relationship="part_of"]',
          style: {
            'line-color': '#06B6D4',
            'target-arrow-color': '#06B6D4'
          }
        },
        {
          selector: 'edge[relationship="parent_child"]',
          style: {
            'line-color': '#22C55E',
            'target-arrow-color': '#22C55E',
            'width': 3
          }
        },
        
        // Hover/highlight styles
        {
          selector: '.highlight',
          style: {
            'line-color': '#FF5722',
            'target-arrow-color': '#FF5722',
            'width': 3,
            'z-index': 999
          }
        },
        {
          selector: 'node.highlighted',
          style: {
            'border-width': 4,
            'border-color': '#FF5722',
            'z-index': 999
          }
        }
      ],
      
      // 4. Graph Layout (Cose) - Disable animations to prevent cleanup errors
      layout: {
        name: 'cose',
        animate: false, // Disable animation to prevent race conditions
        padding: 30,
        nodeRepulsion: 8000,
        idealEdgeLength: 120,
        edgeElasticity: 100,
        nestingFactor: 1.2,
        gravity: 1,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0
      },
    });

    // Store cy reference for later use
    cyRef.current = cy;
    
    // Helper to check if cy instance is still valid
    const isCyValid = () => {
      return cyRef.current && !cyRef.current.destroyed();
    };

    // 6. Interactivity - Tap node for different modes (tap = click without drag)
    cy.on('tap', 'node', async (event) => {
      if (!isCyValid()) return; // Guard against destroyed instance
      const node = event.target;
      const nodeData = node.data();
      const conceptName = nodeData.label;

      if (!Array.isArray(mindMap.concepts)) {
        setSelectedConcept(null);
        return;
      }

      const original = mindMap.concepts.find((c) => (c.name || c.id || '').trim() === (conceptName || '').trim());

      const conceptData = original || {
        name: conceptName || 'Unnamed concept',
        type: nodeData.type || 'supporting',
        definition: nodeData.definition || '',
        examples: nodeData.examples || [],
        evidence: nodeData.evidence || '',
        openQuestions: nodeData.openQuestions || [],
        mergedFrom: nodeData.mergedFrom || [],
        dependsOn: nodeData.dependsOn || [],
        relatedTo: nodeData.relatedTo || [],
        contrastsWith: nodeData.contrastsWith || [],
        chunkIds: [],
        primaryChunkId: null,
        headingPathFromChunks: [],
        pageRangeFromChunks: [],
      };

      if (original) {
        conceptData.name = original.name || conceptName || 'Unnamed concept';
        conceptData.type = original.type || nodeData.type || 'supporting';
        conceptData.definition = original.definition || nodeData.definition || '';
        conceptData.examples = original.examples || nodeData.examples || [];
        conceptData.evidence = original.evidence || nodeData.evidence || '';
        conceptData.openQuestions = original.open_questions || original.openQuestions || nodeData.openQuestions || [];
        conceptData.mergedFrom = original.mergedFrom || nodeData.mergedFrom || [];
        conceptData.dependsOn = original.depends_on || original.dependsOn || nodeData.dependsOn || [];
        conceptData.relatedTo = original.related_to || original.relatedTo || nodeData.relatedTo || [];
        conceptData.contrastsWith = original.contrasts_with || original.contrastsWith || nodeData.contrastsWith || [];
        conceptData.chunkIds = Array.isArray(original.chunkIds) ? original.chunkIds : [];
        conceptData.primaryChunkId = original.primaryChunkId || null;
        conceptData.headingPathFromChunks = Array.isArray(original.headingPathFromChunks)
          ? original.headingPathFromChunks
          : [];
        conceptData.pageRangeFromChunks = Array.isArray(original.pageRangeFromChunks)
          ? original.pageRangeFromChunks
          : [];
      }

      setSelectedConcept(conceptData);

      // Handle interaction modes
      const nodeId = node.id();
      
      if (interactionMode === 'compare') {
        // Multi-select mode for comparison
        setSelectedNodes(prev => {
          if (prev.includes(nodeId)) {
            // Deselect
            node.removeClass('selected');
            return prev.filter(id => id !== nodeId);
          } else if (prev.length < 2) {
            // Select (max 2)
            node.addClass('selected');
            const newSelection = [...prev, nodeId];
            
            // If 2 nodes selected, trigger comparison
            if (newSelection.length === 2) {
              const nodeA = cy.getElementById(newSelection[0]);
              const nodeB = cy.getElementById(newSelection[1]);
              handleCompareConcepts(nodeA.data(), nodeB.data());
              
              // Clear selection
              cy.nodes().removeClass('selected');
              return [];
            }
            
            return newSelection;
          }
          return prev;
        });
      } else if (interactionMode === 'explain') {
        // Explain mode - get neighbors and explain
        const neighbors = node.neighborhood('node');
        const neighborData = neighbors.map(n => n.data());
        handleExplainConcept(nodeData, neighborData);
      } else {
        // Default mode - allow selection for Reasoning Chain (max 2 nodes)
        setSelectedNodes(prev => {
          if (prev.includes(nodeId)) {
            // Deselect
            node.removeClass('selected');
            return prev.filter(id => id !== nodeId);
          } else if (prev.length < 2) {
            // Select (max 2)
            node.addClass('selected');
            return [...prev, nodeId];
          }
          return prev;
        });
      }
    });
    
    // Right-click context menu for quiz generation
    cy.on('cxttap', 'node', (evt) => {
      if (!isCyValid()) return; // Guard against destroyed instance
      const nodeData = evt.target.data();
      handleGenerateQuiz(nodeData);
    });
    
    // 6. Interactivity - Hover to highlight connected edges
    cy.on('mouseover', 'node', (evt) => {
      if (!isCyValid()) return; // Guard against destroyed instance
      evt.target.connectedEdges().addClass('highlight');
      evt.target.addClass('highlighted');
    });
    
    cy.on('mouseout', 'node', (evt) => {
      if (!isCyValid()) return; // Guard against destroyed instance
      evt.target.connectedEdges().removeClass('highlight');
      evt.target.removeClass('highlighted');
    });
    
    // Double-click to center and zoom to node
    cy.on('dbltap', 'node', (evt) => {
      if (!isCyValid()) return; // Guard against destroyed instance
      cy.animate({
        fit: {
          eles: evt.target,
          padding: 50
        },
        duration: 500
      });
    });

    return () => {
      isMountedRef.current = false;
      const currentCy = cyRef.current;
      if (currentCy && !currentCy.destroyed()) {
        try {
          // Stop all animations and layouts immediately
          currentCy.stop();
          
          // Remove all event listeners
          currentCy.removeAllListeners();
          
          // Destroy the instance
          currentCy.destroy();
        } catch (e) {
          // Ignore errors if already destroyed
          console.warn('Cytoscape cleanup warning:', e.message);
        } finally {
          cyRef.current = null;
        }
      }
    };
  }, [mindMap, interactionMode]);

  // LLM Handler Functions
  const handleExplainConcept = async (concept, neighbors) => {
    setLlmLoading(true);
    setLlmResponse(null);
    
    try {
      const response = await callLLM('explain-concept', {
        concept: {
          label: concept.label,
          definition: concept.definition,
          type: concept.type,
          examples: concept.examples,
          dependsOn: concept.dependsOn,
          relatedTo: concept.relatedTo
        },
        neighbors: neighbors.map(n => ({
          label: n.label,
          type: n.type
        }))
      });
      
      setLlmResponse({
        type: 'explanation',
        title: `💡 Explain: ${concept.label}`,
        content: response.explanation
      });
    } catch (error) {
      setLlmResponse({
        type: 'error',
        title: '❌ Error',
        content: `Failed to explain concept: ${error.message}`
      });
    } finally {
      setLlmLoading(false);
    }
  };

  const handleCompareConcepts = async (conceptA, conceptB) => {
    setLlmLoading(true);
    setLlmResponse(null);
    
    try {
      const response = await callLLM('compare-concepts', {
        conceptA: {
          label: conceptA.label,
          definition: conceptA.definition,
          type: conceptA.type,
          examples: conceptA.examples,
          dependsOn: conceptA.dependsOn
        },
        conceptB: {
          label: conceptB.label,
          definition: conceptB.definition,
          type: conceptB.type,
          examples: conceptB.examples,
          dependsOn: conceptB.dependsOn
        }
      });
      
      setLlmResponse({
        type: 'comparison',
        title: `🔄 Compare: ${conceptA.label} vs ${conceptB.label}`,
        content: response.comparison
      });
    } catch (error) {
      setLlmResponse({
        type: 'error',
        title: '❌ Error',
        content: `Failed to compare concepts: ${error.message}`
      });
    } finally {
      setLlmLoading(false);
    }
  };

  const handleExplainReasoningChain = async () => {
    if (selectedNodes.length !== 2) {
      alert('Please select exactly 2 nodes to find reasoning chain');
      return;
    }

    const cy = cyRef.current;
    if (!cy) return;

    const path = findReasoningPath(cy, selectedNodes[0], selectedNodes[1]);
    
    if (!path) {
      setLlmResponse({
        type: 'error',
        title: '❌ No Path Found',
        content: 'No reasoning chain found between the selected concepts.'
      });
      return;
    }

    setLlmLoading(true);
    setLlmResponse(null);
    
    try {
      const concepts = path.map(nodeId => {
        const node = cy.getElementById(nodeId);
        return {
          label: node.data('label'),
          definition: node.data('definition'),
          type: node.data('type')
        };
      });

      const response = await callLLM('reasoning-chain', { concepts });
      
      setLlmResponse({
        type: 'reasoning',
        title: `🔗 Reasoning Chain: ${concepts[0].label} → ${concepts[concepts.length - 1].label}`,
        content: response.explanation
      });
    } catch (error) {
      setLlmResponse({
        type: 'error',
        title: '❌ Error',
        content: `Failed to explain reasoning chain: ${error.message}`
      });
    } finally {
      setLlmLoading(false);
      // Clear selection
      cy.nodes().removeClass('selected');
      setSelectedNodes([]);
    }
  };

  const handleGenerateQuiz = async (concept) => {
    setLlmLoading(true);
    setLlmResponse(null);
    
    try {
      const response = await callLLM('generate-quiz', {
        concept: {
          label: concept.label,
          definition: concept.definition,
          type: concept.type,
          examples: concept.examples,
          relatedTo: concept.relatedTo,
          dependsOn: concept.dependsOn
        }
      });
      
      setLlmResponse({
        type: 'quiz',
        title: `📝 Quiz: ${concept.label}`,
        content: response.quiz
      });
    } catch (error) {
      setLlmResponse({
        type: 'error',
        title: '❌ Error',
        content: `Failed to generate quiz: ${error.message}`
      });
    } finally {
      setLlmLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Interaction Mode Selector */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        padding: '12px', 
        background: 'rgba(255,255,255,0.05)', 
        borderRadius: '8px',
        border: '1px solid rgba(99, 102, 241, 0.3)'
      }}>
        <div style={{ fontSize: '13px', fontWeight: '600', marginRight: '8px', display: 'flex', alignItems: 'center' }}>
          🤖 AI Mode:
        </div>
        <button
          onClick={() => setInteractionMode('explain')}
          style={{
            padding: '4px 12px',
            fontSize: '11px',
            borderRadius: '4px',
            border: 'none',
            background: interactionMode === 'explain' ? '#6366F1' : 'rgba(255,255,255,0.1)',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: interactionMode === 'explain' ? '600' : '400'
          }}
        >
          💡 Explain
        </button>
        <button
          onClick={() => {
            setInteractionMode('compare');
            setSelectedNodes([]);
            if (cyRef.current) cyRef.current.nodes().removeClass('selected');
          }}
          style={{
            padding: '4px 12px',
            fontSize: '11px',
            borderRadius: '4px',
            border: 'none',
            background: interactionMode === 'compare' ? '#6366F1' : 'rgba(255,255,255,0.1)',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: interactionMode === 'compare' ? '600' : '400'
          }}
        >
          🔄 Compare {selectedNodes.length > 0 && `(${selectedNodes.length}/2)`}
        </button>
        <button
          onClick={handleExplainReasoningChain}
          disabled={selectedNodes.length !== 2}
          style={{
            padding: '4px 12px',
            fontSize: '11px',
            borderRadius: '4px',
            border: 'none',
            background: selectedNodes.length === 2 ? '#10B981' : 'rgba(255,255,255,0.1)',
            color: selectedNodes.length === 2 ? '#fff' : 'rgba(255,255,255,0.5)',
            cursor: selectedNodes.length === 2 ? 'pointer' : 'not-allowed',
            fontWeight: selectedNodes.length === 2 ? '600' : '400'
          }}
        >
          🔗 Reasoning Chain {selectedNodes.length > 0 && `(${selectedNodes.length}/2)`}
        </button>
        <div style={{ 
          marginLeft: 'auto', 
          fontSize: '11px', 
          color: 'rgba(255,255,255,0.6)', 
          display: 'flex', 
          alignItems: 'center' 
        }}>
          💡 Right-click node for quiz
        </div>
      </div>
      
      <div
        ref={containerRef}
        style={{ 
          width: '100%', 
          height: '480px', 
          borderRadius: '12px', 
          overflow: 'hidden',
          background: 'white',
          backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          border: '1px solid rgba(148, 163, 184, 0.3)'
        }}
      />

      {/* LLM Response Panel */}
      {llmResponse && (
        <div
          className="glass-card"
          style={{ padding: '16px', fontSize: '13px', position: 'relative' }}
        >
          <button
            onClick={() => setLlmResponse(null)}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            ✕ Close
          </button>
          
          <div style={{ marginBottom: '12px', fontWeight: 700, fontSize: '15px', color: 'var(--primary-color)', paddingRight: '60px' }}>
            {llmResponse.title}
          </div>
          
          <div style={{ 
            color: 'rgba(255,255,255,0.85)', 
            lineHeight: '1.7', 
            whiteSpace: 'pre-wrap',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {llmResponse.content}
          </div>
        </div>
      )}

      {llmLoading && (
        <div
          className="glass-card"
          style={{ 
            padding: '20px', 
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}
        >
          <div style={{ 
            width: '16px', 
            height: '16px', 
            border: '2px solid rgba(99, 102, 241, 0.3)',
            borderTopColor: '#6366F1',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
            🤖 AI is thinking...
          </span>
        </div>
      )}

      {selectedConcept && (
        <div
          className="glass-card"
          style={{ padding: '16px', fontSize: '13px' }}
        >
          <div style={{ marginBottom: '10px', fontWeight: 700, fontSize: '15px', color: 'var(--primary-color)' }}>
            📚 {selectedConcept.name}
          </div>
          
          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              padding: '3px 8px', 
              background: 'rgba(99, 102, 241, 0.2)', 
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '600',
              color: 'rgba(255,255,255,0.9)'
            }}>
              {selectedConcept.type}
            </span>
            
            {selectedConcept.mergedFrom && selectedConcept.mergedFrom.length > 0 && (
              <span style={{ 
                padding: '3px 8px', 
                background: 'rgba(34, 197, 94, 0.2)', 
                borderRadius: '4px',
                fontSize: '10px',
                color: 'rgba(255,255,255,0.8)'
              }}>
                Merged from: {selectedConcept.mergedFrom.join(', ')}
              </span>
            )}
          </div>
          
          {selectedConcept.definition && (
            <div style={{ marginBottom: '10px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
              <strong>Definition:</strong> {selectedConcept.definition}
            </div>
          )}
          
          {selectedConcept.examples && selectedConcept.examples.length > 0 && (
            <div style={{ marginBottom: '10px', color: 'rgba(255,255,255,0.75)' }}>
              <strong>Examples:</strong>
              <ul style={{ marginTop: '4px', paddingLeft: '20px', marginBottom: 0 }}>
                {selectedConcept.examples.map((ex, idx) => (
                  <li key={idx} style={{ marginBottom: '2px' }}>{ex}</li>
                ))}
              </ul>
            </div>
          )}
          
          {selectedConcept.dependsOn && selectedConcept.dependsOn.length > 0 && (
            <div style={{ marginBottom: '8px', padding: '8px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '4px', fontSize: '12px' }}>
              <strong style={{ color: '#F59E0B' }}>⚠️ Depends on:</strong> {selectedConcept.dependsOn.join(', ')}
            </div>
          )}
          
          {selectedConcept.relatedTo && selectedConcept.relatedTo.length > 0 && (
            <div style={{ marginBottom: '8px', padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px', fontSize: '12px' }}>
              <strong style={{ color: '#3B82F6' }}>🔗 Related to:</strong> {selectedConcept.relatedTo.join(', ')}
            </div>
          )}
          
          {selectedConcept.contrastsWith && selectedConcept.contrastsWith.length > 0 && (
            <div style={{ marginBottom: '8px', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px', fontSize: '12px' }}>
              <strong style={{ color: '#EF4444' }}>↔️ Contrasts with:</strong> {selectedConcept.contrastsWith.join(', ')}
            </div>
          )}
          
          {selectedConcept.evidence && (
            <div style={{ marginBottom: '8px', padding: '8px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '4px', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
              <strong style={{ color: '#8B5CF6' }}>📝 Evidence:</strong> {selectedConcept.evidence}
            </div>
          )}
          
          {selectedConcept.openQuestions && selectedConcept.openQuestions.length > 0 && (
            <div style={{ marginBottom: '10px', padding: '8px', background: 'rgba(249, 115, 22, 0.1)', borderRadius: '4px', fontSize: '12px' }}>
              <strong style={{ color: '#F97316' }}>❓ Open Questions:</strong>
              <ul style={{ marginTop: '4px', paddingLeft: '20px', marginBottom: 0 }}>
                {selectedConcept.openQuestions.map((q, idx) => (
                  <li key={idx} style={{ marginBottom: '2px', color: 'rgba(255,255,255,0.75)' }}>{q}</li>
                ))}
              </ul>
            </div>
          )}
          
          {selectedConcept.headingPathFromChunks && selectedConcept.headingPathFromChunks.length > 0 && (
            <div style={{ marginBottom: '6px', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
              📍 <strong>Location:</strong> {selectedConcept.headingPathFromChunks.join(' › ')}
            </div>
          )}
          
          {selectedConcept.pageRangeFromChunks && selectedConcept.pageRangeFromChunks.length > 0 && (
            <div style={{ marginBottom: '6px', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
              📄 <strong>Pages:</strong> {Math.min(...selectedConcept.pageRangeFromChunks)}
              {selectedConcept.pageRangeFromChunks.length > 1 &&
                `–${Math.max(...selectedConcept.pageRangeFromChunks)}`}
            </div>
          )}
          
          {selectedConcept.primaryChunkId && (
            <div style={{ marginBottom: '4px', color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
              🔖 Primary chunk: <code style={{ padding: '2px 4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>{selectedConcept.primaryChunkId}</code>
            </div>
          )}
          
          {selectedConcept.chunkIds && selectedConcept.chunkIds.length > 1 && (
            <div style={{ marginTop: '4px', color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
              📎 Other chunks: {selectedConcept.chunkIds.filter((id) => id !== selectedConcept.primaryChunkId).join(', ')}
            </div>
          )}
          
          <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '4px', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
            💡 <strong>Tip:</strong> Double-click node to zoom in | Hover to highlight connections
          </div>
        </div>
      )}
    </div>
  );
}
