import { API_URL } from '@/src/api/apiUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
