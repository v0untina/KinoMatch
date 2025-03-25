// frontend/src/context/auth.context.tsx
"use client";
import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { fetchProfile } from "@/api/auth";
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface User {
    user_id: number; // Добавлены user_id, username, email в интерфейс User
    username: string;
    email: string;
    // image?: string; // Убран image, если не используется
}

interface AuthContextType {
    user: User | null;
    login: (token: string) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}
console.log("Rendering AuthProvider"); // !!! ДОБАВЬ ЭТО !!!
export const AuthProvider = ({children}: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter(); // Инициализация useRouter

    // Получаем профиль при загрузке страницы
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchProfile()
                .then((response) => {
                    setUser(response.data.data);
                })
                .catch((error) => { // Добавлен параметр error
                    console.error("Fetch profile error on startup:", error); // Логирование ошибки
                    localStorage.removeItem('token');
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    // Вход в аккаунт
    const login = (token: string) => {
        localStorage.setItem('token', token);
        fetchProfile()
            .then((response) => {
                setUser(response.data.data);
                toast.success(`Добро пожаловать, ${response.data.data.username}!`); // Приветствие toast при логине
                router.push('/'); // Редирект на главную после логина
            })
            .catch((error) => { // Добавлен параметр error
                console.error("Fetch profile error after login:", error); // Логирование ошибки
                localStorage.removeItem('token');
                setUser(null);
                toast.error("Не удалось загрузить профиль после входа."); // Сообщение об ошибке toast
            });
    };

    // Выйти из аккаунта
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        router.push('/login'); // Редирект на страницу логина после логаута
        toast.success("Вы вышли из аккаунта."); // Сообщение toast при логауте
    };


    // Результат - контекст
    return (
        <AuthContext.Provider value={{user, login, logout, loading}}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;