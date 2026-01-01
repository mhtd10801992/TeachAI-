import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';

function buildNodes(concepts) {
  if (!Array.isArray(concepts)) return [];
  return concepts.map((c) => ({
    data: {
      id: c.name || `concept-${Math.random().toString(36).slice(2)}`,
      label: c.name || 'Unnamed concept',
      type: c.type || 'supporting',
      definition: c.definition || '',
    },
  }));
}

function buildEdges(relationships) {
  if (!Array.isArray(relationships)) return [];
  return relationships.map((r, index) => ({
    data: {
      id: r.id || `rel-${index}`,
      source: r.from,
      target: r.to,
      relationship: r.type || 'related',
      description: r.description || '',
      evidence: r.evidence || '',
    },
  }));
}

export default function ConceptGraphViewer({ mindMap }) {
  const containerRef = useRef(null);
  const [selectedConcept, setSelectedConcept] = useState(null);

  useEffect(() => {
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
    const edges = buildEdges(mindMap.relationships);
    
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
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#4A90E2',
            label: 'data(label)',
            'font-size': '11px',
            'text-wrap': 'wrap',
            'text-max-width': '120px',
            width: 140,
            height: 50,
            shape: 'round-rectangle',
            color: '#ffffff',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-weight': '500',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': '#888',
            'target-arrow-color': '#888',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(relationship)',
            'font-size': '10px',
            'text-rotation': 'autorotate',
            'text-background-color': '#020617',
            'text-background-opacity': 0.8,
            'text-background-padding': 2,
          },
        },
        {
          selector: 'node[type = "core"]',
          style: {
            'background-color': '#22c55e',
          },
        },
        {
          selector: 'node[type = "limitation"]',
          style: {
            'background-color': '#ef4444',
          },
        },
      ],
      layout: {
        name: 'cose',
        animate: true,
      },
    });

    // Handle node selection to expose chunk grounding information
    cy.on('tap', 'node', (event) => {
      const nodeData = event.target.data();
      const conceptName = nodeData.label;

      if (!Array.isArray(mindMap.concepts)) {
        setSelectedConcept(null);
        return;
      }

      const original = mindMap.concepts.find((c) => (c.name || '').trim() === (conceptName || '').trim());

      if (!original) {
        setSelectedConcept({
          name: conceptName || 'Unnamed concept',
          type: nodeData.type || 'supporting',
          definition: nodeData.definition || '',
          chunkIds: [],
          primaryChunkId: null,
          headingPathFromChunks: [],
          pageRangeFromChunks: [],
        });
        return;
      }

      setSelectedConcept({
        name: original.name || conceptName || 'Unnamed concept',
        type: original.type || nodeData.type || 'supporting',
        definition: original.definition || nodeData.definition || '',
        chunkIds: Array.isArray(original.chunkIds) ? original.chunkIds : [],
        primaryChunkId: original.primaryChunkId || null,
        headingPathFromChunks: Array.isArray(original.headingPathFromChunks)
          ? original.headingPathFromChunks
          : [],
        pageRangeFromChunks: Array.isArray(original.pageRangeFromChunks)
          ? original.pageRangeFromChunks
          : [],
      });
    });

    return () => {
      cy.destroy();
    };
  }, [mindMap]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

      {selectedConcept && (
        <div
          className="glass-card"
          style={{ padding: '12px 16px', fontSize: '13px' }}
        >
          <div style={{ marginBottom: '6px', fontWeight: 600 }}>
            Selected concept: {selectedConcept.name}
          </div>
          <div style={{ marginBottom: '4px', color: 'var(--text-secondary)' }}>
            Type: <span style={{ fontWeight: 500 }}>{selectedConcept.type}</span>
          </div>
          {selectedConcept.definition && (
            <div style={{ marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Definition: {selectedConcept.definition}
            </div>
          )}
          {selectedConcept.headingPathFromChunks.length > 0 && (
            <div style={{ marginBottom: '4px', color: 'var(--text-secondary)' }}>
              Heading path: {selectedConcept.headingPathFromChunks.join(' › ')}
            </div>
          )}
          {selectedConcept.pageRangeFromChunks.length > 0 && (
            <div style={{ marginBottom: '4px', color: 'var(--text-secondary)' }}>
              Pages: {Math.min(...selectedConcept.pageRangeFromChunks)}
              {selectedConcept.pageRangeFromChunks.length > 1 &&
                `–${Math.max(...selectedConcept.pageRangeFromChunks)}`}
            </div>
          )}
          {selectedConcept.primaryChunkId && (
            <div style={{ marginBottom: '2px', color: 'var(--text-secondary)' }}>
              Primary chunk: <code>{selectedConcept.primaryChunkId}</code>
            </div>
          )}
          {selectedConcept.chunkIds.length > 1 && (
            <div style={{ marginTop: '2px', color: 'var(--text-secondary)' }}>
              Other chunks: {selectedConcept.chunkIds.filter((id) => id !== selectedConcept.primaryChunkId).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
