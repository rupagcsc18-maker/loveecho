import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router'; // ✅ Required for redirection

//const API_URL = "http://10.0.2.2:8080/api";
//const API_URL = 'https://echory-production.up.railway.app/api';
const API_URL = 'https://loveecho-production.up.railway.app/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

let authToken = null;

// Call this ONCE after login / app start
export const setAuthToken = async (tokenFromLogin) => {
  if (tokenFromLogin) {
    authToken = tokenFromLogin;
    await AsyncStorage.setItem('token', tokenFromLogin);
  } else {
    authToken = await AsyncStorage.getItem('token');
  }
};

export const clearAuthToken = async () => {
  authToken = null;
  await AsyncStorage.removeItem('token');
};

// --- 🛰️ REQUEST INTERCEPTOR ---
api.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- 🛡️ RESPONSE INTERCEPTOR (The 401 Safety Net) ---
api.interceptors.response.use(
  (response) => response, // Pass successful responses through
  async (error) => {
    // Check if the error is a 401 Unauthorized
    if (error.response && error.response.status === 401) {
      console.warn("Session expired or invalid. Logging out...");
      
      // 1. Clear local memory and storage
      await clearAuthToken();
      
      // 2. Redirect to login screen
      // We use replace to ensure they can't 'back' into the app
      router.replace('/login'); 
    }
    
    return Promise.reject(error);
  }
);

export default api;