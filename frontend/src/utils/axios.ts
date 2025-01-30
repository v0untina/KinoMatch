import axios, {InternalAxiosRequestConfig} from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api', // API URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// interceptor для установки токена авторизации
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.authorization = token;
  return config;
});

export default axiosInstance;