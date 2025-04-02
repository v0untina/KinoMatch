"use client";
import React from "react";
import styles from "./Information.module.css";

export default function Information() {
    return (
        <main className={styles.main}>
            <h1 className={styles.title}>Информация о сайте</h1>
            <p className={styles.text}>Сайт-фильмотека КиноMatch предназначен для подбора фильмов к просмотру. <br/>Здесь вы можете пройти опрос, чтобы определиться с фильмом на вечер или скрестить несколько фильмов для нахождения похожих. <br/>Выкладывайте посты, читайте посты других пользователей, смотрите их подборки или создавайте свои. <br/>Сайт создан студентами группы ИСПк-303-52-00 колледжа ВятГУ.</p>
        </main>
    )
}