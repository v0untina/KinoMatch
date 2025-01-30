"use client";

import React, {useContext, useState} from 'react';
import {useRouter} from 'next/navigation';
import AuthContext from '@/context/auth.context';
import styles from './ChangePassword.module.css';
import {Button, Input, Link, Spinner} from "@nextui-org/react";
import AuthLayout from "@/layouts/CenteredModalLayout/CenteredModalLayout";
import toast from "react-hot-toast";
import {z} from "zod";
import Logo from "@/components/Logo/Logo";
import {changePass} from "@/api/change";


const UsernameSchema = z.string().trim();

const Change: React.FC = () => {
  const [responsePending, setResponsePending] = useState(false);
  const [formData, setFormData] = useState({oldPass: '', newPass: ''});
  const authContext = useContext(AuthContext);
  const router = useRouter();

  // Валидация имени пользователя
  const isPasswordValid = React.useMemo(() => {
    if (formData.newPass !== formData.oldPass) return false
    try {
      UsernameSchema.parse(formData.newPass);
      return true;
    } catch {
      return false;
    }
  }, [formData.newPass]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Проверяем, не пустые ли поля, и прошла ли валидация
    if (formData.newPass === "" || formData.oldPass === "" || !isPasswordValid) {
      toast.error("Вы ввели неверные данные")
      return false;
    }
    setResponsePending(true);
    changePass(formData).then(response => {
      if (response?.data.success && response?.data) {
        toast.success("Успешно! Пароль изменен");
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
        <Logo size={"medium"} colored/>
        <span className={styles.title}>Изменения пароля</span>
        <Input type="password" disabled={responsePending} label="Текущий пароль"
               onChange={(e) => setFormData({...formData, password: e.target.value})}/>
        <Input type="password" disabled={responsePending} label="Новый пароль"
               onChange={(e) => setFormData({...formData, newPassword: e.target.value})}/>

        <Button type="submit" color="primary">{!responsePending ? "Изменить" : <Spinner color="white"/>}</Button>
        <Link href="/">Отмена</Link>
      </form>
    </AuthLayout>
  );
};

export default Change;