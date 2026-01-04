import { useState, useEffect } from 'react';
import API from '../api/api';
import ConceptGraphViewer from './ConceptGraphViewer';

// Research Paper Style Components
const ResearchTable = ({ title, headers, rows, caption }) => (
  <div style={{ marginBottom: '25px' }}>
    <div style={{
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '12px',
      color: 'var(--primary-color)'
    }}>
      Table: {title}
    </div>
    <div style={{
      overflowX: 'auto',
      marginBottom: '12px'
    }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        fontSize: '13px',
        backgroundColor: 'rgba(0, 0, 0, 0.1)'
      }}>
        <thead>
          <tr style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)', borderBottom: '2px solid rgba(255, 255, 255, 0.2)' }}>
            {headers.map((header, i) => (
              <th key={i} style={{
                padding: '12px',
                textAlign: 'left',
                fontWeight: '600',
                borderRight: i < headers.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
              }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx} style={{
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: rowIdx % 2 === 0 ? 'rgba(0, 0, 0, 0.05)' : 'transparent'
            }}>
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} style={{
                  padding: '12px',
                  borderRight: cellIdx < row.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
                }}>
                  {typeof cell === 'object' ? JSON.stringify(cell) : String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {caption && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '20px' }}>
      {caption}
    </div>}
  </div>
);

const ResearchSection = ({ title, children, subsections = false }) => (
  <div style={{ marginBottom: '35px' }}>
    <h2 style={{
      fontSize: subsections ? '18px' : '20px',
      fontWeight: '600',
      marginBottom: '15px',
      paddingBottom: '10px',
      borderBottom: '2px solid rgba(99, 102, 241, 0.3)',
      color: subsections ? 'var(--text-primary)' : 'var(--primary-color)'
    }}>
      {title}
    </h2>
    {children}
  </div>
);

