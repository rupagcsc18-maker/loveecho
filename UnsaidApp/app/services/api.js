import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const API_URL = "https://loveecho-1.onrender.com/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// =======================
// TOKEN MANAGEMENT
// =======================

// Set token after login OR restore on app start
export const setAuthToken = async (token) => {
  if (token) {
    await AsyncStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

// Remove token on logout
export const clearAuthToken = async () => {
  await AsyncStorage.removeItem('token');
  delete api.defaults.headers.common['Authorization'];
};

// Restore token when app launches
export const restoreAuthToken = async () => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return token;
  }
  return null;
};
