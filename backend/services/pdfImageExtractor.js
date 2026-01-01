import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdfjs-dist';

// Extract images from a PDF file and return them as buffers
export async function extractImagesFromPDF(pdfPath) {
  const data = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(data);
  const images = [];

  for (let i = 0; i < pdfDoc.getPageCount(); i++) {
    const page = pdfDoc.getPage(i);
    const ops = await page.getOperatorList();
    for (const op of ops.fnArray) {
      if (op === pdfDoc.OPS.paintImageXObject) {
        const img = page.objs[ops.argsArray[ops.fnArray.indexOf(op)][0]];
        if (img && img.data) {
          images.push(Buffer.from(img.data));
        }
      }
    }
  }
  return images;
}
