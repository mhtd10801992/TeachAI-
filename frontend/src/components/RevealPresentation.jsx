import React, { useEffect, useRef } from 'react';
import Reveal from 'reveal.js';
import mermaid from 'mermaid';
import { Chart as ChartJS, registerables } from 'chart.js';
import 'reveal.js/dist/reveal.css';
import 'reveal.js/dist/theme/black.css'; // You can change themes

// Register Chart.js components
ChartJS.register(...registerables);

// Initialize Mermaid
mermaid.initialize({ 
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#667eea',
    primaryTextColor: '#fff',
    primaryBorderColor: '#667eea',
    lineColor: '#61dafb',
    secondaryColor: '#764ba2',
    tertiaryColor: '#667eea'
  }
});

/**
 * Reveal.js Presentation Component
 * Renders AI-generated slides in a professional presentation format
 * with charts, Mermaid diagrams, and rich content
 */
function RevealPresentation({ slides, onClose }) {
  const deckDivRef = useRef(null);
  const deckRef = useRef(null);
  const chartsRef = useRef({});

  useEffect(() => {
    if (deckDivRef.current && slides && slides.length > 0) {
      // Initialize Reveal.js
      deckRef.current = new Reveal(deckDivRef.current, {
        embedded: false,
        keyboardCondition: 'focused',
        controls: true,
        progress: true,
        center: true,
        hash: true,
        transition: 'slide',
        width: 1200,
        height: 800,
        margin: 0.04,
        minScale: 0.2,
        maxScale: 2.0,
        plugins: []
      });

      deckRef.current.initialize().then(() => {
        console.log('✅ Reveal.js initialized');
        
        // Render Mermaid diagrams after Reveal initializes
        setTimeout(() => {
          mermaid.run({
            querySelector: '.mermaid'
          });
        }, 100);
        
        // Render charts after Reveal initializes
        renderCharts();
      });
      
      // Add event listener for slide changes to re-render charts
      deckRef.current.on('slidechanged', () => {
        setTimeout(() => renderCharts(), 100);
      });
    }

    // Cleanup
    return () => {
      try {
        // Destroy charts
        Object.values(chartsRef.current).forEach(chart => {
          if (chart) chart.destroy();
        });
        chartsRef.current = {};
        
        if (deckRef.current) {
          deckRef.current.destroy();
        }
      } catch (e) {
        console.warn('Error destroying Reveal instance:', e);
      }
    };
  }, [slides]);

  if (!slides || slides.length === 0) {
    return null;
  }

  // Render charts function
  const renderCharts = () => {
    slides.forEach((slide, slideIndex) => {
      if (slide.chart && slide.chart.data) {
        const canvasId = `chart-${slideIndex}`;
        const canvas = document.getElementById(canvasId);
        
        if (canvas) {
          // Destroy existing chart if it exists
          if (chartsRef.current[canvasId]) {
            chartsRef.current[canvasId].destroy();
          }
          
          const ctx = canvas.getContext('2d');
          const chartConfig = {
            type: slide.chart.type || 'bar',
            data: {
              labels: slide.chart.labels || [],
              datasets: [{
                label: slide.chart.title || 'Data',
                data: slide.chart.data || [],
                backgroundColor: [
                  'rgba(102, 126, 234, 0.6)',
                  'rgba(118, 75, 162, 0.6)',
                  'rgba(97, 218, 251, 0.6)',
                  'rgba(255, 215, 0, 0.6)',
                  'rgba(239, 68, 68, 0.6)'
                ],
                borderColor: [
                  'rgba(102, 126, 234, 1)',
                  'rgba(118, 75, 162, 1)',
                  'rgba(97, 218, 251, 1)',
                  'rgba(255, 215, 0, 1)',
                  'rgba(239, 68, 68, 1)'
                ],
                borderWidth: 2
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  labels: {
                    color: 'white'
                  }
                },
                title: {
                  display: true,
                  text: slide.chart.title || '',
                  color: 'white',
                  font: {
                    size: 16
                  }
                }
              },
              scales: slide.chart.type !== 'pie' ? {
                y: {
                  ticks: { color: 'white' },
                  grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                  ticks: { color: 'white' },
                  grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
              } : {}
            }
          };
          
          chartsRef.current[canvasId] = new ChartJS(ctx, chartConfig);
        }
      }
    });
  };

  // Render LaTeX equations
  const renderEquation = (latex) => {
    return (
      <div style={{ 
        fontSize: '1.2em', 
        margin: '15px 0',
        padding: '10px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '5px'
      }}>
        {/* Using simple display - you can add MathJax if needed */}
        <code>{latex}</code>
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10000,
      background: '#191919'
    }}>
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 10001,
          padding: '10px 20px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '5px',
          color: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600'
        }}
      >
        ✕ Close Presentation
      </button>

      {/* Reveal.js container */}
      <div className="reveal" ref={deckDivRef}>
        <div className="slides">
          {slides.map((slide, index) => (
            <section key={index} data-transition="slide">
              {/* Slide Title */}
              <h2 style={{ marginBottom: '15px', fontSize: '2.2em' }}>
                {slide.title}
              </h2>

              {/* Description */}
              {slide.description && (
                <p style={{ 
                  fontSize: '0.9em', 
                  marginBottom: '25px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontStyle: 'italic'
                }}>
                  {slide.description}
                </p>
              )}

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: slide.chart || slide.mermaidDiagram ? '1fr 1fr' : '1fr',
                gap: '30px',
                alignItems: 'start'
              }}>
                {/* Left column - Text content */}
                <div>
                  {/* Bullet Points */}
                  {slide.bullets && slide.bullets.length > 0 && (
                    <ul style={{ 
                      textAlign: 'left', 
                      fontSize: '0.85em',
                      lineHeight: '1.6',
                      marginBottom: '20px'
                    }}>
                      {slide.bullets.map((bullet, bIndex) => (
                        <li key={bIndex} style={{ marginBottom: '12px' }}>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Metrics */}
                  {slide.metrics && slide.metrics.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                      <h4 style={{ fontSize: '1em', marginBottom: '10px', color: '#ffd700' }}>
                        📊 Key Metrics:
                      </h4>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr',
                        gap: '8px',
                        fontSize: '0.8em'
                      }}>
                        {slide.metrics.map((metric, mIndex) => (
                          <div
                            key={mIndex}
                            style={{
                              padding: '10px',
                              background: 'rgba(255, 215, 0, 0.1)',
                              border: '1px solid rgba(255, 215, 0, 0.3)',
                              borderRadius: '5px',
                              textAlign: 'left'
                            }}
                          >
                            {metric}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Equations */}
                  {slide.equations && slide.equations.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                      <h4 style={{ fontSize: '1em', marginBottom: '10px', color: '#61dafb' }}>
                        📐 Equations:
                      </h4>
                      {slide.equations.map((eq, eIndex) => (
                        <div key={eIndex}>
                          {renderEquation(eq)}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Image References */}
                  {slide.imageReferences && slide.imageReferences.length > 0 && (
                    <div style={{ marginTop: '15px', fontSize: '0.75em', color: 'rgba(255, 255, 255, 0.6)' }}>
                      <strong>📷 Related Images:</strong>
                      <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                        {slide.imageReferences.map((ref, rIndex) => (
                          <li key={rIndex}>{ref}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Right column - Visual content */}
                <div>
                  {/* Chart */}
                  {slide.chart && slide.chart.data && (
                    <div style={{ marginBottom: '20px' }}>
                      <canvas 
                        id={`chart-${index}`}
                        style={{ 
                          maxHeight: '350px',
                          background: 'rgba(0, 0, 0, 0.2)',
                          borderRadius: '8px',
                          padding: '15px'
                        }}
                      />
                      {slide.chart.description && (
                        <p style={{ 
                          fontSize: '0.7em', 
                          marginTop: '10px',
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontStyle: 'italic'
                        }}>
                          {slide.chart.description}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Mermaid Diagram */}
                  {slide.mermaidDiagram && (
                    <div style={{ marginTop: '20px' }}>
                      <div 
                        className="mermaid"
                        style={{
                          background: 'rgba(0, 0, 0, 0.2)',
                          borderRadius: '8px',
                          padding: '20px',
                          fontSize: '0.8em'
                        }}
                      >
                        {slide.mermaidDiagram}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {slide.notes && (
                <div style={{ 
                  marginTop: '20px',
                  padding: '12px',
                  background: 'rgba(102, 126, 234, 0.1)',
                  border: '1px solid rgba(102, 126, 234, 0.3)',
                  borderRadius: '5px',
                  fontSize: '0.75em',
                  textAlign: 'left'
                }}>
                  <strong>📝 Notes:</strong> {slide.notes}
                </div>
              )}

              {/* Mind Map Topic Tag */}
              {slide.mindMapTopic && (
                <div style={{
                  position: 'absolute',
                  bottom: '20px',
                  right: '20px',
                  padding: '5px 15px',
                  background: 'rgba(102, 126, 234, 0.2)',
                  border: '1px solid rgba(102, 126, 234, 0.4)',
                  borderRadius: '20px',
                  fontSize: '0.7em',
                  color: '#61dafb'
                }}>
                  🗺️ {slide.mindMapTopic}
                </div>
              )}

              {/* Slide Number */}
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                fontSize: '0.7em',
                opacity: 0.5
              }}>
                Slide {slide.slideNumber} of {slides.length}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: '12px',
        textAlign: 'center'
      }}>
        Use arrow keys or swipe to navigate • Press ESC to zoom out • Press F for fullscreen
      </div>
    </div>
  );
}

export default RevealPresentation;
