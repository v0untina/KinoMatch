// frontend/src/context/auth.context.tsx
"use client";
// Добавляем useMemo
import React, { createContext, ReactNode, useEffect, useState, useCallback, useMemo } from 'react';
import { fetchProfile } from "@/api/auth";
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface User {
    user_id: number;
    username: string;
    email: string;
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
console.log("Rendering AuthProvider"); // Отладочный лог

export const AuthProvider = ({children}: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Загрузка профиля при инициализации (без изменений)
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchProfile()
                .then((response) => { setUser(response.data.data); })
                .catch((error) => { console.error("Fetch profile error on startup:", error); localStorage.removeItem('token'); setUser(null); })
                .finally(() => setLoading(false));
        } else { setLoading(false); }
    }, []);

    // login и logout уже обернуты в useCallback - это хорошо
    const login = useCallback((token: string) => {
        localStorage.setItem('token', token);
        setLoading(true); // Показываем загрузку после логина
        fetchProfile()
            .then((response) => {
                setUser(response.data.data);
                toast.success(`Добро пожаловать, ${response.data.data.username}!`);
                router.push('/');
            })
            .catch((error) => {
                console.error("Fetch profile error after login:", error);
                localStorage.removeItem('token'); setUser(null);
                toast.error("Не удалось загрузить профиль после входа.");
            })
            .finally(() => setLoading(false)); // Убираем загрузку
    }, [router]); // Зависимость только от router

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setUser(null);
        router.push('/login');
        toast.success("Вы вышли из аккаунта.");
    }, [router]); // Зависимость только от router

    // --- МЕМОИЗАЦИЯ КОНТЕКСТА ---
    // Создаем объект value с помощью useMemo.
    // Он будет пересоздаваться только если user, loading, login или logout изменятся.
    const contextValue = useMemo(() => ({
        user,
        login,
        logout,
        loading
    // login и logout стабильны благодаря useCallback.
    }), [user, loading, login, logout]);

    return (
        // Передаем мемоизированное значение contextValue
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;