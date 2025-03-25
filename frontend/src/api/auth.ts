//api/auth.ts
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
    try {
        const response = await axios.post('/auth/register', userData);
        return response;
    } catch (error: any) {
        console.error("Error in registerUser:", error);
        throw error; // Пробрасываем ошибку дальше
    }
};

// Авторизация
export const loginUser = async (userData: LoginData) => {
    try {
        const response = await axios.post('/auth/login', userData);
        return response;
    } catch (error: any) {
        console.error("Error in loginUser:", error);
        throw error; // Пробрасываем ошибку дальше
    }
};

// Получить профиль
export const fetchProfile = async () => {
    try {
        const response = await axios.get('/profile');
        return response;
    } catch (error: any) {
        console.error("Error in fetchProfile:", error);
        throw error; // Пробрасываем ошибку дальше
    }
};