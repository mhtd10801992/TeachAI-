import axios from "axios";

// Determine API base URL based on environment
const getBaseURL = () => {
  // Check if running in production (deployed)
  if (import.meta.env.PROD) {
    // Use the App Hosting backend URL
    return 'https://teachai-api--try1-7d848.us-east4.hosted.app/api';
  }
  // Development mode - use relative path so Vite proxy can handle it
  return '/api';
};

const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 90000, // 90 second timeout
});

// Retry configuration for QUIC protocol errors
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Add request interceptor for debugging and retry logic
API.interceptors.request.use(request => {
  console.log('🌐 Making API request to:', request.url);
  console.log('📍 Base URL:', request.baseURL);
  
  // Initialize retry count
  request.retryCount = request.retryCount || 0;
  
  return request;
});

// Add response interceptor for debugging and automatic retries
API.interceptors.response.use(
  response => {
    console.log('✅ API response from:', response.config.url);
    return response;
  },
  async error => {
    const config = error.config;
    
    console.error('❌ API request failed:', error.message);
    
    // Check if it's a network error (including QUIC protocol errors)
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      console.error('🚫 Network error - May be QUIC protocol issue');
      console.error('🔗 Attempting to connect to:', error.config?.baseURL);
      
      // Retry logic for network errors
      if (!config || !config.retryCount) {
        config.retryCount = 0;
      }
      
      if (config.retryCount < MAX_RETRIES) {
        config.retryCount += 1;
        console.log(`🔄 Retry attempt ${config.retryCount} of ${MAX_RETRIES}...`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        
        // Retry the request
        return API(config);
      }
      
      console.error(`❌ Failed after ${MAX_RETRIES} retries`);
    }
    
    return Promise.reject(error);
  }
);

export default API;