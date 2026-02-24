import axios from 'axios';
import { getToken, saveToken, deleteToken } from './tokenStorage';

const API_URL = "https://loveecho-1.onrender.com/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});


// 🔥 ALWAYS attach token dynamically before request
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    console.log("RAW TOKEN FROM STORAGE:", token);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


// Save token after login
export const setAuthToken = async (token) => {
  if (token) {
    await saveToken(token);
  }
};


// Clear token on logout
export const clearAuthToken = async () => {
  await deleteToken();
};


// Restore token (just check existence)
export const restoreAuthToken = async () => {
  return await getToken();
};

export default api;
