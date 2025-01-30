import axios from '../utils/axios';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  username: string;
  password: string;
}

// Регистрация
export const registerUser = async (userData: RegisterData) => {
  return await axios.post('/auth/register', userData);
};

// Авторизация
export const loginUser = async (userData: LoginData) => {
  return await axios.post('/auth/login', userData);
};

// Получить профиль
export const fetchProfile = async () => {
  return await axios.get('/profile');
};