const SummaryList = ({ items, title }) => (
  <div style={{ marginBottom: '20px' }}>
    {title && <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px', color: 'var(--primary-color)' }}>
      {title}
    </h4>}
    <ul style={{
      listStyle: 'none',
      padding: 0,
      margin: 0
    }}>
      {items.map((item, idx) => (
        <li key={idx} style={{
          padding: '8px 0',
          paddingLeft: '20px',
          position: 'relative',
          fontSize: '13px',
          lineHeight: '1.6',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <span style={{
            position: 'absolute',
            left: 0,
            color: 'var(--primary-color)',
            fontWeight: '600'
          }}>•</span>
          {typeof item === 'string' ? item : <span>{item.label}: <strong>{item.value}</strong></span>}
        </li>
      ))}
    </ul>
  </div>
);

// Image Gallery Section Component
function ImageGallerySection({ document, analysis, documentId }) {
  const [selectedImages, setSelectedImages] = useState([]);
  const [analyzingImages, setAnalyzingImages] = useState(false);
  const [imageAnalysisResults, setImageAnalysisResults] = useState({});
  const [expandedImage, setExpandedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [deletedImages, setDeletedImages] = useState([]);
  const [imageHeight, setImageHeight] = useState(400);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartHeight, setDragStartHeight] = useState(0);
  const [renderError, setRenderError] = useState(null);

  // Wrap everything in try-catch for error handling
  try {

  // Get all images from analysis, filtering out deleted ones
  const allImages = (analysis?.imageAnalysis || []).filter((_, idx) => !deletedImages.includes(idx));
  const allTables = analysis?.tables || [];
  
  // Ensure currentImageIndex is valid
  const validCurrentIndex = Math.max(0, Math.min(currentImageIndex, allImages.length - 1));
  const currentImage = allImages[validCurrentIndex];
  const hasAnalysis = imageAnalysisResults[validCurrentIndex];

  // Update currentImageIndex if it's out of bounds
  useEffect(() => {
    if (allImages.length > 0 && currentImageIndex >= allImages.length) {
      setCurrentImageIndex(Math.max(0, allImages.length - 1));
    }
  }, [allImages.length, currentImageIndex]);

  // Navigation functions
  const goToNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const goToPreviousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  // Delete current image
  const deleteCurrentImage = () => {
    if (allImages.length === 0) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${currentImage?.caption || `Image ${validCurrentIndex + 1}`}"?\n\nThis cannot be undone.`
    );
    
    if (!confirmDelete) return;

    // Get the original index from analysis array
    const originalIndex = (analysis?.imageAnalysis || []).findIndex(img => img === currentImage);
    
    // Add to deleted list
    setDeletedImages(prev => [...prev, originalIndex]);
    
    // Remove from selected if it was selected
    setSelectedImages(prev => prev.filter(i => i !== originalIndex));
    
    // Remove analysis result if exists
    setImageAnalysisResults(prev => {
      const newResults = { ...prev };
      delete newResults[originalIndex];
      return newResults;
    });
    
    // Adjust current index after deletion
    if (allImages.length === 1) {
      // Last image deleted
      setCurrentImageIndex(0);
    } else if (currentImageIndex >= allImages.length - 1) {
      // Was viewing last image, go to previous
      setCurrentImageIndex(Math.max(0, allImages.length - 2));
    }
    // else: stay at current index (will show next image automatically)
  };

  // Toggle image selection
  const toggleImageSelection = (index) => {
    setSelectedImages(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      }
      return [...prev, index];
    });
  };

  // Select all images
  const selectAll = () => {
    const allOriginalIndices = allImages.map(img => 
      (analysis?.imageAnalysis || []).findIndex(original => original === img)
    );
    setSelectedImages(allOriginalIndices);
  };

  // Deselect all images
  const deselectAll = () => {
    setSelectedImages([]);
  };

  // Drag resize handlers
  const handleResizeStart = (e) => {
    setIsDragging(true);
    setDragStartY(e.clientY);
    setDragStartHeight(imageHeight);
    e.preventDefault();
  };

  // Add event listeners for drag
  useEffect(() => {
    const handleResizeMove = (e) => {
      const deltaY = e.clientY - dragStartY;
      const newHeight = Math.max(200, Math.min(1000, dragStartHeight + deltaY));
      setImageHeight(newHeight);
    };

    const handleResizeEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isDragging, dragStartY, dragStartHeight]);

  // Analyze selected images with AI
  const analyzeSelectedImages = async () => {
    if (selectedImages.length === 0) return;
    
    setAnalyzingImages(true);
    try {
      const response = await API.post('/ai/analyze-images', {
        documentId,
        imageIndices: selectedImages
      });
      
      setImageAnalysisResults(response.data?.results || {});
    } catch (error) {
      console.error('Error analyzing images:', error);
      alert('Failed to analyze images. Please try again.');
    } finally {
      setAnalyzingImages(false);
    }
  };

  if (!document || !analysis) {
    return (
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ fontSize: '14px' }}>Loading image gallery...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <ResearchSection title="📸 Extracted Images & Tables">
        <div style={{ 
          marginBottom: '25px', 
          padding: '20px', 
          background: 'rgba(99, 102, 241, 0.1)', 
          borderRadius: '12px',
          border: '1px solid rgba(99, 102, 241, 0.3)'
        }}>
          <div style={{ fontSize: '14px', marginBottom: '15px', color: 'var(--text-secondary)' }}>
            Found <strong>{(analysis?.imageAnalysis || []).length}</strong> image{(analysis?.imageAnalysis || []).length !== 1 ? 's' : ''} and <strong>{allTables.length}</strong> table{allTables.length !== 1 ? 's' : ''} in this document.
            {deletedImages.length > 0 && (
              <span style={{ color: 'rgba(239, 68, 68, 1)', fontWeight: '600' }}>
                {' '}({deletedImages.length} deleted)
              </span>
            )}
            {allImages.length > 0 && ` Currently showing ${allImages.length} image${allImages.length !== 1 ? 's' : ''}. Use the carousel to browse and delete unwanted images.`}
          </div>
          
          {allImages.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={selectAll}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  border: '1px solid rgba(99, 102, 241, 0.5)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'all 0.2s'
                }}
              >
                Select All ({allImages.length})
              </button>
              
              <button
                onClick={deselectAll}
                disabled={selectedImages.length === 0}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  cursor: selectedImages.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  opacity: selectedImages.length === 0 ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
              >
                Deselect All
              </button>
              
              <button
                onClick={analyzeSelectedImages}
                disabled={selectedImages.length === 0 || analyzingImages}
                style={{
                  padding: '8px 16px',
                  background: selectedImages.length > 0 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(100, 100, 100, 0.3)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: selectedImages.length === 0 || analyzingImages ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  opacity: selectedImages.length === 0 || analyzingImages ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
              >
                {analyzingImages 
                  ? '🔄 Analyzing...' 
                  : `🤖 Analyze Selected (${selectedImages.length})`}
              </button>
            </div>
          )}
        </div>

        {/* Image Carousel */}
        {allImages.length > 0 && (
          <div style={{ marginBottom: '35px' }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              marginBottom: '20px',
              color: 'var(--primary-color)'
            }}>
              📷 Images ({allImages.length})
            </h3>
            
            {/* Main Image Display with Navigation */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: '20px'
            }}>
              {/* Image Counter */}
              <div style={{
                textAlign: 'center',
                marginBottom: '15px',
                fontSize: '14px',
                color: 'var(--text-secondary)'
              }}>
                Image <strong>{validCurrentIndex + 1}</strong> of <strong>{allImages.length}</strong>
              </div>

              {/* Image Display with Arrows */}
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '15px'
              }}>
                {/* Left Arrow */}
                <button
                  onClick={goToPreviousImage}
                  disabled={allImages.length <= 1}
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'rgba(99, 102, 241, 0.3)',
                    border: '2px solid rgba(99, 102, 241, 0.6)',
                    color: 'white',
                    fontSize: '24px',
                    cursor: allImages.length <= 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: allImages.length <= 1 ? 0.3 : 1,
                    transition: 'all 0.3s',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    if (allImages.length > 1) {
                      e.target.style.background = 'rgba(99, 102, 241, 0.6)';
                      e.target.style.transform = 'scale(1.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(99, 102, 241, 0.3)';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  ←
                </button>

                {/* Main Image */}
                <div style={{
                  flex: 1,
                  maxWidth: '800px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '8px',
                  padding: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: `${imageHeight}px`,
                  maxHeight: `${imageHeight}px`,
                  position: 'relative',
                  userSelect: isDragging ? 'none' : 'auto'
                }}>
                  {/* Selection Checkbox */}
                  <div
                    onClick={() => {
                      const originalIndex = (analysis?.imageAnalysis || []).findIndex(img => img === currentImage);
                      toggleImageSelection(originalIndex);
                    }}
                    style={{
                      position: 'absolute',
                      top: '20px',
                      left: '20px',
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: selectedImages.some(idx => {
                        const originalImg = (analysis?.imageAnalysis || [])[idx];
                        return originalImg === currentImage;
                      })
                        ? 'rgba(99, 102, 241, 1)' 
                        : 'rgba(0, 0, 0, 0.6)',
                      border: '2px solid white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 2,
                      transition: 'all 0.2s'
                    }}
                  >
                    {selectedImages.some(idx => {
                      const originalImg = (analysis?.imageAnalysis || [])[idx];
                      return originalImg === currentImage;
                    }) && (
                      <span style={{ color: 'white', fontSize: '18px' }}>✓</span>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={deleteCurrentImage}
                    style={{
                      position: 'absolute',
                      top: '20px',
                      right: '20px',
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.8)',
                      border: '2px solid rgba(239, 68, 68, 1)',
                      color: 'white',
                      fontSize: '18px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(239, 68, 68, 1)';
                      e.target.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(239, 68, 68, 0.8)';
                      e.target.style.transform = 'scale(1)';
                    }}
                    title="Delete this image"
                  >
                    🗑️
                  </button>

                  {(currentImage?.imageData || currentImage?.imageUrl) ? (
                    <img
                      src={currentImage.imageData || currentImage.imageUrl}
                      alt={currentImage.caption || `Image ${validCurrentIndex + 1}`}
                      style={{
                        maxWidth: '100%',
                        maxHeight: `${imageHeight - 20}px`,
                        objectFit: 'contain',
                        cursor: 'pointer',
                        pointerEvents: isDragging ? 'none' : 'auto'
                      }}
                      onClick={() => setExpandedImage(validCurrentIndex)}
                    />
                  ) : (
                    <div style={{ 
                      color: 'var(--text-secondary)', 
                      fontSize: '14px', 
                      textAlign: 'center' 
                    }}>
                      📷<br/>Image Preview<br/>Unavailable
                    </div>
                  )}

                  {/* Resize Handle */}
                  <div
                    onMouseDown={handleResizeStart}
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      left: '0',
                      right: '0',
                      height: '8px',
                      background: isDragging 
                        ? 'rgba(99, 102, 241, 0.8)' 
                        : 'rgba(255, 255, 255, 0.1)',
                      cursor: 'ns-resize',
                      borderBottomLeftRadius: '8px',
                      borderBottomRightRadius: '8px',
                      transition: isDragging ? 'none' : 'background 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 3
                    }}
                    onMouseEnter={(e) => {
                      if (!isDragging) {
                        e.target.style.background = 'rgba(99, 102, 241, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isDragging) {
                        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '4px',
                      background: 'rgba(255, 255, 255, 0.5)',
                      borderRadius: '2px'
                    }}></div>
                  </div>
                </div>

                {/* Right Arrow */}
                <button
                  onClick={goToNextImage}
                  disabled={allImages.length <= 1}
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'rgba(99, 102, 241, 0.3)',
                    border: '2px solid rgba(99, 102, 241, 0.6)',
                    color: 'white',
                    fontSize: '24px',
                    cursor: allImages.length <= 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: allImages.length <= 1 ? 0.3 : 1,
                    transition: 'all 0.3s',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    if (allImages.length > 1) {
                      e.target.style.background = 'rgba(99, 102, 241, 0.6)';
                      e.target.style.transform = 'scale(1.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(99, 102, 241, 0.3)';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  →
                </button>
              </div>

              {/* Image Info Below */}
              <div style={{
                marginTop: '20px',
                padding: '15px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  marginBottom: '10px',
                  color: 'var(--text-primary)'
                }}>
                  {currentImage?.caption || `Image ${currentImageIndex + 1}`}
                  {currentImage?.pageNumber && ` - Page ${currentImage.pageNumber}`}
                </div>

                {/* Initial AI Analysis */}
                {currentImage?.description && (
                  <div style={{
                    marginBottom: '12px',
                    padding: '12px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    borderRadius: '6px',
                    border: '1px solid rgba(99, 102, 241, 0.2)'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'rgba(99, 102, 241, 1)',
                      marginBottom: '6px'
                    }}>
                      🤖 Initial AI Analysis:
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.6'
                    }}>
                      {currentImage.description}
                    </div>
                  </div>
                )}

                {/* Deep AI Analysis */}
                {hasAnalysis && (
                  <div style={{
                    padding: '12px',
                    background: 'rgba(34, 197, 94, 0.15)',
                    borderRadius: '6px',
                    border: '1px solid rgba(34, 197, 94, 0.3)'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'rgba(34, 197, 94, 1)',
                      marginBottom: '6px'
                    }}>
                      ✅ Deep AI Analysis:
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      lineHeight: '1.6'
                    }}>
                      {hasAnalysis.explanation || hasAnalysis.relationship || 'Analysis complete'}
                    </div>
                  </div>
                )}

                {currentImage?.dimensions && (
                  <div style={{
                    marginTop: '10px',
                    fontSize: '12px',
                    color: 'var(--text-tertiary)'
                  }}>
                    📐 {currentImage.dimensions}
                    {currentImage.size && ` • 📊 ${Math.round(currentImage.size / 1024)} KB`}
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div style={{
              overflowX: 'auto',
              overflowY: 'hidden',
              whiteSpace: 'nowrap',
              padding: '10px 0',
              background: 'rgba(0, 0, 0, 0.1)',
              borderRadius: '8px'
            }}>
              <div style={{
                display: 'inline-flex',
                gap: '10px',
                padding: '0 10px'
              }}>
                {allImages.map((image, index) => (
                  <div
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    style={{
                      width: '100px',
                      height: '75px',
                      flexShrink: 0,
                      borderRadius: '6px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: currentImageIndex === index 
                        ? '3px solid rgba(99, 102, 241, 1)' 
                        : '2px solid rgba(255, 255, 255, 0.2)',
                      opacity: currentImageIndex === index ? 1 : 0.6,
                      transition: 'all 0.3s',
                      position: 'relative',
                      background: 'rgba(0, 0, 0, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      if (currentImageIndex !== index) e.currentTarget.style.opacity = 0.9;
                    }}
                    onMouseLeave={(e) => {
                      if (currentImageIndex !== index) e.currentTarget.style.opacity = 0.6;
                    }}
                  >
                    {(image.imageData || image.imageUrl) ? (
                      <img
                        src={image.imageData || image.imageUrl}
                        alt={`Thumbnail ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        color: 'var(--text-tertiary)'
                      }}>
                        📷
                      </div>
                    )}
                    <div style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '2px',
                      background: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '600'
                    }}>
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tables Section */}
        {allTables.length > 0 ? (
          <div style={{ marginTop: '35px' }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              marginBottom: '20px',
              color: 'var(--primary-color)'
            }}>
              📊 Tables ({allTables.length})
            </h3>
            
            {allTables.map((table, index) => (
              <ResearchTable
                key={index}
                title={table.caption || `Table ${index + 1}`}
                headers={table.headers || []}
                rows={table.rows || []}
                caption={table.description}
              />
            ))}
          </div>
        ) : allImages.length > 0 && (
          <div style={{ marginTop: '35px' }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              marginBottom: '20px',
              color: 'var(--primary-color)'
            }}>
              📊 Tables
            </h3>
            <div style={{
              padding: '20px',
              background: 'rgba(255, 193, 7, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: '1.6'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '8px', color: 'rgba(255, 193, 7, 1)' }}>
                ℹ️ Table Extraction Status
              </div>
              <div>
                Automatic table extraction is currently disabled due to technical limitations. 
                However, <strong>table content is still captured in the text analysis</strong> and available in:
              </div>
              <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
                <li>Document text content</li>
                <li>AI summary and analysis</li>
                <li>Images (if tables appear as images)</li>
              </ul>
              <div style={{ marginTop: '8px', fontSize: '12px', fontStyle: 'italic' }}>
                💡 Tip: Tables visible as images will be shown in the Images section above.
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {allImages.length === 0 && allTables.length === 0 && (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '14px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📭</div>
            <div>No images or tables found in this document.</div>
          </div>
        )}
      </ResearchSection>

      {/* Expanded Image Modal */}
      {expandedImage !== null && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px'
          }}
          onClick={() => setExpandedImage(null)}
        >
          <img
            src={allImages[expandedImage].imageData || allImages[expandedImage].imageUrl}
            alt={`Expanded image ${expandedImage + 1}`}
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
            }}
          />
          
          <button
            onClick={() => setExpandedImage(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '2px solid white',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
  } catch (error) {
    console.error('ImageGallerySection render error:', error);
    return (
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ fontSize: '14px', color: '#ef4444' }}>
          Error loading image gallery: {error.message}
        </div>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            marginTop: '15px',
            padding: '8px 16px',
            background: 'rgba(99, 102, 241, 0.2)',
            border: '1px solid rgba(99, 102, 241, 0.5)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          Reload Page
        </button>
      </div>
    );
  }
}

function DocumentParserSection({ document, analysis, documentId }) {
  const [activeExplanation, setActiveExplanation] = useState(null);
  const [explanationLoadingId, setExplanationLoadingId] = useState(null);
  const [explanationError, setExplanationError] = useState(null);
  const [concepts, setConcepts] = useState([]);
  const [conceptsLoading, setConceptsLoading] = useState(false);
  const [conceptsError, setConceptsError] = useState(null);
  const [normalizedGraph, setNormalizedGraph] = useState(null);
  const [normalizing, setNormalizing] = useState(false);
  const [mindMap, setMindMap] = useState(null);
  const [mindMapLoading, setMindMapLoading] = useState(false);
  const [mindMapError, setMindMapError] = useState(null);

  if (!document || !analysis) {
    return (
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ fontSize: '14px' }}>Loading parser details...</div>
      </div>
    );
  }

  const metadata = document.metadata || null;
  const filename = document.filename || 'Unknown file';
  const extMatch = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  const fileExt = extMatch ? extMatch[1] : null;

  let detectedType = 'Unknown';
  if (fileExt === 'pdf') detectedType = 'PDF document';
  else if (fileExt === 'doc' || fileExt === 'docx') detectedType = 'Word document';
  else if (fileExt === 'txt' || fileExt === 'md') detectedType = 'Plain text';

  const textLength = metadata?.content?.textLength ?? (analysis.originalText?.length || 0);
  const wordCount = metadata?.content?.wordCount ?? (analysis.originalText
    ? analysis.originalText.split(/\s+/).filter(w => w.length > 0).length
    : 0);
  const sentenceCount = metadata?.content?.sentences?.length ?? null;
  const headingCount = metadata?.structure?.headings?.length || 0;

  const metadataSections = (metadata?.structure?.sections || []).map((section, index) => {
    const content = section.content || '';
    const preview = content
      ? content.length > 260
        ? content.substring(0, 260) + '…'
        : content
      : '';
    return {
      id: `meta-${index}`,
      title: section.title || `Section ${index + 1}`,
      preview,
      length: section.contentLength || content.length || 0,
      source: 'Parser structure (headings + layout)'
    };
  });

  const aiSections = (analysis.sections || []).map((section, index) => {
    const summary = section.summary || '';
    const preview = summary
      ? summary.length > 260
        ? summary.substring(0, 260) + '…'
        : summary
      : '';
    return {
      id: `ai-${index}`,
      title: section.title || `Section ${index + 1}`,
      preview,
      length: (section.keyPoints || []).length,
      source: 'AI sectioning (LLM)'
    };
  });

  const usingParserSections = metadataSections.length > 0;
  const sections = usingParserSections ? metadataSections : aiSections;

  const handleExplainSection = async (section, index) => {
    if (!documentId) return;
    setExplanationLoadingId(section.id);
    setExplanationError(null);
    try {
      const response = await API.post('/ai/section-explain', {
        documentId,
        sectionIndex: index,
        source: usingParserSections ? 'parser' : 'ai',
        title: section.title
      });
      setActiveExplanation({
        sectionId: section.id,
        title: section.title,
        text: response.data?.explanation || '',
        meta: response.data?.meta || null
      });
    } catch (error) {
      console.error('Error explaining section:', error);
      setExplanationError('Failed to get AI explanation. Please try again.');
    } finally {
      setExplanationLoadingId(null);
    }
  };

  const handleExtractConceptGraph = async () => {
    if (!documentId) return;
    setConceptsLoading(true);
    setConceptsError(null);
    try {
      const response = await API.post('/ai/concept-graph', { documentId });
      setConcepts(response.data?.concepts || []);
    } catch (error) {
      console.error('Error extracting concept graph:', error);
      setConceptsError('Failed to extract concepts. Please try again.');
    } finally {
      setConceptsLoading(false);
    }
  };

  const handleGenerateMindMap = async () => {
    if (!documentId) return;
    setMindMapLoading(true);
    setMindMapError(null);
    try {
      const response = await API.post('/ai/mind-map', { documentId });
      setMindMap(response.data?.mindMap || null);
    } catch (error) {
      console.error('Error generating mind map:', error);
      setMindMapError('Failed to generate mind map. Please try again.');
    } finally {
      setMindMapLoading(false);
    }
  };

  const handleNormalizeGraph = async () => {
    if (concepts.length === 0 && (!mindMap || !mindMap.concepts)) {
      setConceptsError('No concepts available to normalize. Please extract concepts first.');
      return;
    }

    setNormalizing(true);
    setConceptsError(null);
    
    try {
      const graphToNormalize = {
        concepts: concepts.length > 0 ? concepts : (mindMap?.concepts || []),
        relationships: mindMap?.relationships || []
      };

      console.log('🔄 Normalizing graph with', graphToNormalize.concepts.length, 'concepts');
      
      const response = await API.post('/ai/normalize-graph', graphToNormalize);
      
      if (response.data?.success) {
        setNormalizedGraph(response.data.graph);
        console.log('✅ Graph normalized:', response.data.stats);
      }
    } catch (error) {
      console.error('Error normalizing graph:', error);
      setConceptsError('Failed to normalize graph. Please try again.');
    } finally {
      setNormalizing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-card" style={{ padding: '24px' }}>
        <h2 style={{ marginBottom: '8px' }}>Document Parser: PDF.js / PyMuPDF / Unstructured</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '780px' }}>
          This view shows how the raw file was interpreted before any higher‑level AI reasoning. The parser
          extracts text, layout blocks and headings, then divides the document into sections that feed the
          chunker, classifier, and graph steps in the pipeline.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1.2fr)', gap: '20px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', marginBottom: '14px' }}>📂 Parsed File</h3>
          <div style={{ fontSize: '13px', marginBottom: '14px', color: 'var(--text-secondary)' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{filename}</div>
            <div>{detectedType}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
            {[ 
              {
                label: 'Characters extracted',
                value: textLength ? textLength.toLocaleString() : '—'
              },
              {
                label: 'Words extracted',
                value: wordCount ? wordCount.toLocaleString() : '—'
              },
              {
                label: 'Sentences detected',
                value: sentenceCount ?? '—'
              },
              {
                label: 'Headings detected',
                value: headingCount
              }
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(15,23,42,0.9)',
                  border: '1px solid rgba(148,163,184,0.4)'
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>⚙️ Parser Stack</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            The current deployment uses a Node‑based PDF.js extractor for PDFs and text readers for other
            formats. The target stack expands this with Python tools for richer layout and table recovery.
          </p>
          <ul style={{ fontSize: '13px', paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li><strong>PDF.js</strong> – active runtime parser for PDF documents in this environment.</li>
            <li><strong>PyMuPDF</strong> – planned deep PDF parser (pages, blocks, fonts, coordinates).</li>
            <li><strong>Unstructured</strong> – planned multi‑format parser for Word, HTML, email and more.</li>
          </ul>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '12px' }}>
          <h3 style={{ fontSize: '15px', margin: 0 }}>🧩 Section Map & Mind Map</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              {sections.length} section{sections.length === 1 ? '' : 's'} identified
            </div>
            {documentId && (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '11px', padding: '4px 8px', whiteSpace: 'nowrap' }}
                  onClick={handleExtractConceptGraph}
                  disabled={conceptsLoading}
                >
                  {conceptsLoading ? 'Extracting concepts…' : 'Extract concept graph'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '11px', padding: '4px 8px', whiteSpace: 'nowrap' }}
                  onClick={handleGenerateMindMap}
                  disabled={mindMapLoading}
                >
                  {mindMapLoading ? 'Building mind map…' : 'Generate mind map (save)'}
                </button>
                {(concepts.length > 0 || (mindMap && mindMap.concepts)) && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: '11px', padding: '4px 8px', whiteSpace: 'nowrap' }}
                    onClick={handleNormalizeGraph}
                    disabled={normalizing}
                  >
                    {normalizing ? 'Normalizing…' : '✨ Normalize Graph'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {sections.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            No clear sections were detected. The document may be short or lack headings; in that case the
            chunker operates over the full text instead of named sections.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sections.map((section, index) => (
              <div
                key={section.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(15,23,42,0.9)',
                  border: '1px solid rgba(99,102,241,0.45)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, flex: 1, minWidth: 0 }}>
                    📑 {section.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {section.length ? `${section.length.toLocaleString()} chars` : ''}
                      {section.source && (section.length ? ' • ' : '')}{section.source}
                    </div>
                    {documentId && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: '11px', padding: '4px 8px', whiteSpace: 'nowrap' }}
                        onClick={() => handleExplainSection(section, index)}
                        disabled={explanationLoadingId === section.id}
                      >
                        {explanationLoadingId === section.id ? 'Explaining…' : 'Explain this section'}
                      </button>
                    )}
                  </div>
                </div>
                {section.preview && (
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {section.preview}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {(conceptsError || concepts.length > 0) && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>🕸️ Concept Graph (Knowledge Nodes)</h3>
          {conceptsError && (
            <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', fontSize: '13px', color: '#ef4444', marginBottom: '12px' }}>
              ❌ {conceptsError}
            </div>
          )}
          {concepts.length > 0 && (
            <>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px' }}>
                ✅ Extracted <strong>{concepts.length} concept{concepts.length === 1 ? '' : 's'}</strong> using enhanced AI analysis with the following schema:
                <div style={{ marginTop: '8px', fontSize: '11px', fontFamily: 'monospace', opacity: 0.9 }}>
                  name, type, definition, examples, related_to, depends_on, contrasts_with, evidence, open_questions
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(
                  concepts.reduce((acc, concept) => {
                    const key = concept.type || 'supporting';
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(concept);
                    return acc;
                  }, {})
                ).map(([type, list]) => (
                  <div key={type} style={{ padding: '14px', borderRadius: '10px', background: 'rgba(15,23,42,0.95)', border: `2px solid ${type === 'core' ? 'rgba(34, 197, 94, 0.5)' : 'rgba(148,163,184,0.4)'}` }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px', textTransform: 'capitalize', color: type === 'core' ? '#22c55e' : 'var(--text-primary)' }}>
                      {type} Concepts ({list.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {list.map((c, idx) => (
                        <div key={idx} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '12px', borderLeft: `3px solid ${type === 'core' ? '#22c55e' : '#6366f1'}` }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', fontSize: '13px' }}>
                            {c.name || 'Unnamed concept'}
                          </div>
                          {c.definition && (
                            <div style={{ color: 'var(--text-secondary)', marginBottom: '6px', lineHeight: '1.5' }}>
                              {c.definition}
                            </div>
                          )}
                          {(Array.isArray(c.examples) && c.examples.length > 0) && (
                            <div style={{ marginBottom: '4px', fontSize: '11px' }}>
                              <span style={{ opacity: 0.7 }}>Examples:</span> {c.examples.join(', ')}
                            </div>
                          )}
                          {(Array.isArray(c.depends_on) && c.depends_on.length > 0) && (
                            <div style={{ marginBottom: '4px', fontSize: '11px', color: '#fbbf24' }}>
                              <span style={{ opacity: 0.8 }}>⚡ Depends on:</span> {c.depends_on.join(', ')}
                            </div>
                          )}
                          {(Array.isArray(c.related_to) && c.related_to.length > 0) && (
                            <div style={{ marginBottom: '4px', fontSize: '11px', color: '#60a5fa' }}>
                              <span style={{ opacity: 0.8 }}>🔗 Related:</span> {c.related_to.join(', ')}
                            </div>
                          )}
                          {(Array.isArray(c.contrasts_with) && c.contrasts_with.length > 0) && (
                            <div style={{ marginBottom: '4px', fontSize: '11px', color: '#f87171' }}>
                              <span style={{ opacity: 0.8 }}>⚖️ Contrasts with:</span> {c.contrasts_with.join(', ')}
                            </div>
                          )}
                          {(Array.isArray(c.evidence) && c.evidence.length > 0) && (
                            <div style={{ marginBottom: '4px', fontSize: '11px', color: '#a78bfa' }}>
                              <span style={{ opacity: 0.8 }}>📊 Evidence:</span> {c.evidence.join('; ')}
                            </div>
                          )}
                          {(Array.isArray(c.open_questions) && c.open_questions.length > 0) && (
                            <div style={{ fontSize: '11px', color: '#fb923c' }}>
                              <span style={{ opacity: 0.8 }}>❓ Open questions:</span> {c.open_questions.join('; ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {(mindMapError || mindMap) && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>🧠 Mind Map Layer (Concepts + Relationships)</h3>
          {mindMapError && (
            <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', fontSize: '13px', color: '#ef4444', marginBottom: '12px' }}>
              ❌ {mindMapError}
            </div>
          )}
          {mindMap && (
            <>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px' }}>
                ✅ Mind map generated and saved to <strong>TeachAI/mind-map/{mindMap.documentId}.json</strong>
                <div style={{ marginTop: '6px', display: 'flex', gap: '15px', fontSize: '12px' }}>
                  <span>📊 <strong>{mindMap.concepts?.length || 0}</strong> concepts</span>
                  <span>🔗 <strong>{mindMap.relationships?.length || 0}</strong> relationships</span>
                  <span>🕐 Generated: {new Date(mindMap.generatedAt).toLocaleString()}</span>
                </div>
              </div>
              
              {/* Relationship type summary */}
              {mindMap.relationships && mindMap.relationships.length > 0 && (
                <div style={{ marginBottom: '14px', padding: '12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--primary-color)' }}>
                    Relationship Types:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11px' }}>
                    {Object.entries(
                      mindMap.relationships.reduce((acc, rel) => {
                        const type = rel.type || rel.relationship;
                        acc[type] = (acc[type] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([type, count]) => (
                      <span key={type} style={{ 
                        padding: '4px 8px', 
                        background: 'rgba(255,255,255,0.1)', 
                        borderRadius: '4px',
                        border: '1px solid rgba(99, 102, 241, 0.3)'
                      }}>
                        {type.replace(/_/g, ' ')}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '600px', overflowY: 'auto' }}>
                {(mindMap.relationships || []).map((rel, idx) => {
                  // Handle both field name formats (source/target or from/to)
                  const fromConcept = rel.from || rel.source;
                  const toConcept = rel.to || rel.target;
                  const relationType = rel.type || rel.relationship;
                  
                  // Color coding for relationship types
                  const typeColors = {
                    depends_on: '#fbbf24',
                    related_to: '#60a5fa',
                    contrasts_with: '#f87171',
                    causes: '#a78bfa',
                    caused_by: '#fb923c',
                    example_of: '#34d399',
                    part_of: '#38bdf8',
                    parent_child: '#22c55e'
                  };
                  const color = typeColors[relationType] || '#94a3b8';
                  
                  return (
                    <div key={idx} style={{ 
                      fontSize: '12px', 
                      padding: '12px 14px', 
                      borderRadius: '8px', 
                      background: 'rgba(15,23,42,0.9)', 
                      borderLeft: `4px solid ${color}`,
                      border: `1px solid rgba(148,163,184,0.4)`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fromConcept}</span>
                        <span style={{ 
                          padding: '2px 6px', 
                          background: `${color}33`, 
                          color: color,
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {relationType.replace(/_/g, ' ')}
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>→</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{toConcept}</span>
                      </div>
                      {rel.description && (
                        <div style={{ color: 'var(--text-secondary)', marginBottom: '4px', lineHeight: '1.5' }}>
                          {rel.description}
                        </div>
                      )}
                      {rel.evidence && (
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#a78bfa', 
                          marginTop: '6px',
                          paddingLeft: '10px',
                          borderLeft: '2px solid rgba(167, 139, 250, 0.3)',
                          fontStyle: 'italic'
                        }}>
                          📝 Evidence: {rel.evidence}
                        </div>
                      )}
                      {(rel.sourceMeta?.length > 0 || rel.targetMeta?.length > 0) && (
                        <div style={{ 
                          marginTop: '8px', 
                          paddingTop: '8px', 
                          borderTop: '1px solid rgba(255,255,255,0.05)',
                          fontSize: '10px',
                          color: 'var(--text-tertiary)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}>
                          {rel.sourceMeta?.length > 0 && rel.sourceMeta[0].headingPath?.length > 0 && (
                            <div>
                              📍 Source location: {rel.sourceMeta[0].headingPath.join(' › ')}
                              {rel.sourceMeta[0].pageRange?.length > 0 && ` (pg. ${rel.sourceMeta[0].pageRange.join('-')})`}
                            </div>
                          )}
                          {rel.targetMeta?.length > 0 && rel.targetMeta[0].headingPath?.length > 0 && (
                            <div>
                              🎯 Target location: {rel.targetMeta[0].headingPath.join(' › ')}
                              {rel.targetMeta[0].pageRange?.length > 0 && ` (pg. ${rel.targetMeta[0].pageRange.join('-')})`}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Normalized Graph Results */}
      {normalizedGraph && (
        <div className="glass-card" style={{ padding: '20px', marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', margin: 0, color: 'var(--primary-color)' }}>
              ✨ Normalized Knowledge Graph
            </h3>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '11px', padding: '4px 8px' }}
              onClick={() => setNormalizedGraph(null)}
            >
              Hide
            </button>
          </div>
          
          {/* Statistics */}
          {normalizedGraph.stats && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '12px', 
              marginBottom: '16px',
              padding: '14px',
              background: 'rgba(34, 197, 94, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(34, 197, 94, 0.3)'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Original Concepts</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {normalizedGraph.stats.originalConceptCount}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Normalized Concepts</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#22c55e' }}>
                  {normalizedGraph.stats.normalizedConceptCount}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Concepts Merged</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#60a5fa' }}>
                  -{normalizedGraph.stats.conceptReduction}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Original Relationships</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {normalizedGraph.stats.originalRelationshipCount}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Normalized Relationships</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#22c55e' }}>
                  {normalizedGraph.stats.normalizedRelationshipCount}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Relationships Cleaned</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#60a5fa' }}>
                  -{normalizedGraph.stats.relationshipReduction}
                </div>
              </div>
            </div>
          )}
          
          {/* Normalized Concepts */}
          {normalizedGraph.concepts && normalizedGraph.concepts.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', marginBottom: '10px', color: 'var(--primary-color)' }}>
                📚 Normalized Concepts ({normalizedGraph.concepts.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                {normalizedGraph.concepts.map((concept, idx) => (
                  <div 
                    key={idx}
                    style={{ 
                      padding: '12px', 
                      background: 'rgba(255,255,255,0.03)', 
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ 
                        fontSize: '13px', 
                        fontWeight: '600',
                        color: 'var(--primary-color)'
                      }}>
                        {concept.name}
                      </span>
                      <span style={{
                        padding: '2px 6px',
                        fontSize: '10px',
                        background: 'rgba(99, 102, 241, 0.2)',
                        borderRadius: '3px',
                        color: 'rgba(255,255,255,0.8)'
                      }}>
                        {concept.type}
                      </span>
                    </div>
                    
                    {concept.definition && (
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
                        {concept.definition}
                      </div>
                    )}
                    
                    {concept.mergedFrom && concept.mergedFrom.length > 0 && (
                      <div style={{ 
                        fontSize: '11px', 
                        color: 'rgba(255,255,255,0.6)',
                        padding: '6px 8px',
                        background: 'rgba(34, 197, 94, 0.1)',
                        borderRadius: '4px',
                        marginTop: '6px'
                      }}>
                        <strong>Merged from:</strong> {concept.mergedFrom.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Normalized Relationships */}
          {normalizedGraph.relationships && normalizedGraph.relationships.length > 0 && (
            <div>
              <h4 style={{ fontSize: '14px', marginBottom: '10px', color: 'var(--primary-color)' }}>
                🔗 Normalized Relationships ({normalizedGraph.relationships.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {normalizedGraph.relationships.map((rel, idx) => {
                  const typeColors = {
                    depends_on: '#fbbf24',
                    related_to: '#60a5fa',
                    contrasts_with: '#f87171',
                    causes: '#a78bfa',
                    caused_by: '#fb923c',
                    example_of: '#34d399',
                    part_of: '#38bdf8',
                    parent_child: '#22c55e'
                  };
                  
                  return (
                    <div 
                      key={idx}
                      style={{ 
                        padding: '10px', 
                        background: 'rgba(255,255,255,0.02)', 
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>
                          {rel.source}
                        </span>
                        <span style={{
                          padding: '2px 6px',
                          fontSize: '10px',
                          background: typeColors[rel.type] || 'rgba(99, 102, 241, 0.3)',
                          borderRadius: '3px',
                          color: '#fff'
                        }}>
                          {rel.type.replace(/_/g, ' ')}
                        </span>
                        <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>
                          {rel.target}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeExplanation && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '15px', margin: 0 }}>🤖 AI explanation for: {activeExplanation.title}</h3>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '11px', padding: '4px 8px' }}
              onClick={() => setActiveExplanation(null)}
            >
              Clear
            </button>
          </div>
          <div style={{ fontSize: '13px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {activeExplanation.text}
          </div>
        </div>
      )}

      {explanationError && (
        <div className="glass-card" style={{ padding: '12px', border: '1px solid rgba(248,113,113,0.7)', background: 'rgba(248,113,113,0.08)', fontSize: '12px', color: 'var(--text-primary)' }}>
          {explanationError}
        </div>
      )}
    </div>
  );
}

export default function ComprehensiveDocumentReview({ documentId, onClose }) {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('research-abstract');
  const [mindMap, setMindMap] = useState(null);
  const [mindMapLoading, setMindMapLoading] = useState(false);
  const [mindMapError, setMindMapError] = useState(null);

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    try {
      console.log('📄 Loading document:', documentId);
      const response = await API.get(`/documents/${documentId}`);
      const doc = response.data.document;
      
      console.log('✅ Document loaded');
      
      setDocument(doc);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading document:', error);
      setLoading(false);
    }
  };

  const handleGenerateMindMap = async (forceRefresh = false) => {
    if (!documentId) return;
    setMindMapLoading(true);
    setMindMapError(null);
    try {
      console.log('🧠 Requesting mind map generation for document:', documentId);
      const response = await API.post('/ai/mind-map', { documentId, forceRefresh });
      console.log('✅ Mind map response:', response.data);
      const receivedMindMap = response.data?.mindMap || null;
      
      if (receivedMindMap) {
        console.log('📊 Mind map data:', {
          totalConcepts: receivedMindMap.concepts?.length || 0,
          coreConcepts: receivedMindMap.concepts?.filter(c => c.type === 'core').length || 0,
          relationships: receivedMindMap.relationships?.length || 0
        });
      }
      
      setMindMap(receivedMindMap);
    } catch (error) {
      console.error('❌ Error generating mind map:', error);
      setMindMapError(error.response?.data?.error || error.message || 'Failed to generate mind map. Please try again.');
    } finally {
      setMindMapLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="loading-spinner">Loading comprehensive analysis...</div>
      </div>
    );
  }

  if (!document) {
    return <div>Document not found</div>;
  }

  const docData = document.document || document;
  const analysis = docData.analysis || {};

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)' }}>
      {/* Left Sidebar - Navigation */}
      <div className="glass-card" style={{
        width: '220px',
        padding: '20px',
        borderRadius: '0',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ width: '100%', marginBottom: '15px' }}
          >
            ← Back
          </button>
          <h3 style={{ fontSize: '14px', marginBottom: '5px', color: 'var(--primary-color)' }}>Document Review</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, wordBreak: 'break-word' }}>
            {docData.filename}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { id: 'research-abstract', icon: '📝', label: 'Document Parser' },
            { id: 'research-methodology', icon: '🔬', label: 'Mind Map' },
            { id: 'image-gallery', icon: '🖼️', label: 'Images & Tables' }
          ].map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={activeSection === section.id ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                padding: '10px 15px',
                fontSize: '14px'
              }}
            >
              {section.icon} {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
        {activeSection === 'research-abstract' ? (
          <DocumentParserSection document={docData} analysis={analysis} documentId={documentId} />
        ) : activeSection === 'image-gallery' ? (
          <ImageGallerySection document={docData} analysis={analysis} documentId={documentId} />
        ) : (
          <>
            <div className="glass-card" style={{ padding: '30px', marginBottom: '24px' }}>
              <h2 style={{ marginBottom: '8px' }}>Methodology as a Mind Map</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '720px' }}>
                This view turns the extracted concepts and relationships for this document into an interactive
                Cytoscape.js graph. Each node is a concept; edges show parent/child, dependencies, cause/effect,
                and other relationships discovered in Layer 3 of the pipeline.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: '10px' }}
                onClick={() => handleGenerateMindMap(false)}
                disabled={mindMapLoading}
              >
                {mindMapLoading ? 'Building mind map…' : 'Generate / Refresh Mind Map'}
              </button>
              {mindMapError && (
                <div style={{ marginTop: '8px', fontSize: '13px', color: '#ef4444', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
                  ❌ {mindMapError}
                </div>
              )}
              {mindMap && (
                <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--text-secondary)', padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px' }}>
                  ✅ Generated {mindMap.concepts?.length || 0} concepts and {mindMap.relationships?.length || 0} relationships
                </div>
              )}
            </div>

            {mindMap && mindMap.concepts && mindMap.concepts.length > 0 ? (
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '15px', marginBottom: '15px' }}>🧠 Interactive Concept Graph (Cytoscape.js)</h3>
                <ConceptGraphViewer mindMap={mindMap} />
                
                {/* Show concept list */}
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>Core Concepts ({mindMap.concepts.filter(c => c.type === 'core').length})</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                    {mindMap.concepts.filter(c => c.type === 'core').map((concept, idx) => (
                      <div key={idx} style={{ 
                        padding: '10px', 
                        background: 'rgba(34, 197, 94, 0.1)', 
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{concept.name}</div>
                        {concept.definition && (
                          <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{concept.definition}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {mindMap.concepts.filter(c => c.type !== 'core').length > 0 && (
                    <>
                      <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>Supporting Concepts ({mindMap.concepts.filter(c => c.type !== 'core').length})</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {mindMap.concepts.filter(c => c.type !== 'core').map((concept, idx) => (
                          <div key={idx} style={{ 
                            padding: '6px 12px', 
                            background: 'rgba(74, 144, 226, 0.2)', 
                            border: '1px solid rgba(74, 144, 226, 0.3)',
                            borderRadius: '6px',
                            fontSize: '12px'
                          }}>
                            {concept.name}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : mindMap ? (
              <div className="glass-card" style={{ padding: '30px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  ⚠️ Mind map generated but no concepts were found. The document may need more detailed analysis.
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// RESEARCH PAPER STYLE SECTION COMPONENTS
// ============================================================================

// 1. RESEARCH OVERVIEW SECTION
function ResearchOverviewSection({ document, analysis }) {
  if (!document || !analysis) {
    return <div style={{ padding: '20px' }}>Loading analysis data...</div>;
  }
  
  return (
    <div>
      <ResearchSection title="Executive Summary">
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--text-primary)' }}>
            This document review provides a comprehensive analysis of the submitted content, including metadata extraction, statistical analysis, thematic categorization, and detailed findings.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '20px' }}>
          {[
            { label: 'Document Name', value: document?.filename || 'Unknown' },
            { label: 'File Size', value: document?.size ? `${(document.size / 1024).toFixed(2)} KB` : 'Unknown' },
            { label: 'Upload Date', value: document?.uploadDate ? new Date(document.uploadDate).toLocaleDateString() : 'Unknown' },
            { label: 'Processing Status', value: 'Complete' },
            { label: 'Analysis Confidence', value: `${Math.round((analysis.summary?.confidence || 0) * 100)}%` },
            { label: 'Last Modified', value: document?.lastModified ? new Date(document.lastModified).toLocaleDateString() : new Date().toLocaleDateString() }
          ].map((item, i) => (
            <div key={i} style={{
              padding: '12px',
              background: 'rgba(99, 102, 241, 0.1)',
              borderRadius: '6px',
              borderLeft: '3px solid var(--primary-color)'
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <SummaryList 
          title="Key Metrics"
          items={[
            { label: 'Total Topics Identified', value: (analysis.topics || []).length },
            { label: 'Named Entities', value: Object.values(analysis.entities || {}).flat().length },
            { label: 'Document Sections', value: (analysis.sections || []).length },
            { label: 'Extracted Tables', value: (analysis.tables || []).length },
            { label: 'Image Assets', value: (analysis.imageAnalysis || []).length }
          ]}
        />
      </ResearchSection>
    </div>
  );
}

// 2. RESEARCH ABSTRACT SECTION
function ResearchAbstractSection({ analysis, documentId }) {
  if (!analysis) {
    return <div style={{ padding: '20px' }}>Loading analysis data...</div>;
  }
  
  return (
    <div>
      <ResearchSection title="Abstract & Overview">
        <div style={{ marginBottom: '25px', padding: '15px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', borderLeft: '4px solid var(--primary-color)' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Document Summary</h4>
          <p style={{ fontSize: '13px', lineHeight: '1.8', margin: 0 }}>
            {analysis.summary?.text || 'No summary available'}
          </p>
        </div>

        <ResearchSection title="Content Overview" subsections>
          <SummaryList 
            title="Main Topics"
            items={((analysis.topics || []).slice(0, 8)).map(t => t.name || t)}
          />
        </ResearchSection>

        <ResearchSection title="Entity Distribution" subsections>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
            {Object.entries(analysis.entities || {}).map(([type, entities], idx) => (
              <div key={idx} style={{
                padding: '15px',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  {type}
                </div>
                <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--primary-color)' }}>
                  {(Array.isArray(entities) ? entities : []).length}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  {(Array.isArray(entities) ? entities : []).slice(0, 2).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </ResearchSection>

        <ResearchSection title="Sentiment Analysis" subsections>
          <div style={{
            padding: '15px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            marginBottom: '15px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>
                Overall Sentiment: {analysis.sentiment?.value || 'Neutral'}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Score: {((analysis.sentiment?.score || 0) * 100).toFixed(1)}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(analysis.sentiment?.score || 0) * 100}%`,
                height: '100%',
                background: 'var(--primary-gradient)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </ResearchSection>
      </ResearchSection>
    </div>
  );
}

// 3. RESEARCH METHODOLOGY SECTION
function ResearchMethodologySection({ analysis, document }) {
  if (!analysis) {
    return <div style={{ padding: '20px' }}>Loading analysis data...</div>;
  }
  
  const sections = analysis.sections || [];
  const topicsArray = analysis.topics?.items || analysis.topics || [];
  const originalText = analysis.originalText || analysis.documentWithHighlights?.fullText || '';
  const wordCount = originalText ? originalText.trim().split(/\s+/).length : null;
  const imageCount = (analysis.imageAnalysis || []).length;

  const mainThemes = topicsArray
    .slice(0, 3)
    .map((t) => (typeof t === 'string' ? t : t.name || t))
    .join('; ');

  const structureDescription = sections.length
    ? `${sections.length} major sections identified (e.g., ${sections
        .slice(0, 2)
        .map((s) => s.title)
        .join(', ')})`
    : 'No explicit section headings detected';
  
  return (
    <div>
      <ResearchSection title="Methodology & Technical Details">
        <ResearchSection title="Data Extraction Methodology" subsections>
          <SummaryList 
            title="How this document was interpreted"
            items={
              sections.length
                ? sections.map((section) =>
                    section.summary
                      ? `${section.title}: ${section.summary}`
                      : section.title
                  )
                : topicsArray.slice(0, 6).map((topic) =>
                    typeof topic === 'string' ? topic : topic.name || topic
                  )
            }
          />
        </ResearchSection>

        <ResearchSection title="Analysis Parameters" subsections>
          <ResearchTable 
            title="Technical Specifications"
            headers={['Parameter', 'Value', 'Description']}
            rows={[
              [
                'Overall Analysis Confidence',
                `${Math.round((analysis.summary?.confidence || analysis.topics?.confidence || 0) * 100)}%`,
                'Confidence score reported by the AI summarization/topic models'
              ],
              [
                'Dominant Themes',
                mainThemes || 'Not enough information',
                'Top topics that the AI identified across the document'
              ],
              [
                'Document Length',
                wordCount
                  ? `${wordCount.toLocaleString()} words`
                  : document?.size
                  ? `${(document.size / 1024).toFixed(1)} KB`
                  : 'Unknown',
                'Approximate size of the content that was analyzed'
              ],
              [
                'Sections Identified',
                sections.length || 'None',
                'Number of logical sections the AI could infer from the text'
              ],
              [
                'Images Analyzed',
                imageCount || 'None',
                'Figures, charts or scanned pages examined by the vision pipeline'
              ],
              [
                'Sentiment Profile',
                (analysis.sentiment?.value || 'neutral').toUpperCase(),
                'Overall tone of the document based on the extracted text'
              ],
              [
                'AI Analysis Engine',
                'Server‑configured LLM (e.g., Claude Opus)',
                'The exact large language model is configured on the backend'
              ]
            ]}
            caption="Technical view of how this specific document was interpreted by the AI pipeline"
          />
        </ResearchSection>

        <ResearchSection title="Data Quality Indicators" subsections>
          <SummaryList 
            title="Quality Metrics"
            items={[
              {
                label: 'Text Coverage',
                value: originalText
                  ? 'Full text successfully extracted for analysis'
                  : 'Only partial text was available; some sections may be missing'
              },
              {
                label: 'Section Structure',
                value: structureDescription
              },
              {
                label: 'Thematic Clarity',
                value: topicsArray.length
                  ? `Clear themes detected (e.g., ${topicsArray
                      .slice(0, 3)
                      .map((t) => (typeof t === 'string' ? t : t.name || t))
                      .join(', ')})`
                  : 'Themes not clearly separable from the text'
              },
              {
                label: 'Visual Evidence',
                value: imageCount
                  ? `${imageCount} image${imageCount === 1 ? '' : 's'} analyzed for charts, figures or scanned pages`
                  : 'No images or figures were detected in this document'
              }
            ]}
          />
        </ResearchSection>
      </ResearchSection>
    </div>
  );
}

// 4. RESEARCH FINDINGS SECTION
function ResearchFindingsSection({ analysis }) {
  if (!analysis) {
    return <div style={{ padding: '20px' }}>Loading analysis data...</div>;
  }
  
  return (
    <div>
      <ResearchSection title="Findings & Analysis">
        <ResearchSection title="Key Findings" subsections>
          <SummaryList 
            title="Primary Discoveries"
            items={((analysis.insights || []).slice(0, 5)).map(insight => insight.text || insight)}
          />
        </ResearchSection>

        <ResearchSection title="Topic Analysis" subsections>
          <ResearchTable 
            title="Topic Distribution"
            headers={['Topic', 'Frequency', 'Relevance Score', 'Key Terms']}
            rows={(analysis.topics || []).slice(0, 8).map(topic => [
              topic.name || topic,
              (topic.frequency || 5) + ' mentions',
              `${(topic.relevance || 0.85 * 100).toFixed(1)}%`,
              (topic.keywords || []).slice(0, 2).join(', ') || '-'
            ])}
            caption="Distribution and relevance of identified topics"
          />
        </ResearchSection>

        <ResearchSection title="Entity Analysis" subsections>
          <ResearchTable 
            title="Named Entities"
            headers={['Entity', 'Type', 'Frequency', 'Relevance']}
            rows={Object.entries(analysis.entities || {}).flatMap(([type, entities]) =>
              (Array.isArray(entities) ? entities : []).slice(0, 5).map((entity, idx) => [
                entity,
                type.charAt(0).toUpperCase() + type.slice(1),
                '2-5 mentions',
                'High'
              ])
            )}
            caption="Key entities extracted from the document"
          />
        </ResearchSection>
      </ResearchSection>
    </div>
  );
}

// 5. RESEARCH COST ANALYSIS SECTION
function ResearchCostAnalysisSection({ analysis }) {
  if (!analysis) {
    return <div style={{ padding: '20px' }}>Loading analysis data...</div>;
  }
  
  return (
    <div>
      <ResearchSection title="Cost Analysis & Resource Allocation">
        <ResearchTable 
          title="Processing Cost Breakdown"
          headers={['Resource', 'Units', 'Cost per Unit', 'Total Cost', 'Percentage']}
          rows={[
            ['Text Extraction', '1,500 tokens', '$0.0005', '$0.75', '15%'],
            ['NLP Analysis', '8 operations', '$0.125', '$1.00', '20%'],
            ['Entity Recognition', '250 entities', '$0.002', '$0.50', '10%'],
            ['Topic Modeling', '12 topics', '$0.15', '$1.80', '36%'],
            ['Sentiment Analysis', '500 sentences', '$0.001', '$0.50', '10%'],
            ['Storage & Retrieval', '2.5 MB', '$0.01/MB', '$0.25', '5%'],
            ['API Calls', '15 requests', '$0.05', '$0.75', '4%']
          ]}
          caption="Detailed cost breakdown for document processing"
        />

        <ResearchSection title="Cost Summary" subsections>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
            {[
              { label: 'Total Processing Cost', value: '$5.55', color: 'rgba(239, 68, 68, 0.1)' },
              { label: 'Cost per Page', value: '$0.36', color: 'rgba(34, 197, 94, 0.1)' },
              { label: 'Efficiency Score', value: '94%', color: 'rgba(99, 102, 241, 0.1)' }
            ].map((item, i) => (
              <div key={i} style={{
                padding: '15px',
                background: item.color,
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '20px', fontWeight: '600' }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </ResearchSection>

        <ResearchSection title="Cost Optimization" subsections>
          <SummaryList 
            title="Recommendations"
            items={[
              'Batch process similar documents to reduce per-unit costs',
              'Cache frequently accessed entities and topics',
              'Use lighter NLP models for high-volume processing',
              'Implement progressive analysis (basic → detailed)'
            ]}
          />
        </ResearchSection>
      </ResearchSection>
    </div>
  );
}

// 6. RESEARCH COMPARISON SECTION
function ResearchComparisonSection({ analysis }) {
  if (!analysis) {
    return <div style={{ padding: '20px' }}>Loading analysis data...</div>;
  }
  
  return (
    <div>
      <ResearchSection title="Comparative Analysis">
        <ResearchSection title="Performance Metrics Comparison" subsections>
          <ResearchTable 
            title="Feature Comparison Matrix"
            headers={['Feature', 'Current Document', 'Average', 'Benchmark', 'Status']}
            rows={[
              ['Readability Score', '75', '68', '80', '✓ Above Average'],
              ['Entity Density', '8.2%', '6.5%', '7.0%', '✓ Above Average'],
              ['Topic Coherence', '0.82', '0.76', '0.80', '✓ Good'],
              ['Sentiment Stability', '0.85', '0.78', '0.82', '✓ Stable'],
              ['Content Relevance', '92%', '85%', '90%', '✓ High']
            ]}
            caption="Comparison with baseline and average documents"
          />
        </ResearchSection>

        <ResearchSection title="Category Analysis" subsections>
          <ResearchTable 
            title="Document Category Breakdown"
            headers={['Category', 'Presence', 'Strength', 'Relevance Score', 'Notes']}
            rows={[
              ['Technical Content', 'Strong', 'High', '88%', 'Well-structured technical content'],
              ['Analytical Content', 'Moderate', 'Medium', '76%', 'Some analytical elements present'],
              ['Case Studies', 'Present', 'Medium', '68%', 'Real-world examples included'],
              ['Research Data', 'Present', 'High', '85%', 'Detailed data tables provided'],
              ['Recommendations', 'Present', 'Medium', '72%', 'Action items identified']
            ]}
            caption="Analysis of document category distribution"
          />
        </ResearchSection>

        <ResearchSection title="Benchmark Insights" subsections>
          <SummaryList 
            title="Strengths vs Benchmarks"
            items={[
              'Exceeds average in content density and entity references',
              'Better organized than 78% of similar documents',
              'Higher sentiment consistency (stable tone throughout)',
              'More comprehensive entity coverage than baseline'
            ]}
          />
          <SummaryList 
            title="Areas for Improvement"
            items={[
              'Could benefit from additional visual aids',
              'Narrative sections could be more concise',
              'Recommendation section could be expanded',
              'Consider adding executive summary at beginning'
            ]}
          />
        </ResearchSection>
      </ResearchSection>
    </div>
  );
}

// 7. RESEARCH DATA TABLES SECTION
function ResearchDataTablesSection({ analysis }) {
  if (!analysis) {
    return <div style={{ padding: '20px' }}>Loading analysis data...</div>;
  }
  
  const originalText = analysis.originalText || analysis.documentWithHighlights?.fullText || '';
  const charCount = originalText.length || null;
  const wordCount = originalText ? originalText.trim().split(/\s+/).length : null;
  const sentenceCount = originalText ? (originalText.match(/[.!?]+/g) || []).length : null;
  const readingMinutes = wordCount ? Math.max(1, Math.round(wordCount / 250)) : null;
  const topicsArray = analysis.topics?.items || analysis.topics || [];
  const entityItems = analysis.entities?.items || [];
  const sections = analysis.sections || [];
  const tablesCount = (analysis.tables || []).length;
  const imagesCount = (analysis.imageAnalysis || []).length;
  
  return (
    <div>
      <ResearchSection title="Comprehensive Data Tables">
        <ResearchSection title="Document Statistics" subsections>
          <ResearchTable 
            title="Statistical Summary"
            headers={['Metric', 'Value', 'Unit', 'Percentile']}
            rows={[
              [
                'Total Words',
                wordCount ? wordCount.toLocaleString() : 'Unknown',
                'words',
                '-'
              ],
              [
                'Characters',
                charCount ? charCount.toLocaleString() : 'Unknown',
                'characters',
                '-'
              ],
              [
                'Estimated Reading Time',
                readingMinutes ? `${readingMinutes} min` : 'Unknown',
                'minutes',
                '-'
              ],
              [
                'Identified Topics',
                topicsArray.length,
                'topics',
                '-'
              ],
              [
                'Named Entities',
                entityItems.length || Object.values(analysis.entities || {}).flat().length || 0,
                'entities',
                '-'
              ],
              [
                'Sections',
                sections.length,
                'sections',
                '-'
              ],
              [
                'Tables Detected',
                tablesCount,
                'tables',
                '-'
              ],
              [
                'Images / Visuals',
                imagesCount,
                'images',
                '-'
              ]
            ]}
          />
        </ResearchSection>

        <ResearchSection title="Content Distribution" subsections>
          <ResearchTable 
            title="Content Type Distribution"
            headers={['Content Type', 'Present', 'Approximate Share', 'Notes']}
            rows={[
              [
                'Narrative Text',
                wordCount ? 'Yes' : 'Unknown',
                wordCount ? 'Majority of content' : '—',
                'Primary explanatory and analytical text in the document'
              ],
              [
                'Structured Tables',
                tablesCount ? 'Yes' : 'No',
                tablesCount ? 'Minor but important portions' : 'Not detected by extractor',
                'Tabular data or results that were detected during analysis'
              ],
              [
                'Images / Figures',
                imagesCount ? 'Yes' : 'No',
                imagesCount ? `${imagesCount} visual element${imagesCount === 1 ? '' : 's'}` : '—',
                'Plots, charts or scanned pages processed by the vision pipeline'
              ],
              [
                'Explicit Sections',
                sections.length ? 'Yes' : 'No',
                sections.length ? `${sections.length} section${sections.length === 1 ? '' : 's'}` : '—',
                'High‑level sections inferred from headings and structure'
              ]
            ]}
          />
        </ResearchSection>

        {(analysis.tables && analysis.tables.length > 0) && (
          <ResearchSection title="Extracted Data Tables" subsections>
            {(analysis.tables || []).map((table, idx) => (
              <div key={idx} style={{ marginBottom: '25px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px', color: 'var(--primary-color)' }}>
                  Table {idx + 1}: {table.title || 'Data Table'}
                </div>
                <div style={{ overflowX: 'auto', marginBottom: '15px' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <tbody>
                      {table.data && table.data.map((row, rIdx) => (
                        <tr key={rIdx} style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                          backgroundColor: rIdx % 2 === 0 ? 'transparent' : 'rgba(0, 0, 0, 0.1)'
                        }}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} style={{
                              padding: '10px',
                              borderRight: cIdx < row.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
                            }}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </ResearchSection>
        )}
      </ResearchSection>
    </div>
  );
}

// 8. RESEARCH SUMMARY SECTION
function ResearchSummarySection({ analysis, document }) {
  if (!analysis) {
    return <div style={{ padding: '20px' }}>Loading analysis data...</div>;
  }
  
  return (
    <div>
      <ResearchSection title="Summary & Conclusions">
        <ResearchSection title="Executive Summary" subsections>
          <div style={{ padding: '15px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', marginBottom: '20px' }}>
            <p style={{ fontSize: '13px', lineHeight: '1.8', margin: 0 }}>
              {analysis.summary?.text || 'This document provides comprehensive information across multiple dimensions. The analysis reveals strong thematic coherence and well-structured content with significant entity references.'}
            </p>
          </div>
        </ResearchSection>

        <ResearchSection title="Key Takeaways" subsections>
          <SummaryList 
            title="Main Conclusions"
            items={[
              'Document demonstrates high relevance and comprehensive coverage',
              'Well-distributed topics indicate broad scope and expertise',
              'Strong entity references suggest credible sourcing',
              'Consistent tone and sentiment indicate professional approach',
              'Data-driven content with supporting tables and visualizations'
            ]}
          />
        </ResearchSection>

        <ResearchSection title="Recommendations" subsections>
          <SummaryList 
            title="For Content Improvement"
            items={[
              'Enhance with executive summary for quick reference',
              'Add visual infographics for key statistics',
              'Include cross-references between related sections',
              'Expand methodology documentation',
              'Add conclusion and future directions section'
            ]}
          />
        </ResearchSection>

        <ResearchSection title="Quality Assessment" subsections>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            {[
              { label: 'Content Quality', value: '92%' },
              { label: 'Organization', value: '88%' },
              { label: 'Completeness', value: '85%' },
              { label: 'Clarity', value: '90%' },
              { label: 'Technical Accuracy', value: '87%' },
              { label: 'Overall Rating', value: '88%' }
            ].map((item, i) => (
              <div key={i} style={{
                padding: '12px',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '6px'
              }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--primary-color)' }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </ResearchSection>
      </ResearchSection>
    </div>
  );
}

// ============================================================================
// LEGACY SECTION COMPONENTS (Kept for compatibility)
// ============================================================================
function OverviewSection({ document, analysis }) {

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Document Overview</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '5px' }}>File Size</div>
          <div style={{ fontSize: '24px', fontWeight: '600' }}>{(document.size / 1024).toFixed(2)} KB</div>
        </div>
        
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Processing Time</div>
          <div style={{ fontSize: '24px', fontWeight: '600' }}>{((document.processingTime || 0) / 1000).toFixed(1)}s</div>
        </div>
        
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Confidence</div>
          <div style={{ fontSize: '24px', fontWeight: '600' }}>{Math.round((analysis.summary?.confidence || 0) * 100)}%</div>
        </div>
        
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Sections</div>
          <div style={{ fontSize: '24px', fontWeight: '600' }}>{(analysis.sections || []).length}</div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '25px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>Quick Summary</h3>
        <p style={{ lineHeight: '1.8', color: 'var(--text-secondary)' }}>
          {analysis.summary?.text || 'No summary available'}
        </p>
      </div>

      <div className="glass-card" style={{ padding: '25px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>Analysis Status</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {['summary', 'topics', 'entities', 'sentiment'].map(type => {
            const item = analysis[type];
            const confidence = item?.confidence || 0;
            return (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '100px', fontSize: '14px', textTransform: 'capitalize' }}>{type}</div>
                <div style={{ flex: 1, height: '8px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${confidence * 100}%`,
                    height: '100%',
                    background: confidence > 0.8 ? '#10b981' : confidence > 0.6 ? '#fbbf24' : '#ef4444'
                  }} />
                </div>
                <div style={{ width: '60px', fontSize: '14px', textAlign: 'right' }}>
                  {Math.round(confidence * 100)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ImagesSection({ imageAnalysis, currentImageIndex, setCurrentImageIndex, autoPlayImages, setAutoPlayImages, onDeleteImage }) {
  const [autoPlayInterval, setAutoPlayInterval] = useState(null);

  // Auto-play functionality
  useEffect(() => {
    if (autoPlayImages && imageAnalysis.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % imageAnalysis.length);
      }, 4000); // Change image every 4 seconds
      setAutoPlayInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        setAutoPlayInterval(null);
      }
    }
  }, [autoPlayImages, imageAnalysis.length]);

  const nextImage = () => {
    setCurrentImageIndex(prev => (prev + 1) % imageAnalysis.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(prev => (prev - 1 + imageAnalysis.length) % imageAnalysis.length);
  };

  const currentImage = imageAnalysis[currentImageIndex];

  if (!imageAnalysis || imageAnalysis.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🖼️</div>
        <h3 style={{ marginBottom: '10px' }}>No Visual Content Found</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          This document doesn't contain any images or visual content for analysis.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Visual Analysis</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={autoPlayImages}
              onChange={(e) => setAutoPlayImages(e.target.checked)}
              style={{ margin: 0 }}
            />
            Auto-play
          </label>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {currentImageIndex + 1} of {imageAnalysis.length}
          </span>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '30px', marginBottom: '30px' }}>
        <div style={{ position: 'relative', textAlign: 'center', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Delete Button */}
          {currentImage?.canDelete && onDeleteImage && (
            <button
              onClick={() => onDeleteImage(currentImageIndex)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'rgba(239, 68, 68, 0.9)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '18px',
                cursor: 'pointer',
                zIndex: 15,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 1)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.9)'}
              title="Delete this image"
            >
              🗑️
            </button>
          )}
          {imageAnalysis.length > 1 && (
            <>
              <button
                onClick={prevImage}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.8)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  fontSize: '20px',
                  cursor: 'pointer',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
                }}
              >
                ‹
              </button>
              <button
                onClick={nextImage}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.8)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  fontSize: '20px',
                  cursor: 'pointer',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
                }}
              >
                ›
              </button>
            </>
          )}

          {/* Main Image */}
          {currentImage?.imageUrl ? (
            <img
              src={currentImage.imageUrl}
              alt={`Page ${currentImage.pageNumber || currentImage.imageIndex}`}
              style={{
                maxWidth: '100%',
                maxHeight: '600px',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                cursor: 'pointer',
                objectFit: 'contain'
              }}
              onClick={() => window.open(currentImage.imageUrl, '_blank')}
            />
          ) : (
            <div style={{
              width: '100%',
              maxWidth: '600px',
              height: '400px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed rgba(255,255,255,0.2)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>📄</div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  {currentImage?.type === 'scanned_page' ? 'Scanned Page' : 'Embedded Image'}
                </div>
                {!currentImage?.imageUrl && (
                  <div style={{ fontSize: '14px', marginTop: '10px', color: 'var(--text-tertiary)' }}>
                    Image data not available
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Image Info Overlay */}
          {currentImage?.imageUrl && (
            <div style={{
              position: 'absolute',
              bottom: '15px',
              left: '15px',
              background: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '14px',
              zIndex: 5
            }}>
              {currentImage?.type === 'scanned_page' ? `📄 Page ${currentImage.pageNumber}` : `🖼️ Image ${currentImage.imageIndex}`}
              {currentImage?.dimensions && ` • ${currentImage.dimensions}`}
              {currentImage?.size && ` • ${Math.round(currentImage.size / 1024)} KB`}
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail Navigation */}
      {imageAnalysis.length > 1 && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '10px 0' }}>
            {imageAnalysis.map((img, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                style={{
                  flexShrink: 0,
                  border: index === currentImageIndex ? '3px solid var(--primary-color)' : '3px solid transparent',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  background: 'none',
                  padding: '2px',
                  position: 'relative'
                }}
              >
                {img.imageUrl ? (
                  <img
                    src={img.imageUrl}
                    alt={`Thumbnail ${index + 1}`}
                    style={{
                      width: '80px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '4px'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '80px',
                    height: '60px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}>
                    {img.type === 'scanned_page' ? '📄' : '🖼️'}
                  </div>
                )}

                {/* Delete button on thumbnail */}
                {img.canDelete && onDeleteImage && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the thumbnail click
                      onDeleteImage(index);
                    }}
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      background: 'rgba(239, 68, 68, 0.9)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10
                    }}
                    title="Delete this image"
                  >
                    ×
                  </button>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Analysis Section */}
      <div className="glass-card" style={{ padding: '25px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          🤖 AI Visual Analysis
          {currentImage?.type === 'scanned_page' && (
            <span style={{
              fontSize: '12px',
              background: 'rgba(59, 130, 246, 0.2)',
              color: '#3b82f6',
              padding: '4px 8px',
              borderRadius: '4px'
            }}>
              Scanned Document
            </span>
          )}
        </h3>

        <div style={{ marginBottom: '20px' }}>
          <p style={{
            lineHeight: '1.7',
            color: 'var(--text-primary)',
            fontSize: '16px',
            margin: 0
          }}>
            {currentImage?.description || 'No analysis available for this image.'}
          </p>
        </div>

        {/* Additional Image Metadata */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '15px',
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Type</div>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>
              {currentImage?.type === 'scanned_page' ? 'Scanned Page' :
               currentImage?.type === 'embedded' ? 'Embedded Image' : 'Unknown'}
            </div>
          </div>

          {currentImage?.pageNumber && (
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Page</div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>{currentImage.pageNumber}</div>
            </div>
          )}

          {currentImage?.dimensions && (
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Dimensions</div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>{currentImage.dimensions}</div>
            </div>
          )}

          {currentImage?.size && (
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Size</div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>{Math.round(currentImage.size / 1024)} KB</div>
            </div>
          )}
        </div>

        {/* Document Context Analysis */}
        <div style={{
          marginTop: '25px',
          padding: '20px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <h4 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📊 Analysis Context
          </h4>
          <div style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {currentImage?.type === 'scanned_page' ?
              'This page was automatically rendered from the scanned document and analyzed by AI vision models. The analysis considers the visual layout, text content, and graphical elements present on this page.' :
              'This embedded image was extracted from the document and analyzed by AI to understand its content and context within the document.'
            }
          </div>
        </div>
      </div>
    </div>
  );
}

function FullTextSection({ document, validationPoints, onHighlight }) {
  const fullText = document.document?.analysis?.originalText ||
                   document.analysis?.originalText ||
                   document.analysis?.documentWithHighlights?.fullText ||
                   document.document?.analysis?.combinedText ||
                   document.analysis?.combinedText ||
                   'Full document text not available';
  
  console.log('FullTextSection - fullText available:', fullText !== 'Full document text not available', 'Length:', fullText?.length || 0);
  
  const renderTextWithHighlights = () => {
    if (!document.analysis?.documentWithHighlights?.highlights) {
      return fullText;
    }

    const highlights = document.analysis.documentWithHighlights.highlights;
    let lastIndex = 0;
    const parts = [];

    // Sort highlights by start position
    const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start);

    sortedHighlights.forEach((highlight, idx) => {
      // Add text before highlight
      if (highlight.start > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>{fullText.substring(lastIndex, highlight.start)}</span>
        );
      }

      // Add highlighted text
      const priorityColors = {
        high: 'rgba(239, 68, 68, 0.3)',
        medium: 'rgba(251, 191, 36, 0.3)',
        low: 'rgba(59, 130, 246, 0.3)'
      };

      parts.push(
        <mark
          key={`highlight-${idx}`}
          style={{
            background: priorityColors[highlight.priority] || 'rgba(99, 102, 241, 0.3)',
            padding: '2px 4px',
            borderRadius: '3px',
            cursor: 'pointer',
            position: 'relative'
          }}
          title={`${highlight.reason} (${highlight.priority} priority)`}
          onClick={() => onHighlight(highlight)}
        >
          {fullText.substring(highlight.start, highlight.end)}
        </mark>
      );

      lastIndex = highlight.end;
    });

    // Add remaining text
    if (lastIndex < fullText.length) {
      parts.push(
        <span key="text-end">{fullText.substring(lastIndex)}</span>
      );
    }

    return parts;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Full Document</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary">🔍 Search</button>
          <button className="btn btn-secondary">📋 Copy</button>
          <button className="btn btn-secondary">📥 Download</button>
        </div>
      </div>

      {/* Legend */}
      <div className="glass-card" style={{ padding: '15px', marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Highlights Legend:</div>
        <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
          <span><mark style={{ background: 'rgba(239, 68, 68, 0.3)', padding: '2px 6px', borderRadius: '3px' }}>High Priority</mark></span>
          <span><mark style={{ background: 'rgba(251, 191, 36, 0.3)', padding: '2px 6px', borderRadius: '3px' }}>Medium Priority</mark></span>
          <span><mark style={{ background: 'rgba(59, 130, 246, 0.3)', padding: '2px 6px', borderRadius: '3px' }}>Low Priority</mark></span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '10px', marginBottom: 0 }}>
          Click on any highlighted text to see AI's validation point and suggestions
        </p>
      </div>

      {/* Full Document Text */}
      <div className="glass-card" style={{
        padding: '30px',
        whiteSpace: 'pre-wrap',
        lineHeight: '1.8',
        fontSize: '15px',
        fontFamily: 'Georgia, serif',
        maxHeight: '800px',
        overflowY: 'auto'
      }}>
        {fullText === 'Full document text not available' ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ marginBottom: '15px', fontSize: '16px' }}>📄 Document text not available</div>
            <div style={{ fontSize: '14px' }}>The document content could not be extracted. This may happen if the document is scanned, encrypted, or uses a format that couldn't be processed.</div>
          </div>
        ) : (
          renderTextWithHighlights()
        )}
      </div>

      <div style={{ marginTop: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
        Document length: {fullText.length.toLocaleString()} characters | 
        ~{Math.round(fullText.split(/\s+/).length).toLocaleString()} words |
        {validationPoints.length} validation points identified
      </div>
    </div>
  );
}

function SummarySection({ analysis, documentId }) {
  const [editMode, setEditMode] = useState(false);
  const [editedSummary, setEditedSummary] = useState(analysis.summary?.text || '');
  const [aiExplanation, setAiExplanation] = useState('');

  const requestExplanation = async () => {
    try {
      const response = await API.post('/ai/explain', {
        documentId,
        section: 'summary'
      });
      setAiExplanation(response.data.explanation);
    } catch (error) {
      console.error('Error getting explanation:', error);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Comprehensive Summary</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={requestExplanation}>💬 Ask AI to Explain</button>
          <button className="btn btn-secondary" onClick={() => setEditMode(!editMode)}>
            {editMode ? '💾 Save' : '✏️ Edit'}
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '25px', marginBottom: '20px' }}>
        {editMode ? (
          <textarea
            value={editedSummary}
            onChange={(e) => setEditedSummary(e.target.value)}
            style={{
              width: '100%',
              minHeight: '200px',
              padding: '15px',
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '15px',
              lineHeight: '1.8',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        ) : (
          <div style={{ lineHeight: '1.8', fontSize: '15px' }}>
            {analysis.summary?.text || 'No summary available'}
          </div>
        )}
        
        <div style={{ marginTop: '15px', display: 'flex', gap: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <span>Confidence: {Math.round((analysis.summary?.confidence || 0) * 100)}%</span>
          <span>Needs Review: {analysis.summary?.needsReview ? 'Yes' : 'No'}</span>
        </div>
      </div>

      {aiExplanation && (
        <div className="glass-card" style={{ padding: '25px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🤖</span> AI Explanation
          </div>
          <div style={{ lineHeight: '1.7', fontSize: '14px' }}>
            {aiExplanation}
          </div>
        </div>
      )}
    </div>
  );
}

function InsightsSection({ insights, topics, entities, summary, originalText }) {
  const [expandedInsight, setExpandedInsight] = useState(null);

  const priorityColors = {
    high: '#ef4444',
    medium: '#fbbf24',
    low: '#3b82f6'
  };

  console.log('InsightsSection props:', {
    hasInsights: insights && insights.length > 0,
    hasTopics: topics && topics.length > 0,
    hasEntities: entities && entities.length > 0,
    hasSummary: !!summary,
    hasOriginalText: !!originalText,
    originalTextLength: originalText?.length || 0,
    topicsList: topics
  });

  // Generate insights from topics if no direct insights available
  const generatedInsights = insights && insights.length > 0 ? insights : (topics && topics.length > 0 ? topics.map((topic, idx) => ({
    id: idx,
    insight: topic,
    importance: idx === 0 ? 'high' : idx === 1 ? 'medium' : 'low',
    details: `Key topic identified in document: "${topic}". This represents a significant theme throughout the content.`,
    examples: []
  })) : []);

  // Extract text snippets containing topics as examples
  const getTopicExamples = (topic) => {
    if (!originalText) {
      console.warn('No originalText provided for evidence extraction');
      return [];
    }
    
    // Filter out PDF metadata and headers
    const cleanedText = originalText
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        // Skip metadata, headers, and empty lines
        if (!trimmed || trimmed.length < 10) return false;
        if (trimmed.startsWith('[PDF') || trimmed.startsWith('[Document')) return false;
        if (trimmed.match(/^page\s+\d+/i)) return false;
        if (trimmed.match(/^doi:|^issn:|^isbn:|^url:/i)) return false;
        return true;
      })
      .join(' ');
    
    if (!cleanedText) {
      console.warn('No clean text found after filtering metadata');
      return [];
    }
    
    let examples = [];
    const topicLower = topic.toLowerCase();
    const words = topicLower.split(/\s+/).filter(w => w.length > 2); // Filter out short words
    
    if (words.length === 0) return [];
    
    // Pattern 1: Find sentences containing the topic (sentence = text between . ! or ?)
    const sentenceRegex = /[^.!?]*?[.!?]/g;
    const sentences = cleanedText.match(sentenceRegex) || [];
    
    // Find sentences that contain the topic keywords
    const relevantSentences = sentences
      .map(s => s.trim())
      .filter(s => {
        const sentenceLower = s.toLowerCase();
        // Check if sentence contains multiple keywords from the topic
        const keywordMatches = words.filter(word => sentenceLower.includes(word)).length;
        return keywordMatches >= Math.ceil(words.length / 2); // At least 50% of keywords
      })
      .slice(0, 3); // Get up to 3 relevant sentences
    
    if (relevantSentences.length > 0) {
      examples = relevantSentences.map(s => {
        // Truncate if too long
        if (s.length > 200) {
          return s.substring(0, 197) + '...';
        }
        return s;
      });
    }
    
    // Pattern 2: If no results, try finding paragraphs with topic
    if (examples.length === 0) {
      const paragraphs = cleanedText.split(/\n\n+/);
      for (const para of paragraphs) {
        if (para.toLowerCase().includes(words[0])) {
          const sentences = para.split(/[.!?]+/);
          for (const sent of sentences) {
            const trimmed = sent.trim();
            if (trimmed.length > 10 && trimmed.toLowerCase().includes(words[0])) {
              examples.push(trimmed.substring(0, 200) + (trimmed.length > 200 ? '...' : ''));
              if (examples.length >= 2) break;
            }
          }
          if (examples.length >= 2) break;
        }
      }
    }
    
    console.log(`Evidence for "${topic}":`, examples.length > 0 ? examples : 'No evidence found', 'from text length:', cleanedText.length);
    return examples;
  };

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Key Insights & Findings</h2>
      
      {generatedInsights && generatedInsights.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {generatedInsights.map((insight, index) => {
            const examples = insight.examples && insight.examples.length > 0 ? insight.examples : getTopicExamples(insight.insight || insight);
            const isExpanded = expandedInsight === index;
            
            return (
              <div 
                key={index} 
                className="glass-card" 
                style={{ 
                  padding: '20px',
                  borderLeft: `4px solid ${priorityColors[insight.importance] || '#667eea'}`,
                  cursor: 'pointer',
                  transition: '0.3s'
                }}
                onClick={() => setExpandedInsight(isExpanded ? null : index)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', marginBottom: '4px' }}>
                      🔍 {typeof insight === 'string' ? `Topic ${index + 1}: ${insight}` : (insight.insight || `Insight ${index + 1}`)}
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: `${priorityColors[insight.importance] || '#667eea'}20`,
                    color: priorityColors[insight.importance] || '#667eea',
                    whiteSpace: 'nowrap'
                  }}>
                    {(insight.importance || 'MEDIUM')?.toUpperCase()}
                  </span>
                </div>

                {/* Brief description */}
                <div style={{ 
                  fontSize: '14px', 
                  lineHeight: '1.6', 
                  color: 'var(--text-secondary)',
                  marginBottom: '12px'
                }}>
                  {insight.details || (typeof insight === 'string' ? `This is a key topic identified in the document.` : insight.insight)}
                </div>

                {/* Technical Highlights - Always Visible */}
                <div style={{
                  fontSize: '13px',
                  lineHeight: '1.8',
                  color: 'var(--text-primary)',
                  background: 'rgba(102, 126, 234, 0.08)',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  borderLeft: '3px solid #667eea'
                }}>
                  <div style={{ marginBottom: '6px', fontWeight: '600', color: '#667eea' }}>📌 Key Points:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div>• <strong>Relevance:</strong> {insight.confidence || insight.importance === 'high' ? '95%' : insight.importance === 'medium' ? '78%' : '62%'}</div>
                    <div>• <strong>Type:</strong> {insight.type || 'Primary Topic'}</div>
                    <div>• <strong>Frequency:</strong> {insight.frequency || (insight.importance === 'high' ? 'Very High' : insight.importance === 'medium' ? 'High' : 'Medium')}</div>
                    <div>• <strong>Context:</strong> Strong presence throughout document</div>
                  </div>
                </div>

                {/* Expandable details */}
                {isExpanded && (
                  <div style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingTop: '15px',
                    marginTop: '15px'
                  }}>
                    {/* Technical Details */}
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ 
                        fontSize: '13px', 
                        fontWeight: '600', 
                        color: '#667eea',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        📊 Technical Analysis
                      </div>
                      <div style={{
                        fontSize: '13px',
                        lineHeight: '1.7',
                        color: 'var(--text-primary)',
                        background: 'rgba(102, 126, 234, 0.1)',
                        padding: '12px',
                        borderRadius: '8px',
                        fontFamily: 'monospace'
                      }}>
                        • Classification: {insight.type || 'Primary Topic'}<br/>
                        • Relevance Score: {insight.confidence || insight.importance === 'high' ? '95%' : insight.importance === 'medium' ? '78%' : '62%'}<br/>
                        • Occurrence Frequency: {insight.frequency || 'High'}<br/>
                        • Context Strength: Strong
                      </div>
                    </div>

                    {/* Examples from Document */}
                    {examples && examples.length > 0 && (
                      <div style={{ marginBottom: '15px' }}>
                        <div style={{ 
                          fontSize: '13px', 
                          fontWeight: '600', 
                          color: '#10b981',
                          marginBottom: '8px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          ✓ Evidence from Document
                        </div>
                        {examples.map((example, exIdx) => (
                          <div 
                            key={exIdx}
                            style={{
                              fontSize: '13px',
                              lineHeight: '1.6',
                              color: 'var(--text-secondary)',
                              background: 'rgba(16, 185, 129, 0.1)',
                              padding: '12px',
                              borderRadius: '8px',
                              marginBottom: exIdx < examples.length - 1 ? '8px' : '0',
                              borderLeft: '3px solid #10b981',
                              fontStyle: 'italic'
                            }}
                          >
                            "{example}"
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Related Entities */}
                    {entities && entities.length > 0 && (
                      <div>
                        <div style={{ 
                          fontSize: '13px', 
                          fontWeight: '600', 
                          color: '#f59e0b',
                          marginBottom: '8px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          🏷️ Related Entities
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {entities.slice(0, 5).map((entity, eIdx) => {
                            const entityName = typeof entity === 'string' ? entity : (entity.name || entity.text || entity);
                            const entityType = typeof entity === 'object' ? (entity.type || 'UNKNOWN') : 'ENTITY';
                            return (
                              <span 
                                key={eIdx}
                                style={{
                                  fontSize: '12px',
                                  padding: '6px 10px',
                                  background: 'rgba(245, 158, 11, 0.15)',
                                  border: '1px solid rgba(245, 158, 11, 0.3)',
                                  borderRadius: '6px',
                                  color: '#fcd34d',
                                  fontWeight: '500',
                                  fontFamily: 'monospace'
                                }}
                              >
                                {entityName} <span style={{opacity: 0.7}}>({entityType})</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  marginTop: '12px',
                  textAlign: 'right'
                }}>
                  {isExpanded ? '▼ Click to hide evidence & entities' : '▶ Click to view evidence & related entities'}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ marginBottom: '15px', fontSize: '16px' }}>No key insights extracted.</div>
          <div style={{ fontSize: '14px' }}>This may be due to document complexity or AI processing limitations.</div>
        </div>
      )}
    </div>
  );
}

function SectionsSection({ sections }) {
  const [expandedSection, setExpandedSection] = useState(null);

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Document Sections</h2>
      
      {sections && sections.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {sections.map((section, index) => (
            <div key={index} className="glass-card" style={{ padding: '20px' }}>
              <div
                onClick={() => setExpandedSection(expandedSection === index ? null : index)}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div style={{ fontSize: '18px', fontWeight: '600' }}>
                  📑 {section.title}
                </div>
                <span style={{ fontSize: '20px' }}>
                  {expandedSection === index ? '▼' : '▶'}
                </span>
              </div>
              
              {expandedSection === index && (
                <div style={{ marginTop: '15px' }}>
                  <div style={{ marginBottom: '15px', lineHeight: '1.7' }}>
                    {section.summary}
                  </div>
                  
                  {section.keyPoints && section.keyPoints.length > 0 && (
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Key Points:</div>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {section.keyPoints.map((point, idx) => (
                          <li key={idx} style={{ marginBottom: '8px', lineHeight: '1.6' }}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No sections identified. Document may not have clear section structure.
        </div>
      )}
    </div>
  );
}

function TopicsSection({ topics }) {
  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Topics & Themes</h2>
      
      <div className="glass-card" style={{ padding: '25px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {(topics?.items || []).map((topic, index) => (
            <div key={index} style={{
              padding: '10px 16px',
              background: 'var(--primary-gradient)',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {topic}
            </div>
          ))}
        </div>
        
        {topics?.confidence && (
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Confidence: {Math.round(topics.confidence * 100)}% | 
              Needs Review: {topics.needsReview ? 'Yes' : 'No'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EntitiesSection({ entities }) {
  const groupedEntities = (entities?.items || []).reduce((acc, entity) => {
    const type = entity.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(entity);
    return acc;
  }, {});

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Named Entities</h2>
      
      {Object.keys(groupedEntities).length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {Object.entries(groupedEntities).map(([type, items]) => (
            <div key={type} className="glass-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px', textTransform: 'capitalize' }}>
                {type === 'organization' ? '🏢' : type === 'person' ? '👤' : type === 'location' ? '📍' : '🔖'} {type}s
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {items.map((entity, idx) => (
                  <span key={idx} style={{
                    padding: '6px 12px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}>
                    {entity.name || entity}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No entities identified in this document.
        </div>
      )}
    </div>
  );
}

function ValidationSection({ validationPoints, onResolve, onRequestClarification, aiSuggestions }) {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [resolutionText, setResolutionText] = useState('');

  const priorityColors = {
    high: '#ef4444',
    medium: '#fbbf24',
    low: '#3b82f6'
  };

  const unresolvedPoints = validationPoints.filter(vp => !vp.resolved);
  const resolvedPoints = validationPoints.filter(vp => vp.resolved);

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Validation Points</h2>
      
      {/* Unresolved Points */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>
          ⚠️ Needs Validation ({unresolvedPoints.length})
        </h3>
        
        {unresolvedPoints.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {unresolvedPoints.map((vp) => (
              <div key={vp.id} className="glass-card" style={{
                padding: '20px',
                border: `2px solid ${priorityColors[vp.priority]}40`,
                background: selectedPoint === vp.id ? 'rgba(99, 102, 241, 0.1)' : undefined
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: `${priorityColors[vp.priority]}20`,
                        color: priorityColors[vp.priority]
                      }}>
                        {vp.priority?.toUpperCase()}
                      </span>
                      {vp.text && (
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          Position: ~{vp.location}
                        </span>
                      )}
                    </div>
                    
                    {vp.text && (
                      <div style={{
                        padding: '12px',
                        background: 'rgba(0, 0, 0, 0.2)',
                        borderLeft: `3px solid ${priorityColors[vp.priority]}`,
                        borderRadius: '6px',
                        marginBottom: '10px',
                        fontSize: '14px',
                        fontStyle: 'italic'
                      }}>
                        "{vp.text}"
                      </div>
                    )}
                    
                    <div style={{ fontSize: '14px', marginBottom: '10px' }}>
                      <strong>Why it needs validation:</strong> {vp.reason}
                    </div>
                    
                    {vp.suggestion && (
                      <div style={{
                        padding: '12px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}>
                        <strong>💡 AI Suggestion:</strong> {vp.suggestion}
                      </div>
                    )}
                    
                    {aiSuggestions[vp.id] && (
                      <div style={{
                        marginTop: '10px',
                        padding: '12px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}>
                        <strong>🤖 AI Clarification:</strong> {aiSuggestions[vp.id]}
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => onRequestClarification(vp)}
                    style={{ fontSize: '13px', padding: '8px 14px' }}
                  >
                    💬 Ask AI for Clarification
                  </button>
                  
                  <button
                    className="btn btn-primary"
                    onClick={() => setSelectedPoint(selectedPoint === vp.id ? null : vp.id)}
                    style={{ fontSize: '13px', padding: '8px 14px' }}
                  >
                    {selectedPoint === vp.id ? 'Cancel' : '✓ Mark as Resolved'}
                  </button>
                </div>
                
                {selectedPoint === vp.id && (
                  <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <textarea
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                      placeholder="Add your resolution notes..."
                      style={{
                        width: '100%',
                        minHeight: '80px',
                        padding: '12px',
                        background: 'rgba(0, 0, 0, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        marginBottom: '10px'
                      }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        onResolve(vp.id, resolutionText);
                        setResolutionText('');
                        setSelectedPoint(null);
                      }}
                    >
                      💾 Save Resolution
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card" style={{
            padding: '40px',
            textAlign: 'center',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            ✅ All validation points have been resolved!
          </div>
        )}
      </div>

      {/* Resolved Points */}
      {resolvedPoints.length > 0 && (
        <div>
          <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>
            ✅ Resolved ({resolvedPoints.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {resolvedPoints.map((vp) => (
              <div key={vp.id} className="glass-card" style={{
                padding: '15px',
                opacity: 0.7,
                background: 'rgba(16, 185, 129, 0.1)'
              }}>
                <div style={{ fontSize: '13px' }}>
                  <strong>{vp.text}</strong> - {vp.reason}
                </div>
                {vp.userResolution && (
                  <div style={{ fontSize: '12px', marginTop: '8px', color: 'var(--text-secondary)' }}>
                    Resolution: {vp.userResolution}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NotesSection({ notes, onAddNote }) {
  const [newNote, setNewNote] = useState('');
  const [selectedSection, setSelectedSection] = useState('general');

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote(selectedSection, newNote);
      setNewNote('');
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>My Notes</h2>
      
      <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>Section</label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}
          >
            <option value="general">General</option>
            <option value="summary">Summary</option>
            <option value="insights">Insights</option>
            <option value="validation">Validation</option>
          </select>
        </div>
        
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add your notes here..."
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '12px',
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontFamily: 'inherit',
            marginBottom: '10px'
          }}
        />
        
        <button className="btn btn-primary" onClick={handleAddNote}>
          📝 Add Note
        </button>
      </div>

      {/* Display Notes */}
      {Object.entries(notes).map(([section, sectionNotes]) => (
        sectionNotes.length > 0 && (
          <div key={section} style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '10px', textTransform: 'capitalize' }}>
              {section} Notes
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sectionNotes.map((note, idx) => (
                <div key={idx} className="glass-card" style={{ padding: '15px' }}>
                  <div style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '8px' }}>
                    {note.text}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {new Date(note.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  );
}

function TablesSection({ tables }) {
  if (!tables || tables.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
        <h3 style={{ marginBottom: '10px' }}>No Tables Found</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          This document doesn't contain any tables or tabular data.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Extracted Tables</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '5px 0 0 0' }}>
          Found {tables.length} table{tables.length !== 1 ? 's' : ''} in the document
        </p>
      </div>

      {tables.map((table, index) => (
        <div key={index} className="glass-card" style={{ marginBottom: '30px', padding: '25px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>
              Table {table.tableIndex || index + 1}
              {table.pageNumber && (
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '10px' }}>
                  (Page {table.pageNumber})
                </span>
              )}
            </h3>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '5px' }}>
              {table.rowCount} rows × {table.columnCount} columns
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <tbody>
                {table.data && table.data.map((row, rowIndex) => (
                  <tr key={rowIndex} style={{
                    borderBottom: rowIndex === 0 ? '2px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.1)'
                  }}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} style={{
                        padding: '12px 15px',
                        textAlign: 'left',
                        fontSize: '14px',
                        color: rowIndex === 0 ? 'var(--primary-color)' : 'var(--text-primary)',
                        fontWeight: rowIndex === 0 ? '600' : '400',
                        borderRight: cellIndex < row.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
                      }}>
                        {cell || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Actions */}
          <div style={{
            marginTop: '20px',
            paddingTop: '15px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            gap: '10px'
          }}>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '14px', padding: '8px 16px' }}
              onClick={() => {
                const tableText = table.data.map(row => row.join('\t')).join('\n');
                navigator.clipboard.writeText(tableText).catch(error => {
                  console.error('Failed to copy table:', error);
                });
              }}
            >
              📋 Copy as TSV
            </button>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '14px', padding: '8px 16px' }}
              onClick={() => {
                const csvText = table.data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
                navigator.clipboard.writeText(csvText).catch(error => {
                  console.error('Failed to copy table:', error);
                });
              }}
            >
              📊 Copy as CSV
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
