"use client";
import React, {createContext, ReactNode, useEffect, useState} from 'react';
import {fetchProfile} from "@/api/auth";

interface User {
  username: string;
  email: string;
  image?: string
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

export const AuthProvider = ({children}: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Получаем профиль при загрузке страницы
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile()
        .then((response) => {
          setUser(response.data.data);
        })
        .catch(() => {
          // Не получилось
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
      })
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      });
  };

  // Выйти из аккаунта
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Результат - контекст
  return (
    <AuthContext.Provider value={{user, login, logout, loading}}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;