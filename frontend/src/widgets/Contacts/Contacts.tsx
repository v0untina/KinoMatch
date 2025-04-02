"use client";
import React from "react";
import styles from "./Contacts.module.css";

export default function Contacts() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Наши контакты</h1>
      <p className={styles.text}>Почта техподдержки: support_kinomatch@mail.ru <br/>Контактный телефон: +79229464048</p>
    </main>
  );
}