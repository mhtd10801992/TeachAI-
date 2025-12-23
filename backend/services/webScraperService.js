
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { createRequire } from 'module';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { saveUploadedFileToFirebase } from './firebaseStorageService.js';

// Setup require for CommonJS modules in ESM environment
const require = createRequire(import.meta.url);
const pdfParseLib = require('pdf-parse');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

let googleAI;
if (process.env.GOOGLE_API_KEY) {
  googleAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
}

export const analyzeWebUrl = async (url) => {
  let browser = null;
  let textContent = '';
  let images = [];
  let pdfBuffer = null;
  let isPdf = false;
  
  try {
    console.log(`🌐 Analyzing URL: ${url}`);

    // Check if URL is a PDF
    if (url.toLowerCase().endsWith('.pdf')) {
      isPdf = true;
      console.log('📄 Detected PDF URL, downloading...');
      try {
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': new URL(url).origin,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1'
          }
        });
        
        pdfBuffer = Buffer.from(response.data);
        
        // 1. Parse Text
        try {
            let parseFunc = pdfParseLib;
            if (typeof parseFunc !== 'function' && parseFunc.default) {
                parseFunc = parseFunc.default;
            }
            if (typeof parseFunc === 'function') {
                const pdfData = await parseFunc(pdfBuffer); 
                textContent = pdfData.text.replace(/\s+/g, ' ').trim().substring(0, 50000);
                console.log(`✅ PDF text parsed (${textContent.length} chars)`);
            }
        } catch (parseError) {
            console.warn('⚠️ PDF text parsing skipped:', parseError.message);
            textContent = "Text extraction skipped. Full analysis provided by AI.";
        }

        images = [{
            src: "https://placehold.co/600x400?text=PDF+Visual+Content",
            alt: "PDF Content Analysis",
            context: "Visual content is analyzed by AI below."
        }];

      } catch (pdfError) {
        // Handle 403 specifically
        if (pdfError.response && pdfError.response.status === 403) {
            console.warn('⚠️ 403 Forbidden detected. Website blocks automated access.');
            // Return a specific error object that the frontend can handle gracefully
            // instead of throwing an error that becomes a 500
            return {
                summary: "⚠️ Access Denied (403 Forbidden). \n\nThe website hosting this PDF is blocking our automated analyzer for security reasons (common with academic journals like IJPEM). \n\n**Solution:** Please download the PDF manually and upload it using the 'Upload Documents' tab instead.",
                imageAnalysis: "Cannot analyze protected document.",
                scholarlyData: "Cannot extract data from protected document.",
                textContent: "Access Denied",
                images: [],
                mock: true
            };
        }
        throw new Error(`Failed to download/parse PDF: ${pdfError.message}`);
      }

    } else {
      // Standard Web Page Analysis
      let html = '';
      try {
          console.log('🚀 Attempting Puppeteer launch...');
          browser = await puppeteer.launch({
              headless: "new",
              args: ['--no-sandbox', '--disable-setuid-sandbox']
          });
          const page = await browser.newPage();
          await page.setViewport({ width: 1280, height: 800 });
          await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
          html = await page.content();
          console.log('✅ Puppeteer success');
      } catch (puppeteerError) {
          console.warn('⚠️ Puppeteer failed, falling back to basic fetch');
          if (browser) await browser.close();
          browser = null;
          const response = await axios.get(url, { 
              headers: { 
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
              } 
          });
          html = response.data;
      }
      
      const $ = cheerio.load(html);
      $('script, style').remove();
      textContent = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 30000);
      
      $('img').each((i, el) => {
        const src = $(el).attr('src');
        const alt = $(el).attr('alt');
        if (src && !src.startsWith('data:') && (alt || $(el).attr('title'))) {
          images.push({ 
              src, 
              alt: alt || 'No description', 
              context: $(el).parent().text().substring(0, 100).trim() 
          });
        }
      });
    }

    // AI Analysis Check
    if (!googleAI && process.env.GOOGLE_API_KEY) {
      googleAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    }

    if (!googleAI) {
      return {
        summary: "Google AI API Key missing.",
        textContent: textContent.substring(0, 500) + "...",
        images: images.slice(0, 5),
        mock: true
      };
    }

    const model = googleAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    let summary, imageAnalysis, scholarlyData;

    if (isPdf && pdfBuffer) {
        console.log('🤖 Sending PDF buffer to Gemini for Multimodal analysis...');
        try {
            const base64Data = pdfBuffer.toString('base64');
            const parts = [
                { inlineData: { mimeType: "application/pdf", data: base64Data } },
                { text: "Analyze this PDF document comprehensively. 1. Summarize the main text. 2. LOOK at the images, charts, and diagrams in the document and explain them in detail. 3. Extract key scholarly data/findings." }
            ];

            const result = await model.generateContent(parts);
            const fullAnalysis = result.response.text();

            summary = fullAnalysis.split('2.')[0] || fullAnalysis;
            imageAnalysis = fullAnalysis.split('2.')[1]?.split('3.')[0] || "See full summary for image details.";
            scholarlyData = fullAnalysis.split('3.')[1] || "Included in main analysis.";

        } catch (aiError) {
             console.error("❌ AI Multimodal Error:", aiError.message);
             const summaryPrompt = `Analyze this text content. Provide a summary.\n\nContent:\n${textContent.substring(0, 30000)}`;
             const summaryResult = await model.generateContent(summaryPrompt);
             summary = summaryResult.response.text();
             imageAnalysis = "Image analysis failed (Model error).";
             scholarlyData = "Extracted from text only.";
        }
    } else {
        // Standard Text Analysis
        const summaryPrompt = `Analyze this text content.\n\nContent:\n${textContent.substring(0, 30000)}`;
        const summaryResult = await model.generateContent(summaryPrompt);
        summary = summaryResult.response.text();
        
        if (images.length > 0) {
             const imagePrompt = `Analyze these images based on alt text:\n${JSON.stringify(images.slice(0, 10))}`;
             const imageResult = await model.generateContent(imagePrompt);
             imageAnalysis = imageResult.response.text();
        } else {
             imageAnalysis = "No images found.";
        }
        
        const scholarPrompt = `Extract scholarly data:\n${textContent.substring(0, 30000)}`;
        const scholarResult = await model.generateContent(scholarPrompt);
        scholarlyData = scholarResult.response.text();
    }

    return {
      url,
      title: url.split('/').pop() || 'Analyzed Document',
      summary,
      imageAnalysis,
      scholarlyData,
      textContent: textContent,
      images: images.slice(0, 20),
      mock: false
    };

  } catch (error) {
    console.error('❌ Web Analysis Error:', error);
    // Return friendly error structure instead of throwing 500
    if (error.message.includes('403')) {
        return {
             summary: "⚠️ Access Denied (403 Forbidden). \n\nThe website blocked our access. Please download the PDF and upload it manually.",
             imageAnalysis: "Cannot analyze.",
             scholarlyData: "Cannot extract.",
             images: [],
             mock: true
        };
    }
    throw new Error(`Failed to analyze: ${error.message}`);
  } finally {
    if (browser) await browser.close();
  }
};
