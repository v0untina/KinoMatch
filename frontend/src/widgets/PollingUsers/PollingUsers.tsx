"use client";
import React, { useState } from "react";
import styles from "./Polling.module.css";

export default function Pollingusers() {
  // Список вопросов и вариантов ответов
  const questions = [
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
  const [answers, setAnswers] = useState({});

  // Функция для обработки выбора ответа
  const handleAnswerSelect = (answer) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [currentQuestionIndex]: answer,
    }));
  };

  // Функция для обработки выбора нескольких ответов
  const handleMultipleChoiceSelect = (answer) => {
    setAnswers((prevAnswers) => {
      const currentAnswers = prevAnswers[currentQuestionIndex] || [];
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
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      alert( JSON.stringify(answers));
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
                    checked={answers[currentQuestionIndex]?.includes(option)}
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
    </main>
  );
}
