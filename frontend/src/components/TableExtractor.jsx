import { useState, useEffect } from 'react';
import API from '../api/api';

export default function TableExtractor({ documentId, filename }) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedTable, setExpandedTable] = useState(null);

  useEffect(() => {
    if (documentId) {
      loadTables();
    }
  }, [documentId]);

  const loadTables = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(`📊 Loading tables for document ${documentId}`);
      const response = await API.get(`/metadata/documents/${documentId}/structure`);
      
      if (response.data && response.data.success) {
        const structure = response.data.structure;
        const extractedTables = structure.tables || [];
        setTables(extractedTables);
        console.log(`✅ Found ${extractedTables.length} tables`);
      }
    } catch (err) {
      console.error('❌ Error loading tables:', err);
      setError('Failed to load tables from document');
    } finally {
      setLoading(false);
    }
  };

  if (!documentId) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: 'var(--text-secondary)'
      }}>
        Select a document to view extracted tables
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '14px', marginBottom: '10px' }}>Loading tables...</div>
        <div style={{
          display: 'inline-block',
          width: '20px',
          height: '20px',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          borderTopColor: 'var(--primary-color)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        background: 'rgba(239, 68, 68, 0.1)',
        borderRadius: '8px',
        color: '#ef4444',
        fontSize: '14px'
      }}>
        ⚠️ {error}
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: 'var(--text-secondary)'
      }}>
        📊 No tables found in this document
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px' }}>
      <div style={{
        fontSize: '18px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        📊 Extracted Tables ({tables.length})
      </div>

      {tables.map((table, tableIndex) => (
        <div
          key={tableIndex}
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Table Header */}
          <div
            onClick={() => setExpandedTable(expandedTable === tableIndex ? null : tableIndex)}
            style={{
              padding: '15px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>
                Table {tableIndex + 1}
                {table.title && `: ${table.title}`}
              </div>
              {table.description && (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {table.description}
                </div>
              )}
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {table.headers?.length || 0} columns × {table.rows?.length || 0} rows
              </div>
            </div>
            <div style={{ fontSize: '18px' }}>
              {expandedTable === tableIndex ? '▼' : '▶'}
            </div>
          </div>

          {/* Table Content */}
          {expandedTable === tableIndex && (
            <div style={{
              overflow: 'auto',
              maxHeight: '400px'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px'
              }}>
                {/* Table Headers */}
                {table.headers && table.headers.length > 0 && (
                  <thead>
                    <tr style={{
                      background: 'rgba(99, 102, 241, 0.2)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      {table.headers.map((header, i) => (
                        <th
                          key={i}
                          style={{
                            padding: '12px',
                            textAlign: 'left',
                            fontWeight: '600',
                            borderRight: i < table.headers.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
                          }}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}

                {/* Table Rows */}
                <tbody>
                  {table.rows && table.rows.length > 0 ? (
                    table.rows.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          background: rowIndex % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)'
                        }}
                      >
                        {Array.isArray(row) ? (
                          row.map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              style={{
                                padding: '12px',
                                borderRight: cellIndex < row.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
                              }}
                            >
                              {typeof cell === 'object' ? JSON.stringify(cell) : String(cell)}
                            </td>
                          ))
                        ) : (
                          <td style={{ padding: '12px' }}>
                            {typeof row === 'object' ? JSON.stringify(row) : String(row)}
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={table.headers?.length || 1}
                        style={{
                          padding: '20px',
                          textAlign: 'center',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        No data rows available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
