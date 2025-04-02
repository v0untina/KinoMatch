"use client";
import React from "react";
import styles from './UsersQuestions.module.css';

export default function UsersQuestions() {
    const questionsAndAnswers = [
        { question: "Как я могу сбросить пароль?", answer: "Перейдите на страницу восстановления пароля и следуйте инструкциям." },
        { question: "Как мне связаться со службой поддержки?", answer: "Вы можете связаться с нами по электронной почте support_kinomatch@mail.ru или по телефону +7(922)-946-40-48." },
        { question: "Почему нельзя посмотреть фильм на сайте?", answer: "Сайт-фильмотека КиноMatch предназначен для подбора фильмов к просмотру и обменивания опытом среди зрителей, сайт не обладает лицензией для показа фильмов." },
        { question: "Что еще я могу сделать на сайте кроме того, как пройти опрос?", answer: "На нашем сайте есть множество функций, которые помогут вам подобрать фильм к просмотру - это скрещивание фильмов и подборки от сайта КиноMatch. Также не забывайте обмениваться интересной информацией с другими пользователями в ленте новостей, создавайте свои подборки или смотрите подборки других пользователей." },
        { question: "Как подсчитывается рейтинг пользователей?", answer: "Ваш рейтинг зависит от количества лайков под вашими постами и вашими подборками. Все просто: 1 лайк = 1 балл рейтинга." },
    ];

    return (
        <main className={styles.main}>
            <h1 className={styles.title}>Общие вопросы пользователей</h1>
            <div className={styles.qaContainer}>
                {questionsAndAnswers.map((qa, index) => (
                    <div key={index} className={styles.qaRow}>
                        <p className={styles.question}>{qa.question}</p>
                        <p className={styles.answer}>{qa.answer}</p>
                    </div>
                ))}
            </div>
        </main>
    );
}