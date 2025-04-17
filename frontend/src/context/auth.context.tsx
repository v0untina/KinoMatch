"use client";
// Добавляем useMemo
import React, { createContext, ReactNode, useEffect, useState, useCallback, useMemo } from 'react';
import { fetchProfile } from "@/api/auth";
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { User } from '@/types/user.interface'; // <-- ИМПОРТИРУЙ User отсюда

/* УДАЛИ ЭТО ЛОКАЛЬНОЕ ОПРЕДЕЛЕНИЕ:
interface User {
    user_id: number;
    username: string;
    email: string;
}
*/

// Теперь AuthContextType будет использовать импортированный User с полем rating
interface AuthContextType {
    user: User | null; // <-- Теперь это User из user.interface.ts
    login: (token: string) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}
console.log("Rendering AuthProvider");

export const AuthProvider = ({children}: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null); // <-- useState тоже будет использовать User из user.interface.ts
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Загрузка профиля при инициализации
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchProfile()
                // Убедись, что fetchProfile возвращает данные, соответствующие НОВОМУ типу User (с rating)
                .then((response) => {
                    // Предполагаем, что response.data.data соответствует User
                    setUser(response.data.data);
                    console.log("Profile loaded on startup:", response.data.data); // Лог для проверки
                })
                .catch((error) => { console.error("Fetch profile error on startup:", error); localStorage.removeItem('token'); setUser(null); })
                .finally(() => setLoading(false));
        } else { setLoading(false); }
    }, []);

    // login
    const login = useCallback((token: string) => {
        localStorage.setItem('token', token);
        setLoading(true);
        fetchProfile()
            .then((response) => {
                setUser(response.data.data);
                console.log("Profile loaded after login:", response.data.data); // Лог для проверки
                toast.success(`Добро пожаловать, ${response.data.data.username}!`);
                router.push('/');
            })
            .catch((error) => {
                console.error("Fetch profile error after login:", error);
                localStorage.removeItem('token'); setUser(null);
                toast.error("Не удалось загрузить профиль после входа.");
            })
            .finally(() => setLoading(false));
    }, [router]);

    // logout
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setUser(null);
        router.push('/login');
        toast.success("Вы вышли из аккаунта.");
    }, [router]);

    // Мемоизация контекста
    const contextValue = useMemo(() => ({
        user,
        login,
        logout,
        loading
    }), [user, loading, login, logout]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;