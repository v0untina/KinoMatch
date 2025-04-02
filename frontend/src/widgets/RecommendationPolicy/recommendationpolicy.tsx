"use client";
import React from "react";
import styles from "./recommendationpolicy.module.css";

export default function RecommendationPolicy() {
    return (
        <main className={styles.main}>
            <h1 className={styles.title}>На этой странице описаны правила, которые мы используем для формирования рекомендаций:</h1>
            <div className={styles.numberedList}>
                <p className={styles.text}>Сбор данных о предпочтениях пользователя.</p>
                <p className={styles.text}>Анализ данных и выявление закономерностей.</p>
                <p className={styles.text}>Формирование рекомендаций на основе анализа.</p>
                <p className={styles.text}>Оценка эффективности рекомендаций и корректировка алгоритмов.</p>
            </div>
        </main>
    );
}