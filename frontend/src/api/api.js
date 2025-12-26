import axios from "axios";

// Determine API base URL based on environment
const getBaseURL = () => {
  // Check if running in production (deployed)
  if (import.meta.env.PROD) {
    // Hardcode the production URL to ensure the correct backend is used
    return 'https://teachai-backend-632927777196.us-central1.run.app/api';
  }
  // Development mode - use relative path so Vite proxy can handle it
  return '/api';
};

const API = axios.create({
  baseURL: getBaseURL()
});

// Add request interceptor for debugging
API.interceptors.request.use(request => {
  console.log('🌐 Making API request to:', request.url);
  console.log('📍 Base URL:', request.baseURL);
  return request;
});

// Add response interceptor for debugging
API.interceptors.response.use(
  response => {
    console.log('✅ API response from:', response.config.url);
    return response;
  },
  error => {
    console.error('❌ API request failed:', error.message);
    if (error.code === 'ERR_NETWORK') {
      console.error('🚫 Network error - Backend server may not be running');
      console.error('🔗 Attempting to connect to:', error.config.baseURL);
    }
    return Promise.reject(error);
  }
);

export default API;