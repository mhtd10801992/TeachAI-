// Initialize Global Dictionary in Firebase Storage
import { getStorage } from 'firebase-admin/storage';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIREBASE_DICTIONARY_PATH = 'TeachAI/global-dictionary.json';

// Initialize Firebase if not already initialized
try {
  admin.app();
  console.log('✅ Using existing Firebase app');
} catch (error) {
  const serviceAccountPath = path.join(__dirname, '../config/firebase-admin-key.json');
  const credential = admin.credential.cert(serviceAccountPath);
  admin.initializeApp({
    projectId: 'try1-7d848',
    storageBucket: 'try1-7d848.firebasestorage.app',
    credential
  });
  console.log('✅ Firebase Admin initialized');
}

// Initial dictionary structure
const initialDictionary = {
  version: "1.0",
  lastUpdated: new Date().toISOString(),
  terms: {},
  statistics: {
    totalTerms: 0,
    lastAddedTerm: null,
    documentsProcessed: 0
  }
};

async function initializeDictionary() {
  try {
    console.log('🔥 Initializing Firebase Storage dictionary...\n');
    
    const bucket = getStorage().bucket();
    const file = bucket.file(FIREBASE_DICTIONARY_PATH);
    
    // Check if already exists
    const [exists] = await file.exists();
    if (exists) {
      console.log('✅ Dictionary already exists in Firebase Storage');
      console.log(`📍 Location: gs://${bucket.name}/${FIREBASE_DICTIONARY_PATH}`);
      
      // Download and display current content
      const [content] = await file.download();
      const dictionary = JSON.parse(content.toString());
      console.log('\n📊 Current Statistics:');
      console.log(`   Total Terms: ${dictionary.statistics.totalTerms}`);
      console.log(`   Documents Processed: ${dictionary.statistics.documentsProcessed}`);
      console.log(`   Last Updated: ${dictionary.lastUpdated}`);
      return;
    }
    
    // Create new dictionary file
    await file.save(JSON.stringify(initialDictionary, null, 2), {
      metadata: {
        contentType: 'application/json',
        metadata: {
          type: 'global-dictionary',
          lastUpdated: initialDictionary.lastUpdated,
          totalTerms: 0
        }
      }
    });
    
    console.log('✅ Dictionary created successfully!');
    console.log(`📍 Location: gs://${bucket.name}/${FIREBASE_DICTIONARY_PATH}`);
    console.log('\n📊 Initial Structure:');
    console.log(JSON.stringify(initialDictionary, null, 2));
    
    // Also save local backup
    const localPath = path.join(__dirname, '../data/global-dictionary.json');
    fs.writeFileSync(localPath, JSON.stringify(initialDictionary, null, 2));
    console.log(`\n💾 Local backup created: ${localPath}`);
    
  } catch (error) {
    console.error('❌ Error initializing dictionary:', error.message);
    process.exit(1);
  }
}

// Run initialization
initializeDictionary()
  .then(() => {
    console.log('\n✨ Initialization complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
