"use client";

import React, {useContext, useState} from 'react';
import {useRouter} from 'next/navigation';
import AuthContext from '@/context/auth.context';
import {loginUser} from '@/api/auth';
import styles from './LoginForm.module.css';
import {Button, Input, Link, Spinner} from "@nextui-org/react";
import AuthLayout from "@/layouts/CenteredModalLayout/CenteredModalLayout";
import toast from "react-hot-toast";
import {z} from "zod";
import Logo from "@/components/Logo/Logo";

const UsernameSchema = z.string().trim();

const Login: React.FC = () => {
  const [responsePending, setResponsePending] = useState(false);
  const [formData, setFormData] = useState({username: '', password: ''});
  const authContext = useContext(AuthContext);
  const router = useRouter();

  // Валидация имени пользователя
  const isUsernameValid = React.useMemo(() => {
    if (formData.username === "") return true;

    try {
      UsernameSchema.parse(formData.username);
      return true;
    } catch {
      return false;
    }
  }, [formData.username]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Проверяем, не пустые ли поля, и прошла ли валидация
    if (formData.username === "" || formData.password === "" || !isUsernameValid) {
      toast.error("Поля не заполнены")
      return false;
    }
    setResponsePending(true);
    loginUser(formData).then(response => {
      if (response?.data.success && response?.data) {
        toast.success("Успешно! Ожидайте перехода");
        authContext?.login(response.data.data.token);
        router.push('/');
      }
    }).catch(e => {
      if (e.code === "ERR_NETWORK") {
        toast.error("Проблемы с подключением к сети!");
      }
      if (e.response?.status) {
        if (e.response.status === 422 || e.response.status === 401) {
          toast.error("Неверный логин или пароль");
        } else {
          toast.error(`Ошибка ${e.response.status}`);
        }
      }
      setResponsePending(false);
    })
  };

  return (
    <AuthLayout>
      <form className={styles.form} onSubmit={handleSubmit}>
        <Logo size={"small"} colored/>
        <span className={styles.title}>Авторизация</span>
        <Input type="username" isInvalid={!isUsernameValid} disabled={responsePending} label="Имя пользователя"
               onChange={(e) => setFormData({...formData, username: e.target.value})}/>
        <Input type="password" disabled={responsePending} label="Пароль"
               onChange={(e) => setFormData({...formData, password: e.target.value})}/>
        <Button type="submit" color="primary">{!responsePending ? "Войти" : <Spinner color="white"/>}</Button>
        <Link href="/register">Хочу создать аккаунт</Link>
      </form>
    </AuthLayout>
  );
};

export default Login;