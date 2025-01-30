"use client";

import React, {useState} from 'react';
import {useRouter} from 'next/navigation';
import {registerUser} from '@/api/auth';
import styles from './RegisterForm.module.css';
import {Button, Input, Link, Spinner} from "@nextui-org/react";
import CenteredModalLayout from "@/layouts/CenteredModalLayout/CenteredModalLayout";
import toast from "react-hot-toast";
import {z} from "zod";

const UserEmailSchema = z.string().email().trim();
const UserPasswordSchema = z.string().min(5);

const Register: React.FC = () => {
  const [responsePending, setResponsePending] = useState(false);
  const [formData, setFormData] = useState({username: '', email: '', password: '', passwordRepeat: ''});
  const [notSimPwd, setNotSimPwd] = useState(false);
  const router = useRouter();

  // Валидация почты
  const isEmailValid = React.useMemo(() => {
    if (formData.email === "") return true;

    try {
      UserEmailSchema.parse(formData.email);
      return true;
    } catch {
      return false;
    }
  }, [formData.email]);

  // Валидация пароля
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
    // Проверяем, не пустые ли поля, и прошла ли валидация
    if (formData.email === "" || formData.password === "" || formData.username === "" || !isPasswordValid || !isEmailValid) {
      toast.error("Не все поля заполнены")
      return false;
    }
    setResponsePending(true);
    const response = await registerUser(formData).catch((e) => {
      toast.error(`Ошибка ${e.response.status}`);
      setResponsePending(false);
    });
    if (response?.data.success) {
      toast.success("Успешно! Ожидайте перехода");
      router.push('/');
    } else {
      toast.error(`Ошибка при регистрации! Возможно, этот логин или почта уже заняты`);
      setResponsePending(false);
    }
  };

  return (
    <CenteredModalLayout>
      <form className={styles.form} onSubmit={handleSubmit}>
        <span className={styles.title}>Регистрация</span>
        <Input type="email" isInvalid={!isEmailValid} disabled={responsePending} label="Ваша электронная почта"
               onChange={(e) => setFormData({...formData, email: e.target.value})}/>
        <Input type="text" disabled={responsePending} label="Юзернейм"
               onChange={(e) => setFormData({...formData, username: e.target.value})}/>
        <Input type="password" isInvalid={!isPasswordValid} disabled={responsePending} label="Пароль"
               onChange={(e) => setFormData({...formData, password: e.target.value})}/>
        <Input type="password" isInvalid={!isPasswordValid} disabled={responsePending} label="Повторите пароль"
               onChange={(e) => setFormData({...formData, passwordRepeat: e.target.value})}/>
        {notSimPwd && <span>Пароли не совпадают!</span>}
        <Button type="submit" color="primary">{!responsePending ? "Создать аккаунт" : <Spinner color="white"/>}</Button>
        <Link href="/login">Уже есть аккаунт</Link>
      </form>
    </CenteredModalLayout>
  );
};

export default Register;