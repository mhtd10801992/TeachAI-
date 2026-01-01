import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

async function testUpload() {
  try {
    const form = new FormData();
    // Read the test file from the parent directory
    const filePath = path.join(process.cwd(), '..', 'test-sample-document.txt');
    const fileBuffer = fs.readFileSync(filePath);
    form.append('file', fileBuffer, {
      filename: 'test-sample-document.txt',
      contentType: 'text/plain'
    });

    console.log('Sending upload request...');
    const response = await fetch('http://localhost:4000/api/upload', {
      method: 'POST',
      body: form
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', result);
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testUpload();