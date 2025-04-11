// frontend/src/widgets/PollingUsers/PollingUsers.tsx
// (Предполагая, что файл находится по этому пути, если нет - скорректируй импорт стилей)
"use client";
import React, { useState } from "react";
import styles from "./Polling.module.css"; // Убедись, что путь к стилям верный
import axios from "axios"; // Импортируем axios для HTTP-запросов

// --- ИНТЕРФЕЙС ДЛЯ ОБЪЕКТА РЕКОМЕНДАЦИИ ---
interface MovieRecommendation {
  titleLine: string; // Строка вида "Название (Год)"
  posterFilename: string | null; // Имя файла постера или null
}

// --- ИНТЕРФЕЙС ДЛЯ ОТВЕТА API ---
interface PollApiResponse {
  success: boolean;
  recommendations?: MovieRecommendation[]; // Массив объектов рекомендаций
  error?: string;
}

// --- КОМПОНЕНТ КАРТОЧКИ ФИЛЬМА ---
// (Можно вынести в отдельный файл src/components/MovieCard/MovieCard.tsx)
const MovieCard = ({ titleLine, posterFilename }: MovieRecommendation) => {
    // Извлекаем название из строки "Название (Год)" для alt и title
    const titleMatch = titleLine.match(/^"?(.+?)"?(?:\s+\(\d{4}\))?$/);
    const displayTitle = titleMatch ? titleMatch[1].trim() : titleLine;

    // --- Формируем путь к постеру ---
    const imageBasePath = "/posters/"; // Базовый путь к папке постеров в /public
    const placeholderImage = `${imageBasePath}placeholder.jpg`; // Путь к заглушке
    // Собираем полный URL: используем posterFilename или заглушку
    const imageUrl = posterFilename ? `${imageBasePath}${posterFilename}` : placeholderImage;
    // ---------------------------------

    // Обработчик ошибок загрузки изображения: заменяет src на заглушку
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        console.warn(`Ошибка загрузки постера: ${imageUrl}. Используется заглушка.`);
        e.currentTarget.src = placeholderImage;
    };

    return (
        <div className={styles.movieCard}>
            <img
                src={imageUrl}
                alt={displayTitle} // Используем чистое название для alt
                className={styles.movieCardImage}
                onError={handleImageError} // Устанавливаем обработчик ошибок
                loading="lazy" // Добавляем ленивую загрузку для изображений
            />
            <p className={styles.movieCardTitle} title={displayTitle}> {/* Добавляем title для длинных названий */}
                {displayTitle}
            </p>
        </div>
    );
}

