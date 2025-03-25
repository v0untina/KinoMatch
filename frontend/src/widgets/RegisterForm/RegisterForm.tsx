//RegisterForm.tsx
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/api/auth';
import styles from './RegisterForm.module.css';
import { Button, Input, Link, Spinner } from "@nextui-org/react";
import CenteredModalLayout from "@/layouts/CenteredModalLayout/CenteredModalLayout";
import toast from "react-hot-toast";
import { z } from "zod";
import Logo from "@/components/Logo/Logo";

const UserEmailSchema = z.string().email().trim();
const UserNameSchema = z.string().min(3).max(50).trim();
const UserPasswordSchema = z.string().min(6).max(255);

const Register: React.FC = () => {
    const [responsePending, setResponsePending] = useState(false);
    const [formData, setFormData] = useState({ username: '', email: '', password: '', passwordRepeat: '' });
    const [notSimPwd, setNotSimPwd] = useState(false);
    const [registerError, setRegisterError] = useState<string | null>(null);
    const router = useRouter();

    const isEmailValid = React.useMemo(() => {
        if (formData.email === "") return true;
        try {
            UserEmailSchema.parse(formData.email);
            return true;
        } catch {
            return false;
        }
    }, [formData.email]);

    const isUsernameValid = React.useMemo(() => {
        if (formData.username === "") return true;
        try {
            UserNameSchema.parse(formData.username);
            return true;
        } catch {
            return false;
        }
    }, [formData.username]);

    const isPasswordValid = React.useMemo(() => {
        if (formData.password === "") return true;
        if (formData.password !== formData.passwordRepeat) {
            setNotSimPwd(true);
            return false;
        }
        setNotSimPwd(false);
        try {
            UserPasswordSchema.parse(formData.password);
            return true;
        } catch {
            return false;
        }
    }, [formData.password, formData.passwordRepeat]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setRegisterError(null);
        if (formData.email === "" || formData.password === "" || formData.username === "" || !isPasswordValid || !isEmailValid || !isUsernameValid) {
            toast.error("Не все поля заполнены");
            return;
        }
        setResponsePending(true);
        try {
            const response = await registerUser(formData);
            console.log("Register Response:", response);

            if (response.status === 201 && response.data.success) {
                toast.success("Регистрация успешна! Ожидайте перехода");
                router.push('/login');
            } else {
                console.error("Unexpected register response:", response);
                setRegisterError("Ошибка регистрации. Сервер вернул неожиданный ответ.");
            }

        } catch (e: any) {
            console.error("Registration error:", e);
            if (e.code === "ERR_NETWORK") {
                toast.error("Проблемы с подключением к сети!");
            } else if (e.response?.status === 400 || e.response?.status === 422) {
                if (e.response?.data?.message?.message) {
                    setRegisterError(e.response.data.message.message);
                } else {
                    setRegisterError("Ошибка регистрации. Возможно, логин или почта уже заняты.");
                }
            } else if (e.response?.status) {
                toast.error(`Ошибка ${e.response.status}`);
            } else {
                setRegisterError("Неизвестная ошибка при регистрации");
            }
        } finally {
            setResponsePending(false);
        }
    };

    return (
        <CenteredModalLayout>
            <form className={styles.form} onSubmit={handleSubmit}>
                <Logo size={"small"} colored />
                <span className={styles.title}>Регистрация</span>
                {registerError && <span className={styles.error}>{registerError}</span>}
                <Input
                    type="email"
                    isInvalid={!isEmailValid}
                    errorMessage={!isEmailValid ? "Неверный формат почты" : ""}
                    disabled={responsePending}
                    label="Ваша электронная почта"
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <Input
                    type="text"
                    isInvalid={!isUsernameValid}
                    errorMessage={!isUsernameValid ? "Имя пользователя должно быть от 3 до 50 символов" : ""}
                    disabled={responsePending}
                    label="Юзернейм"
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
                <Input
                    type="password"
                    isInvalid={!isPasswordValid}
                    errorMessage={notSimPwd ? "Пароли не совпадают" : (!isPasswordValid && formData.password.length >= 1) ? "Пароль должен быть не менее 6 символов" : ""}
                    disabled={responsePending}
                    label="Пароль"
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <Input
                    type="password"
                    isInvalid={notSimPwd}
                    errorMessage={notSimPwd ? "Пароли не совпадают" : ""}
                    disabled={responsePending}
                    label="Повторите пароль"
                    onChange={(e) => setFormData({ ...formData, passwordRepeat: e.target.value })}
                />
                <Button type="submit" color="primary" isLoading={responsePending}>Создать аккаунт</Button>
                <Link href="/login">Уже есть аккаунт</Link>
            </form>
        </CenteredModalLayout>
    );
};

export default Register;