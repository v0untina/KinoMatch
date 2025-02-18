"use client";
import React, { useState, useRef, useEffect } from "react";
import styles from "./Polling.module.css";
import axios from 'axios';

interface Question {
    question: string;
    options: string[];
    multipleChoice: boolean;
}

interface Answers {
    [key: number]: string | string[];
}

export default function Pollingusers() {
    // Список вопросов и вариантов ответов
    const questions: Question[] = [
        {
            question: "Какое настроение вы хотите испытать после просмотра фильма?",
            options: [
                "Радость и смех",
                "Напряжение и волнение",
                "Глубокие размышления",
                "Ностальгия",
                "Успокоение и расслабление",
            ],
            multipleChoice: false,
        },
        {
            question: "Какой жанр вам ближе всего в данный момент? (выберите несколько)",
            options: [
                "Драма",
                "Комедия",
                "Ужасы",
                "Научная фантастика",
                "Приключения",
                "Романтика",
                "Документальный",
            ],
            multipleChoice: true,
        },
        {
            question: "Какой тип времени суток вам предпочтителен для просмотра фильма?",
            options: ["Утро", "Днем", "Вечером", "Ночью"],
            multipleChoice: false,
        },
        {
            question: "Какой стиль повествования вам больше нравится?",
            options: [
                "Линейный (по порядку)",
                "Нелинейный (с флешбэками и перескоками)",
                "Антология (несколько историй в одном фильме)",
                "Документальный стиль",
            ],
            multipleChoice: false,
        },
        {
            question: "Какой уровень сложности сюжета вы предпочитаете?",
            options: [
                "Легкий и предсказуемый",
                "Умеренно сложный, с интригующими поворотами",
                "Сложный, требующий внимательного анализа",
            ],
            multipleChoice: false,
        },
        {
            question: "Какой тип главного героя вам ближе?",
            options: [
                "Антигерой",
                "Обычный человек",
                "Герой с суперспособностями",
                "Загадочный персонаж",
            ],
            multipleChoice: false,
        },
        {
            question: "Какой элемент фильма вы предпочли бы видеть в сюжете?",
            options: [
                "Любовная история",
                "Дружба и отношения",
                "Приключения и путешествия",
                "Конфликт и противостояние",
            ],
            multipleChoice: false,
        },
        {
            question: "Какой элемент фильма для вас наиболее важен?",
            options: [
                "Сюжет",
                "Актерская игра",
                "Визуальные эффекты",
                "Музыка и звуковое оформление",
                "Режиссура",
            ],
            multipleChoice: false,
        },
        {
            question: "Какой формат просмотра вам предпочтителен?",
            options: [
                "В кинотеатре",
                "Дома на диване",
                "На вечеринке с друзьями",
                "В одиночестве",
            ],
            multipleChoice: false,
        },
        {
            question: "Какой уровень реализма вы предпочитаете?",
            options: [
                "Полностью реалистичный",
                "С элементами фантастики",
                "Абсурдный и сюрреалистичный",
            ],
            multipleChoice: false,
        },
    ];

    // Состояние для текущего вопроса и выбранных ответов
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Answers>({});
    const [recommendation, setRecommendation] = useState<string | null>(null); // Добавляем состояние для рекомендации

    const recommendationRef = useRef<HTMLDivElement>(null); // Ref для элемента рекомендации

    useEffect(() => {
        if (recommendation && recommendationRef.current) {
            recommendationRef.current.scrollIntoView({ behavior: 'smooth' }); // Прокрутка к элементу
        }
    }, [recommendation]); // Зависимость от recommendation

    // Функция для обработки выбора ответа
    const handleAnswerSelect = (answer: string) => {
        setAnswers((prevAnswers) => ({
            ...prevAnswers,
            [currentQuestionIndex]: answer,
        }));
    };

    // Функция для обработки выбора нескольких ответов
    const handleMultipleChoiceSelect = (answer: string) => {
        setAnswers((prevAnswers) => {
            const currentAnswers = (prevAnswers[currentQuestionIndex] || []) as string[]; // Type assertion
            if (currentAnswers.includes(answer)) {
                return {
                    ...prevAnswers,
                    [currentQuestionIndex]: currentAnswers.filter((item) => item !== answer),
                };
            } else {
                return {
                    ...prevAnswers,
                    [currentQuestionIndex]: [...currentAnswers, answer],
                };
            }
        });
    };

    // Функция для перехода к следующему вопросу
    const handleNext = async () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {

            try {
                const response = await axios.post('http://localhost:5000/api/submit_poll', answers, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });


                if (response.data.success) {
                    setRecommendation(response.data.recommendation); // Сохраняем рекомендацию в состоянии

                } else {
                    setRecommendation("Произошла ошибка при получении рекомендации.");
                }



            } catch (error: any) {

                setRecommendation("Произошла ошибка при отправке данных. Пожалуйста, попробуйте еще раз.");
            }
        }
    };

    // Получаем текущий вопрос и его варианты
    const currentQuestion = questions[currentQuestionIndex];

    return (
        <main className={styles.main}>
            <h1 className={styles.title}>Найдите идеальный фильм за считанные минуты с помощью нашего опроса</h1>

            <div className={styles.questions_container}>
                <h2 className={styles.h2}>{currentQuestion.question}</h2>
                <div className={styles.options}>
                    {currentQuestion.options.map((option, index) => (
                        <div key={index} className={styles.option_item}>
                            {currentQuestion.multipleChoice ? (
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={((answers[currentQuestionIndex] || []) as string[]).includes(option)} // Type assertion
                                        onChange={() => handleMultipleChoiceSelect(option)}
                                    />
                                    {option}
                                </label>
                            ) : (
                                <button
                                    className={styles.option_button}
                                    onClick={() => handleAnswerSelect(option)}
                                    style={{
                                        backgroundColor: answers[currentQuestionIndex] === option ? "lightblue" : "",
                                    }}
                                >
                                    {option}
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <button className={styles.next_button} onClick={handleNext}>
                    Далее
                </button>
            </div>

            <div ref={recommendationRef} className={styles.recommendation}>  {/* Ref добавлен */}
                {recommendation && (
                    <>
                        <h2>Рекомендованный фильм:</h2>
                        <p>{recommendation}</p>
                    </>
                )}
            </div>
        </main>
    );
}