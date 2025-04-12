// frontend/src/widgets/PollingUsers/PollingUsers.tsx
"use client";
import React, { useState } from "react";
import Link from "next/link"; // Импортируем Link
import styles from "./Polling.module.css"; // Убедись, что путь к стилям верный
import axios from "axios"; // Импортируем axios для HTTP-запросов

// --- ИНТЕРФЕЙС ДЛЯ ОБЪЕКТА РЕКОМЕНДАЦИИ (теперь с ID) ---
interface MovieRecommendation {
  movie_id: number; // Добавляем ID
  titleLine: string; // Строка вида "Название (Год)"
  posterFilename: string | null; // Имя файла постера или null
}

// --- ИНТЕРФЕЙС ДЛЯ ОТВЕТА API ---
interface PollApiResponse {
  success: boolean;
  recommendations?: MovieRecommendation[]; // Массив обновленных объектов рекомендаций
  error?: string;
}

// --- КОМПОНЕНТ КАРТОЧКИ ФИЛЬМА (теперь кликабельный) ---
const MovieCard = ({ movie_id, titleLine, posterFilename }: MovieRecommendation) => {
    // Извлекаем название из строки "Название (Год)" для alt и title
    const titleMatch = titleLine.match(/^"?(.+?)"?(?:\s+\(\d{4}\))?$/);
    const displayTitle = titleMatch ? titleMatch[1].trim() : titleLine; // Запасной вариант - вся строка

    // Формируем путь к постеру
    const imageBasePath = "/posters/";
    const placeholderImage = `${imageBasePath}placeholder.jpg`;
    const imageUrl = posterFilename ? `${imageBasePath}${posterFilename}` : placeholderImage;

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        console.warn(`Ошибка загрузки постера: ${imageUrl}. Используется заглушка.`);
        e.currentTarget.src = placeholderImage;
    };

    return (
        // Оборачиваем карточку в Link
        <Link href={`/films/${movie_id}`} className={styles.movieCardLink} title={`Перейти к фильму: ${displayTitle}`}>
            <div className={styles.movieCard}>
                <img
                    src={imageUrl}
                    alt={displayTitle}
                    className={styles.movieCardImage}
                    onError={handleImageError}
                    loading="lazy"
                />
                <p className={styles.movieCardTitle} title={displayTitle}>
                    {displayTitle}
                </p>
            </div>
        </Link>
    );
}

