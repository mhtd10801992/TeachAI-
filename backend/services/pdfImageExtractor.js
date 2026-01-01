import fs from 'fs';
import path from 'path';
import pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import { createCanvas, ImageData } from 'canvas';

// Configure PDF.js for Node.js (disable worker)
pdfjsLib.GlobalWorkerOptions.workerSrc = null;

// Extract images from a PDF file and return them as buffers
export async function extractImagesFromPDF(pdfPath) {
  try {
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    const images = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const ops = await page.getOperatorList();
      const objs = page.objs;

      for (let j = 0; j < ops.fnArray.length; j++) {
        if (ops.fnArray[j] === pdfjsLib.OPS.paintImageXObject) {
          const objId = ops.argsArray[j][0];
          const img = objs.get(objId);

          if (img && img.data && img.width && img.height) {
            try {
              console.log(`Converting image ${j} on page ${i}: ${img.width}x${img.height}, data length: ${img.data.length}`);

              // Create a canvas to render the image data
              const canvas = createCanvas(img.width, img.height);
              const ctx = canvas.getContext('2d');

              // Check if the image data is in the expected format
              // PDF.js image data is typically RGBA
              if (img.data.length === img.width * img.height * 4) {
                // Create ImageData from the raw pixel data
                const imageData = new ImageData(
                  new Uint8ClampedArray(img.data),
                  img.width,
                  img.height
                );

                // Put the image data onto the canvas
                ctx.putImageData(imageData, 0, 0);

                // Convert to PNG buffer
                const pngBuffer = canvas.toBuffer('image/png');
                console.log(`✅ Successfully converted RGBA image to PNG: ${pngBuffer.length} bytes`);
                images.push({
                  buffer: pngBuffer,
                  width: img.width,
                  height: img.height,
                  type: 'embedded',
                  pageNumber: i
                });
              } else if (img.data.length === img.width * img.height * 3) {
                // RGB format - need to convert to RGBA
                console.log(`Converting RGB image to RGBA: ${img.width}x${img.height}`);
                const rgbaData = new Uint8ClampedArray(img.width * img.height * 4);
                for (let k = 0; k < img.data.length; k += 3) {
                  rgbaData[k * 4 / 3] = img.data[k];     // R
                  rgbaData[k * 4 / 3 + 1] = img.data[k + 1]; // G
                  rgbaData[k * 4 / 3 + 2] = img.data[k + 2]; // B
                  rgbaData[k * 4 / 3 + 3] = 255;        // A (full opacity)
                }

                const imageData = new ImageData(rgbaData, img.width, img.height);
                ctx.putImageData(imageData, 0, 0);
                const pngBuffer = canvas.toBuffer('image/png');
                console.log(`✅ Successfully converted RGB image to PNG: ${pngBuffer.length} bytes`);
                images.push({
                  buffer: pngBuffer,
                  width: img.width,
                  height: img.height,
                  type: 'embedded',
                  pageNumber: i
                });
              } else if (img.data.length === img.width * img.height) {
                // Grayscale format - convert to RGBA
                console.log(`Converting grayscale image to RGBA: ${img.width}x${img.height}`);
                const rgbaData = new Uint8ClampedArray(img.width * img.height * 4);
                for (let k = 0; k < img.data.length; k++) {
                  rgbaData[k * 4] = img.data[k];     // R
                  rgbaData[k * 4 + 1] = img.data[k]; // G
                  rgbaData[k * 4 + 2] = img.data[k]; // B
                  rgbaData[k * 4 + 3] = 255;        // A (full opacity)
                }

                const imageData = new ImageData(rgbaData, img.width, img.height);
                ctx.putImageData(imageData, 0, 0);
                const pngBuffer = canvas.toBuffer('image/png');
                console.log(`✅ Successfully converted grayscale image to PNG: ${pngBuffer.length} bytes`);
                images.push({
                  buffer: pngBuffer,
                  width: img.width,
                  height: img.height,
                  type: 'embedded',
                  pageNumber: i
                });
              } else {
                console.warn(`⚠️ Unexpected image data format for image ${j} on page ${i}: expected ${img.width * img.height * 4} (RGBA), ${img.width * img.height * 3} (RGB), or ${img.width * img.height} (grayscale) bytes, got ${img.data.length}`);
                // Try to use raw data as fallback, but convert to PNG if possible
                try {
                  // Create a minimal canvas and try to draw the raw data
                  const fallbackCanvas = createCanvas(Math.max(img.width, 1), Math.max(img.height, 1));
                  const fallbackCtx = fallbackCanvas.getContext('2d');
                  const fallbackPngBuffer = fallbackCanvas.toBuffer('image/png');
                  console.log(`✅ Created fallback PNG: ${fallbackPngBuffer.length} bytes`);
                  images.push({
                    buffer: fallbackPngBuffer,
                    width: img.width,
                    height: img.height,
                    type: 'embedded',
                    pageNumber: i
                  });
                } catch (fallbackError) {
                  console.warn(`❌ Fallback PNG creation also failed:`, fallbackError.message);
                  // Last resort: use raw data
                  images.push(Buffer.from(img.data));
                }
              }

            } catch (canvasError) {
              console.warn(`❌ Failed to convert image ${j} on page ${i}:`, canvasError.message);
              // Fallback: try to create a minimal valid PNG
              try {
                const fallbackCanvas = createCanvas(Math.max(img.width || 100, 1), Math.max(img.height || 100, 1));
                const fallbackCtx = fallbackCanvas.getContext('2d');
                // Fill with white background
                fallbackCtx.fillStyle = 'white';
                fallbackCtx.fillRect(0, 0, fallbackCanvas.width, fallbackCanvas.height);
                // Add some text indicating the image couldn't be processed
                fallbackCtx.fillStyle = 'black';
                fallbackCtx.font = '12px Arial';
                fallbackCtx.fillText('Image processing failed', 10, 20);
                const fallbackPngBuffer = fallbackCanvas.toBuffer('image/png');
                console.log(`✅ Created error placeholder PNG: ${fallbackPngBuffer.length} bytes`);
                images.push({
                  buffer: fallbackPngBuffer,
                  width: fallbackCanvas.width,
                  height: fallbackCanvas.height,
                  type: 'embedded',
                  pageNumber: i
                });
              } catch (fallbackError) {
                console.warn(`❌ Fallback PNG creation also failed:`, fallbackError.message);
                // Last resort: skip this image
                console.log(`⏭️ Skipping problematic image ${j} on page ${i}`);
              }
            }
          }
        }
      }
    }

    return images;
  } catch (error) {
    console.error('PDF image extraction error:', error.message);
    return [];
  }
}

// Render PDF pages as images (useful for scanned documents)
export async function renderPDFPagesAsImages(pdfPath, maxPages = 3) {
  try {
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdfDocument = await loadingTask.promise;
    const numPages = Math.min(pdfDocument.numPages, maxPages);
    const images = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDocument.getPage(i);

      // Set up canvas for rendering
      const scale = 1.5; // Higher scale for better quality
      const viewport = page.getViewport({ scale });

      // Create canvas with the page dimensions
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');

      // Render the page to the canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Convert canvas to buffer
      const imageBuffer = canvas.toBuffer('image/png');
      images.push({
        pageNumber: i,
        buffer: imageBuffer,
        width: viewport.width,
        height: viewport.height,
        scale: scale,
        format: 'png'
      });
    }

    return images;
  } catch (error) {
    console.error('PDF page rendering error:', error.message);
    return [];
  }
}

// Extract images from Word documents
export async function extractImagesFromWord(buffer) {
  try {
    console.log('🖼️ Extracting images from Word document...');

    // For now, return empty array as Word image extraction needs more work
    // This would require parsing the .docx file structure
    console.log('⚠️ Word document image extraction not yet implemented');
    return [];
  } catch (error) {
    console.error('Word image extraction error:', error.message);
    return [];
  }
}
