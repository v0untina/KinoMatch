"use client";
import React from "react";
import styles from "./Contacts.module.css";

export default function Contacts() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Наши контакты</h1>
      <p className={styles.email}>Почта техподдержки: support_kinomatch@mail.ru</p>
      <p className={styles.email}>Контактный телефон: +79229464048</p>
    </main>
  );
}