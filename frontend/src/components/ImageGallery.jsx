import { useState, useEffect } from 'react';
import API from '../api/api';

export default function ImageGallery({ documentId, filename }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (documentId) {
      loadImages();
    }
  }, [documentId]);

  const loadImages = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(`🖼️ Loading images for document ${documentId}`);
      const response = await API.get(`/metadata/documents/${documentId}/metadata`);
      
      if (response.data && response.data.success) {
        const metadata = response.data.metadata;
        const extractedImages = metadata.analysis?.images || [];
        setImages(extractedImages);
        console.log(`✅ Found ${extractedImages.length} images`);
      }
    } catch (err) {
      console.error('❌ Error loading images:', err);
      setError('Failed to load images from document');
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = filterType === 'all' 
    ? images 
    : images.filter(img => img.type === filterType);

  const imageTypes = [...new Set(images.map(img => img.type || 'unknown'))];

  if (!documentId) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: 'var(--text-secondary)'
      }}>
        Select a document to view extracted images
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '14px', marginBottom: '10px' }}>Loading images...</div>
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

  if (images.length === 0) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: 'var(--text-secondary)'
      }}>
        🖼️ No images found in this document
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <div style={{
          fontSize: '18px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🖼️ Extracted Images ({filteredImages.length})
        </div>

        {/* Image Type Filter */}
        {imageTypes.length > 1 && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setFilterType('all')}
              style={{
                padding: '6px 12px',
                background: filterType === 'all' 
                  ? 'var(--primary-gradient)' 
                  : 'rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              All
            </button>
            {imageTypes.map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                style={{
                  padding: '6px 12px',
                  background: filterType === type 
                    ? 'var(--primary-gradient)' 
                    : 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {type === 'embedded' && '📎 Embedded'}
                {type === 'scanned' && '📷 Scanned'}
                {type === 'rendered' && '🖨️ Rendered'}
                {type !== 'embedded' && type !== 'scanned' && type !== 'rendered' && `📌 ${type}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Image Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '15px'
      }}>
        {filteredImages.map((image, index) => (
          <div
            key={index}
            onClick={() => setSelectedImageIndex(selectedImageIndex === index ? null : index)}
            style={{
              cursor: 'pointer',
              borderRadius: '8px',
              overflow: 'hidden',
              border: selectedImageIndex === index 
                ? '2px solid var(--primary-color)' 
                : '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            {/* Placeholder or actual image */}
            <div style={{
              width: '100%',
              paddingBottom: '100%',
              position: 'relative',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px'
            }}>
              {image.data && image.data.startsWith('data:image') ? (
                <img
                  src={image.data}
                  alt={`Image ${index + 1}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                '🖼️'
              )}
            </div>

            {/* Image Info */}
            <div style={{
              padding: '10px',
              fontSize: '11px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                {image.type === 'embedded' && '📎 Embedded'}
                {image.type === 'scanned' && '📷 Scanned'}
                {image.type === 'rendered' && '🖨️ Rendered'}
                {image.type !== 'embedded' && image.type !== 'scanned' && image.type !== 'rendered' && `📌 ${image.type}`}
              </div>
              {image.width && image.height && (
                <div style={{ color: 'var(--text-secondary)' }}>
                  {image.width}×{image.height}px
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Image Viewer */}
      {selectedImageIndex !== null && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            position: 'relative',
            maxWidth: '90%',
            maxHeight: '90%',
            background: 'rgba(0, 0, 0, 0.9)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setSelectedImageIndex(null)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                width: '40px',
                height: '40px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '50%',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>

            {/* Image Display */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              maxHeight: '60vh'
            }}>
              {filteredImages[selectedImageIndex].data && 
               filteredImages[selectedImageIndex].data.startsWith('data:image') ? (
                <img
                  src={filteredImages[selectedImageIndex].data}
                  alt={`Full size`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    borderRadius: '8px'
                  }}
                />
              ) : (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: 'var(--text-secondary)'
                }}>
                  Image not available for preview
                </div>
              )}
            </div>

            {/* Image Details */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '15px',
              borderRadius: '8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Type:</span>
                  <span style={{ marginLeft: '8px', fontWeight: '600' }}>
                    {filteredImages[selectedImageIndex].type || 'Unknown'}
                  </span>
                </div>
                {filteredImages[selectedImageIndex].width && (
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Dimensions:</span>
                    <span style={{ marginLeft: '8px', fontWeight: '600' }}>
                      {filteredImages[selectedImageIndex].width}×{filteredImages[selectedImageIndex].height}px
                    </span>
                  </div>
                )}
              </div>
              {filteredImages[selectedImageIndex].description && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ color: 'var(--text-secondary)', marginBottom: '6px', fontSize: '12px' }}>
                    Description:
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                    {filteredImages[selectedImageIndex].description}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '13px'
            }}>
              <button
                onClick={() => setSelectedImageIndex(selectedImageIndex === 0 ? filteredImages.length - 1 : selectedImageIndex - 1)}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                ← Previous
              </button>
              <span style={{ color: 'var(--text-secondary)' }}>
                {selectedImageIndex + 1} / {filteredImages.length}
              </span>
              <button
                onClick={() => setSelectedImageIndex(selectedImageIndex === filteredImages.length - 1 ? 0 : selectedImageIndex + 1)}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
