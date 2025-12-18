import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api"
});

// Add request interceptor for debugging
API.interceptors.request.use(request => {
  console.log('🌐 Making API request to:', request.url);
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
    }
    return Promise.reject(error);
  }
);

export default API;