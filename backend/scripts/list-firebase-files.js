// List files in Firebase Storage TeachAI folder
import { getStorage } from 'firebase-admin/storage';
import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase if not already initialized
try {
  admin.app();
} catch (error) {
  const serviceAccountPath = path.join(__dirname, '../config/firebase-admin-key.json');
  const credential = admin.credential.cert(serviceAccountPath);
  admin.initializeApp({
    projectId: 'try1-7d848',
    storageBucket: 'try1-7d848.firebasestorage.app',
    credential
  });
}

async function listFiles() {
  try {
    const bucket = getStorage().bucket();
    const [files] = await bucket.getFiles({ prefix: 'TeachAI/' });

    console.log(`\n📂 Files in gs://${bucket.name}/TeachAI/\n`);
    console.log(`Total files: ${files.length}\n`);

    // Group by folder
    const folders = {};

    files.forEach(file => {
      const filePath = file.name;
      const parts = filePath.split('/');

      if (parts.length >= 2) {
        const folder = parts[1] || 'root';
        if (!folders[folder]) folders[folder] = [];
        folders[folder].push({
          name: parts.slice(2).join('/') || parts[1],
          size: parseInt(file.metadata.size),
          updated: file.metadata.updated
        });
      }
    });

    // Display organized by folder
    Object.keys(folders).sort().forEach(folder => {
      console.log(`📁 ${folder}/ (${folders[folder].length} files)`);
      folders[folder].slice(0, 5).forEach(file => {
        const size = file.size;
        const sizeStr = size > 1024*1024 ? `${(size/1024/1024).toFixed(2)} MB` :
                        size > 1024 ? `${(size/1024).toFixed(2)} KB` :
                        `${size} B`;
        console.log(`  └─ ${file.name} (${sizeStr})`);
      });
      if (folders[folder].length > 5) {
        console.log(`  └─ ... and ${folders[folder].length - 5} more files`);
      }
      console.log();
    });

  } catch (error) {
    console.error('Error listing files:', error.message);
  }
}

listFiles().then(() => process.exit(0));