// --- ОСНОВНОЙ КОМПОНЕНТ ОПРОСА ---
export default function Pollingusers() {
  // Массив вопросов (оставляем как есть)
  const questions = [
    { question: "Какое настроение вы хотите испытать после просмотра фильма?", options: ["Радость и смех", "Напряжение и волнение", "Глубокие размышления", "Ностальгия"], multipleChoice: false, },
    { question: "Какой жанр вам ближе всего в данный момент? (выберите несколько)", options: ["Комедия", "Ужасы", "Научная фантастика", "Романтика", "Документальный", "Боевик", "Триллер", "Драма"], multipleChoice: true, },
    { question: "Какой тип времени суток вам предпочтителен для просмотра фильма?", options: ["Утро", "Днем", "Вечером", "Ночью"], multipleChoice: false, },
    { question: "Какой стиль повествования вам больше нравится?", options: ["Линейный (по порядку)", "Нелинейный", "Антология", "Документальный стиль"], multipleChoice: false, },
    { question: "Какой уровень сложности сюжета вы предпочитаете?", options: ["Легкий и предсказуемый", "Умеренно сложный", "Требующий анализа", "Сложный"], multipleChoice: false, },
    { question: "Какой тип главного героя вам ближе всего по духу?", options: ["Антигерой", "Обычный человек", "Герой с суперспособностями", "Загадочный персонаж"], multipleChoice: false, },
    { question: "Какой элемент фильма вы предпочли бы видеть в сюжете?", options: ["Любовная история", "Дружба и отношения", "Приключения и путешествия", "Конфликт и противостояние"], multipleChoice: false, },
    { question: "Какой элемент фильма для вас наиболее важен?", options: ["Сюжет", "Актерская игра", "Визуальные эффекты", "Музыка и звуковое оформление"], multipleChoice: false, },
    { question: "Какой формат просмотра вам предпочтителен?", options: ["В кинотеатре", "Дома на диване", "На вечеринке с друзьями", "В одиночестве"], multipleChoice: false, },
    { question: "Какой уровень реализма вы больше предпочитаете?", options: ["Полностью реалистичный", "С элементами фантастики", "Абсурдный и сюрреалистичный", "Психологический реализм"], multipleChoice: false, },
  ];

  // Состояния компонента
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Используем обновленный тип MovieRecommendation
  const [recommendations, setRecommendations] = useState<MovieRecommendation[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);

  const flaskApiUrl = process.env.NEXT_PUBLIC_FLASK_API_URL;

  // Обработчики ответов (handleAnswerSelect, handleMultipleChoiceSelect - без изменений)
   const handleAnswerSelect = (answer: string) => { setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: answer })); };
   const handleMultipleChoiceSelect = (answer: string) => {
     setAnswers((prev) => {
       const current = (prev[currentQuestionIndex] as string[]) || [];
       const newAnswers = current.includes(answer) ? current.filter((i) => i !== answer) : [...current, answer];
       return { ...prev, [currentQuestionIndex]: newAnswers };
     });
   };

  // Асинхронная функция отправки ответов
  const submitPollAndGetRecommendations = async () => {
      if (!flaskApiUrl) { setError("URL API не настроен."); setShowResults(true); return; }

      setIsLoading(true); setError(null); setRecommendations([]); setShowResults(true);
      console.log("Отправляемые ответы:", answers);

      try {
          // Запрос к Flask API (ожидаем обновленный формат ответа)
          const response = await axios.post<PollApiResponse>(`${flaskApiUrl}/api/submit_poll`, answers);
          console.log("Ответ API:", response.data);

          if (response.data.success && response.data.recommendations) {
              // Фильтруем на случай некорректных данных (наличие ID и titleLine)
              const validRecs = response.data.recommendations.filter(rec => rec && rec.movie_id && rec.titleLine);
              setRecommendations(validRecs);
              if (validRecs.length === 0) { setError("Не удалось подобрать фильмы по вашим критериям."); }
          } else {
              setError(response.data.error || "Не удалось получить рекомендации.");
          }
      } catch (err) {
          console.error("Ошибка при отправке опроса:", err);
            if (axios.isAxiosError(err)) {
                 setError(err.response?.data?.error || `Ошибка сервера (${err.response?.status || 'N/A'})` || (err.request ? "Нет ответа от сервера." : `Ошибка запроса: ${err.message}`));
            } else { setError("Неизвестная ошибка при запросе."); }
      } finally {
          setIsLoading(false);
      }
  };

  // Обработчик кнопки "Далее" (без изменений)
  const handleNext = () => {
    const currentAnswers = answers[currentQuestionIndex];
    if (!currentAnswers || (Array.isArray(currentAnswers) && currentAnswers.length === 0)) { alert("Пожалуйста, выберите ответ."); return; }
    if (currentQuestionIndex < questions.length - 1) { setCurrentQuestionIndex(currentQuestionIndex + 1); }
    else { submitPollAndGetRecommendations(); }
  };

   // Обработчик кнопки "Пройти еще раз" (без изменений)
   const handleReset = () => {
        setCurrentQuestionIndex(0); setAnswers({}); setIsLoading(false);
        setError(null); setRecommendations([]); setShowResults(false);
   };

  const currentQuestion = questions[currentQuestionIndex];

  // Основная разметка
  return (
    <main className={styles.main}>
      {!showResults ? (
        // --- ЭКРАН С ВОПРОСАМИ ---
        <>
          <h1 className={styles.title}>Найдите идеальный фильм <br />с помощью нашего опроса</h1>
          <div className={styles.questions_container}>
            <h2 className={styles.h2}>{currentQuestion.question}</h2>
            <div className={styles.options}>
              {currentQuestion.options.map((option, index) => (
                <div key={index} className={styles.option_item}>
                  {currentQuestion.multipleChoice ? (
                    <label className={styles.checkboxLabel}> <input type="checkbox" className={styles.checkboxInput} checked={answers[currentQuestionIndex]?.includes(option)} onChange={() => handleMultipleChoiceSelect(option)}/> <span className={styles.optionText}>{option}</span> </label>
                  ) : (
                    <label className={styles.radioLabel}> <input type="radio" name={`question-${currentQuestionIndex}`} className={styles.radioInput} checked={answers[currentQuestionIndex] === option} onChange={() => handleAnswerSelect(option)}/> <span className={styles.optionText}>{option}</span> </label>
                  )}
                </div>
              ))}
            </div>
            <div className={styles.button_layout}>
              <button className={styles.next_button} onClick={handleNext}>
                {currentQuestionIndex === questions.length - 1 ? "Показать результаты" : "Далее"}
              </button>
            </div>
          </div>
        </>
      ) : (
        // --- ЭКРАН С РЕЗУЛЬТАТАМИ ---
        <>
          <h1 className={styles.resultsTitle}>Предлагаем вам посмотреть следующие фильмы</h1>
          {isLoading && <p className={styles.loadingMessage}>Подбираем фильмы...</p>}
          {error && <p className={styles.errorMessage}>Ошибка: {error}</p>}
          {!isLoading && !error && recommendations.length > 0 && (
             <div className={styles.resultsGrid}>
                 {/* Рендерим кликабельную карточку для каждой рекомендации */}
                 {recommendations.map((rec) => (
                     <MovieCard
                        key={rec.movie_id} // Используем ID фильма как ключ
                        movie_id={rec.movie_id}
                        titleLine={rec.titleLine} // Передаем для извлечения названия
                        posterFilename={rec.posterFilename}
                     />
                 ))}
             </div>
          )}
          {!isLoading && !error && recommendations.length === 0 && (
              <p className={styles.noResultsMessage}>К сожалению, по вашим ответам сейчас не удалось подобрать фильмы.</p>
          )}
          {!isLoading && (
            <div className={styles.button_layout}>
                 <button className={styles.resetButton} onClick={handleReset}>Пройти еще раз</button>
            </div>
          )}
        </>
      )}
    </main>
  );
}