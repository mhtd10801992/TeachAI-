// Storage Service - Handles persistent document storage
import fs from 'fs/promises';
import path from 'path';

const STORAGE_DIR = './data';
const DOCUMENTS_FILE = path.join(STORAGE_DIR, 'documents.json');
const UPLOADS_DIR = path.join(STORAGE_DIR, 'uploads');

// Ensure storage directories exist
const initializeStorage = async () => {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    
    // Create documents file if it doesn't exist
    try {
      await fs.access(DOCUMENTS_FILE);
    } catch {
      await fs.writeFile(DOCUMENTS_FILE, JSON.stringify([], null, 2));
    }
  } catch (error) {
    console.error('Failed to initialize storage:', error);
  }
};

// Load documents from file
const loadDocuments = async () => {
  try {
    const data = await fs.readFile(DOCUMENTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load documents:', error);
    return [];
  }
};

// Save documents to file
const saveDocuments = async (documents) => {
  try {
    await fs.writeFile(DOCUMENTS_FILE, JSON.stringify(documents, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to save documents:', error);
    return false;
  }
};

// Save uploaded file to storage
const saveUploadedFile = async (file, documentId) => {
  try {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${documentId}${fileExtension}`;
    const filePath = path.join(UPLOADS_DIR, fileName);
    
    await fs.writeFile(filePath, file.buffer);
    return {
      storedPath: filePath,
      fileName: fileName,
      originalName: file.originalname
    };
  } catch (error) {
    console.error('Failed to save uploaded file:', error);
    return null;
  }
};

// Get storage statistics
const getStorageStats = async () => {
  try {
    const documents = await loadDocuments();
    
    // Calculate storage size
    let totalSize = 0;
    const uploads = await fs.readdir(UPLOADS_DIR);
    
    for (const file of uploads) {
      const filePath = path.join(UPLOADS_DIR, file);
      const stats = await fs.stat(filePath);
      totalSize += stats.size;
    }
    
    return {
      totalDocuments: documents.length,
      totalStorageSize: totalSize,
      documentsFileSize: (await fs.stat(DOCUMENTS_FILE)).size,
      uploadedFilesCount: uploads.length
    };
  } catch (error) {
    console.error('Failed to get storage stats:', error);
    return null;
  }
};

// Export all storage functions
export {
  initializeStorage,
  loadDocuments,
  saveDocuments,
  saveUploadedFile,
  getStorageStats,
  STORAGE_DIR,
  DOCUMENTS_FILE,
  UPLOADS_DIR
};