// --- ОСНОВНОЙ КОМПОНЕНТ ОПРОСА ---
export default function Pollingusers() {
  // Массив с вопросами и вариантами ответов
  const questions = [
    { question: "Какое настроение вы хотите испытать после просмотра фильма?", options: ["Радость и смех", "Напряжение и волнение", "Глубокие размышления", "Ностальгия"], multipleChoice: false, },
    { question: "Какой жанр вам ближе всего в данный момент? (выберите несколько)", options: ["Комедия", "Ужасы", "Научная фантастика", "Романтика", "Документальный", "Боевик", "Триллер", "Драма"], multipleChoice: true, }, // Добавил пару жанров
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
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({}); // Ответы пользователя
  const [isLoading, setIsLoading] = useState<boolean>(false); // Флаг загрузки рекомендаций
  const [error, setError] = useState<string | null>(null); // Сообщение об ошибке
  const [recommendations, setRecommendations] = useState<MovieRecommendation[]>([]); // Результаты - массив объектов
  const [showResults, setShowResults] = useState<boolean>(false); // Показать экран результатов?

  // URL Flask API из переменных окружения
  // Убедись, что в frontend/.env.local есть: NEXT_PUBLIC_FLASK_API_URL=http://93.115.104.249:5000
  const flaskApiUrl = process.env.NEXT_PUBLIC_FLASK_API_URL;

  // Обработчик выбора ответа для одиночного выбора (радиокнопки)
  const handleAnswerSelect = (answer: string) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [currentQuestionIndex]: answer,
    }));
  };

  // Обработчик выбора ответа для множественного выбора (чекбоксы)
  const handleMultipleChoiceSelect = (answer: string) => {
    setAnswers((prevAnswers) => {
      const currentAnswers = (prevAnswers[currentQuestionIndex] as string[]) || [];
      // Если ответ уже есть - удаляем, если нет - добавляем
      const newAnswers = currentAnswers.includes(answer)
        ? currentAnswers.filter((item) => item !== answer)
        : [...currentAnswers, answer];
      return {
        ...prevAnswers,
        [currentQuestionIndex]: newAnswers,
      };
    });
  };

  // Асинхронная функция отправки ответов и получения рекомендаций
  const submitPollAndGetRecommendations = async () => {
      if (!flaskApiUrl) {
          setError("Ошибка конфигурации: URL API не найден.");
          console.error("Ошибка: NEXT_PUBLIC_FLASK_API_URL не установлена в .env.local");
          setShowResults(true); // Показать экран с ошибкой
          return;
      }

      setIsLoading(true); // Включаем индикатор загрузки
      setError(null); // Сбрасываем предыдущие ошибки
      setRecommendations([]); // Очищаем предыдущие рекомендации
      setShowResults(true); // Переключаемся на экран результатов

      console.log("Отправляемые ответы:", answers); // Лог для отладки

      try {
          // Отправляем POST-запрос на Flask API
          const response = await axios.post<PollApiResponse>(
              `${flaskApiUrl}/api/submit_poll`,
              answers // Тело запроса - объект с ответами
          );

          console.log("Ответ API:", response.data); // Лог для отладки

          // Обрабатываем успешный ответ
          if (response.data.success && response.data.recommendations) {
              // Фильтруем на случай пустых строк или объектов (доп. подстраховка)
              const validRecs = response.data.recommendations.filter(rec => rec && rec.titleLine);
              setRecommendations(validRecs);
              if (validRecs.length === 0) {
                  setError("Не удалось подобрать фильмы по вашим критериям."); // Сообщение если массив пуст, но success=true
              }
          } else {
              // Обрабатываем неуспешный ответ (success=false или нет поля recommendations)
              setError(response.data.error || "Не удалось получить рекомендации.");
          }

      } catch (err) {
          // Обрабатываем ошибки сети или HTTP-статуса
          console.error("Ошибка при отправке опроса:", err);
            if (axios.isAxiosError(err)) {
                 if (err.response) {
                     // Ошибка от сервера Flask (включая 404)
                     setError(err.response.data?.error || `Ошибка сервера (${err.response.status})`);
                 } else if (err.request) {
                     // Запрос сделан, но ответ не получен
                     setError("Не удалось подключиться к серверу рекомендаций. Проверьте сеть.");
                 } else {
                     // Ошибка настройки запроса
                     setError(`Ошибка при формировании запроса: ${err.message}`);
                 }
            } else {
                // Другие типы ошибок
                setError("Произошла неизвестная ошибка при запросе рекомендаций.");
            }
      } finally {
          setIsLoading(false); // Выключаем индикатор загрузки в любом случае
      }
  };

  // Обработчик нажатия кнопки "Далее" или "Показать результаты"
  const handleNext = () => {
    const currentAnswers = answers[currentQuestionIndex];
    // Проверка, что ответ дан
    if (!currentAnswers || (Array.isArray(currentAnswers) && currentAnswers.length === 0)) {
      alert("Пожалуйста, выберите ответ или варианты ответа.");
      return;
    }

    // Если не последний вопрос - переходим к следующему
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Если последний вопрос - отправляем данные на бэкенд
      submitPollAndGetRecommendations();
    }
  };

   // Обработчик нажатия кнопки "Пройти еще раз"
   const handleReset = () => {
        setCurrentQuestionIndex(0); // Возвращаемся к первому вопросу
        setAnswers({}); // Сбрасываем ответы
        setIsLoading(false); // Сбрасываем флаги
        setError(null);
        setRecommendations([]);
        setShowResults(false); // Скрываем экран результатов
   }

  // Получаем данные текущего вопроса
  const currentQuestion = questions[currentQuestionIndex];

  // Основная разметка компонента
  return (
    <main className={styles.main}>
      {/* Условный рендеринг: либо вопросы, либо результаты */}
      {!showResults ? (
        // --- ЭКРАН С ВОПРОСАМИ ---
        <>
          <h1 className={styles.title}>Найдите идеальный фильм за считанные минуты <br />с помощью нашего опроса</h1>
          <div className={styles.questions_container}>
            {/* Прогресс-бар (опционально) */}
            {/* <div className={styles.progressBar}> ... </div> */}
            <h2 className={styles.h2}>{currentQuestion.question}</h2>
            <div className={styles.options}>
              {/* Рендерим варианты ответов */}
              {currentQuestion.options.map((option, index) => (
                <div key={index} className={styles.option_item}>
                  {currentQuestion.multipleChoice ? (
                    // Чекбокс для множественного выбора
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        className={styles.checkboxInput}
                        // Проверяем, включен ли ответ в массив ответов для текущего вопроса
                        checked={answers[currentQuestionIndex]?.includes(option)}
                        onChange={() => handleMultipleChoiceSelect(option)}
                      />
                      <span className={styles.optionText}>{option}</span>
                    </label>
                  ) : (
                    // Радиокнопка для одиночного выбора
                    <label className={styles.radioLabel}>
                       <input
                           type="radio"
                           name={`question-${currentQuestionIndex}`} // Уникальное имя для группы радиокнопок
                           className={styles.radioInput}
                           // Проверяем, равен ли ответ текущему выбору
                           checked={answers[currentQuestionIndex] === option}
                           onChange={() => handleAnswerSelect(option)}
                       />
                       <span className={styles.optionText}>{option}</span>
                    </label>
                  )}
                </div>
              ))}
            </div>
            {/* Кнопка навигации */}
            <div className={styles.button_layout}>
              <button className={styles.next_button} onClick={handleNext}>
                {/* Текст кнопки меняется на последнем вопросе */}
                {currentQuestionIndex === questions.length - 1 ? "Показать результаты" : "Далее"}
              </button>
            </div>
          </div>
        </>
      ) : (
        // --- ЭКРАН С РЕЗУЛЬТАТАМИ ---
        <>
          <h1 className={styles.resultsTitle}>Предлагаем вам посмотреть следующие фильмы</h1>

          {/* Индикатор загрузки */}
          {isLoading && <p className={styles.loadingMessage}>Подбираем для вас лучшие фильмы...</p>}

          {/* Сообщение об ошибке */}
          {error && <p className={styles.errorMessage}>Ошибка: {error}</p>}

          {/* Сетка с результатами, если нет загрузки, нет ошибки и есть рекомендации */}
          {!isLoading && !error && recommendations.length > 0 && (
             <div className={styles.resultsGrid}>
                 {/* Рендерим карточку для каждой рекомендации */}
                 {recommendations.map((rec, index) => (
                     <MovieCard
                        key={index} // Используем индекс как ключ (или лучше ID фильма, если он будет)
                        titleLine={rec.titleLine}
                        posterFilename={rec.posterFilename}
                     />
                 ))}
             </div>
          )}

          {/* Сообщение, если фильмы не найдены (но ошибки запроса не было) */}
          {!isLoading && !error && recommendations.length === 0 && (
              <p className={styles.noResultsMessage}>К сожалению, по вашим ответам сейчас не удалось подобрать фильмы из нашей базы.</p>
          )}

          {/* Кнопка "Пройти еще раз", показывается после загрузки/ошибки */}
          {!isLoading && (
            <div className={styles.button_layout}> {/* Используем тот же контейнер для центрирования */}
                 <button className={styles.resetButton} onClick={handleReset}>
                    Пройти еще раз
                 </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}