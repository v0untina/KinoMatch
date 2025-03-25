"use client";

import React, { useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthContext from '@/context/auth.context';
import { loginUser } from '@/api/auth';
import styles from './LoginForm.module.css';
import { Button, Input, Link, Spinner } from "@nextui-org/react";
import AuthLayout from "@/layouts/CenteredModalLayout/CenteredModalLayout";
import toast from "react-hot-toast";
import { z } from "zod";
import Logo from "@/components/Logo/Logo";

const UsernameSchema = z.string().trim();

const Login: React.FC = () => {
    const [responsePending, setResponsePending] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [loginError, setLoginError] = useState<string | null>(null);
    const authContext = useContext(AuthContext);
    const router = useRouter();

    const isUsernameValid = React.useMemo(() => {
        if (formData.username === "") return true;

        try {
            UsernameSchema.parse(formData.username);
            return true;
        } catch {
            return false;
        }
    }, [formData.username]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError(null);
        if (formData.username === "" || formData.password === "" || !isUsernameValid) {
            toast.error("Поля не заполнены");
            return;
        }
        setResponsePending(true);
        try {
            const response = await loginUser(formData);
            console.log("Login Response:", response);

            if (response.status === 200 && response.data?.success) {
              toast.success("Успешно! Ожидайте перехода");
              authContext?.login(response.data.data.token);
              router.push('/');
          } else {
              console.error("Unexpected login response:", response);
              setLoginError("Ошибка входа. Сервер вернул неожиданный ответ.");
          }

        } catch (e: any) {
            console.error("Login error:", e);
            if (e.code === "ERR_NETWORK") {
                toast.error("Проблемы с подключением к сети!");
            } else if (e.response?.status === 401 || e.response?.status === 422) {
                setLoginError("Неверный логин или пароль");
            } else if (e.response?.status) {
                toast.error(`Ошибка ${e.response.status}`);
            } else {
                setLoginError("Неизвестная ошибка при входе");
            }
        } finally {
            setResponsePending(false);
        }
    };

    return (
        <AuthLayout>
            <form className={styles.form} onSubmit={handleSubmit}>
                <Logo size={"small"} colored />
                <span className={styles.title}>Авторизация</span>
                {loginError && <span className={styles.error}>{loginError}</span>}
                <Input
                    type="username"
                    isInvalid={!isUsernameValid}
                    disabled={responsePending}
                    label="Имя пользователя"
                    errorMessage={!isUsernameValid ? "Неверный формат имени пользователя" : ""}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
                <Input
                    type="password"
                    disabled={responsePending}
                    label="Пароль"
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <Button type="submit" color="primary" isLoading={responsePending}>Войти</Button>
                <Link href="/register">Хочу создать аккаунт</Link>
            </form>
        </AuthLayout>
    );
};

export default Login;