// src/utils/axios.ts (ИСПРАВЛЕНО)

import axios, { InternalAxiosRequestConfig } from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api', // API URL
  // НЕ УСТАНАВЛИВАЕМ Content-Type здесь! Axios сделает это сам.
  // headers: {
  //   'Content-Type': 'application/json', // <--- УДАЛИЛИ ЭТУ СТРОКУ
  // },
});

// interceptor для установки токена авторизации - ЭТО ОСТАВЛЯЕМ, ОН НЕ МЕШАЕТ
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token'); // Убедись, что ключ 'token' правильный
  if (token && config.headers) { // Добавим проверку на config.headers на всякий случай
    config.headers.authorization = token; // Используем токен как есть (без 'Bearer ')
    // Если бэкенд ожидает 'Bearer <token>', нужно изменить на:
    // config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;