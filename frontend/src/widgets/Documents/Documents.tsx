"use client";
import React from "react";
import styles from "./Documents.module.css";

export default function Documents() {
    return (
        <main className={styles.main}>
            <h1 className={styles.title}>Основные документы сайта:</h1>
            <p className={styles.text}>Положение о конфиденциальности</p>
            <p className={styles.text}>
                <a href="/TermsOfUse.pdf" target="_blank" rel="noopener noreferrer">
                    Пользовательское соглашение
                </a>
            </p>
            <p className={styles.text}>Лицензионное соглашение</p>
        </main>
    );
}
