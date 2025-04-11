// frontend/src/widgets/CrossingMovies/CrossingMovies.tsx
"use client"; 

import React, { useState, useEffect, useCallback, useRef } from "react";
import styles from "./CrossingMovies.module.css"; // Убедись, что путь к стилям верный
import { searchMovies, MovieSuggestion } from "@/api/movies"; // Импорт API поиска фильмов и типа подсказки
import useDebounce from "@/hooks/useDebounce"; // Импорт хука для debounce
import axios from "axios"; // Импорт axios для HTTP-запросов

// --- ИНТЕРФЕЙС ДЛЯ ОДНОЙ РЕКОМЕНДАЦИИ (из ответа /recommend_movie) 
interface SingleMovieRecommendation {
  titleLine: string; 
  posterFilename: string | null; 
}

// --- ИНТЕРФЕЙС ДЛЯ ОТВЕТА API СКРЕЩИВАНИЯ ---
interface CrossingApiResponse {
  success: boolean;
  recommendation?: SingleMovieRecommendation; // ОДНА рекомендация (объект) или отсутствует при неуспехе/ошибке
  error?: string; // Сообщение об ошибке
}

// --- КОМПОНЕНТ КАРТОЧКИ ФИЛЬМА ДЛЯ РЕЗУЛЬТАТА ---
// (Может быть вынесен в отдельный файл, если используется в других местах)
const MovieCardResult = ({ titleLine, posterFilename }: SingleMovieRecommendation) => {
    // Извлекаем чистое название фильма из строки для alt и title
    const titleMatch = titleLine.match(/^"?(.+?)"?(?:\s+\(\d{4}\))?$/);
    const displayTitle = titleMatch ? titleMatch[1].trim() : titleLine;

    // Формируем путь к изображению
    const imageBasePath = "/posters/"; // Путь к папке постеров в /public
    const placeholderImage = `${imageBasePath}placeholder.jpg`; // Заглушка
    const imageUrl = posterFilename ? `${imageBasePath}${posterFilename}` : placeholderImage;

    // Обработчик ошибок загрузки изображения
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        console.warn(`Ошибка загрузки постера: ${imageUrl}. Используется заглушка.`);
        e.currentTarget.src = placeholderImage; // Заменяем на заглушку
    };

    return (
        // Используем отдельные классы для стилизации результата скрещивания
        <div className={styles.movieCardResult}>
            <img
                src={imageUrl}
                alt={displayTitle}
                className={styles.movieCardImageResult}
                onError={handleImageError} // Обработка ошибок загрузки
                loading="lazy" // Ленивая загрузка
            />
            <p className={styles.movieCardTitleResult} title={displayTitle}> {/* Title для всплывающей подсказки */}
                {displayTitle}
            </p>
        </div>
    );
}


// --- ОСНОВНОЙ КОМПОНЕНТ СКРЕЩИВАНИЯ ФИЛЬМОВ ---
export default function CrossingMovies() {
  // Состояния для управления UI и данными
  const [selected_popcorns, set_selected_popcorns] = useState<number>(2); // Количество выбранных "попкорнов" (фильмов)
  const [movie_count, set_movie_count] = useState<number>(2); // Текущее количество полей для ввода
  const [searchTerms, setSearchTerms] = useState<string[]>(Array(movie_count).fill("")); // Поисковые запросы в инпутах
  const [suggestions, setSuggestions] = useState<MovieSuggestion[]>([]); // Подсказки для активного инпута
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null); // Индекс инпута, получившего фокус
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false); // Загрузка подсказок

  // Состояния для результата скрещивания
  const [recommendationResult, setRecommendationResult] = useState<SingleMovieRecommendation | null>(null); // Результат (объект) или null
  const [isRecLoading, setIsRecLoading] = useState<boolean>(false); // Загрузка рекомендации от Flask
  const [recError, setRecError] = useState<string | null>(null); // Ошибка при получении рекомендации

  // Ссылки на DOM-элементы для позиционирования подсказок
  const inputRefs = useRef<(HTMLDivElement | null)[]>([]);

  // URL Flask API из переменных окружения
  const flaskApiUrl = process.env.NEXT_PUBLIC_FLASK_API_URL;

  // Эффект для обновления массива ссылок при изменении кол-ва фильмов
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, movie_count);
  }, [movie_count]);

  // Эффект для обновления массива поисковых запросов и сброса результата
  useEffect(() => {
    // Обновляем массив searchTerms, сохраняя существующие значения
    setSearchTerms(prevTerms => Array(movie_count).fill("").map((_, i) => prevTerms[i] || ""));
    // Сбрасываем результат и ошибку при изменении количества фильмов
    setRecommendationResult(null);
    setRecError(null);
  }, [movie_count]);

  // Debounce для поискового запроса активного инпута
  const debouncedSearchTerm = useDebounce(
    activeInputIndex !== null ? searchTerms[activeInputIndex] : "",
    300 // Задержка 300ms
  );

  // Функция для запроса подсказок фильмов
  const fetchSuggestions = useCallback(async (query: string) => {
    // Не ищем, если запрос пустой или нет активного инпута
    if (!query.trim() || activeInputIndex === null) {
      setSuggestions([]);
      return;
    }
    setIsLoadingSuggestions(true);
    try {
        // Вызов API поиска фильмов (предполагается, что функция searchMovies работает)
        const results = await searchMovies(query);
        // Показываем подсказки, только если инпут все еще активен и запрос тот же
        if (activeInputIndex !== null && query === searchTerms[activeInputIndex]) {
            setSuggestions(results);
        }
    } catch (error) {
        console.error("Ошибка при поиске фильмов:", error);
        // Очищаем подсказки при ошибке, если инпут все еще активен
        if (activeInputIndex !== null && query === searchTerms[activeInputIndex]) {
             setSuggestions([]);
        }
    } finally {
         setIsLoadingSuggestions(false);
    }
  }, [activeInputIndex, searchTerms]); // Зависимости useCallback

  // Эффект для вызова fetchSuggestions при изменении debounced-запроса
  useEffect(() => {
    if (debouncedSearchTerm && activeInputIndex !== null) {
      fetchSuggestions(debouncedSearchTerm);
    } else {
      setSuggestions([]); // Очищаем, если запрос пустой
    }
  }, [debouncedSearchTerm, fetchSuggestions, activeInputIndex]); // Зависимости useEffect

  // Обработчик клика по попкорну
  const handle_popcorn_click = (count: number) => {
    if (count < 2) return; // Минимум 2 фильма
    set_selected_popcorns(count);
    set_movie_count(count);
    setActiveInputIndex(null); // Сброс фокуса и подсказок
    setSuggestions([]);
  };

  // Обработчик изменения текста в инпуте
  const handleInputChange = (index: number, value: string) => {
    const newTerms = [...searchTerms];
    newTerms[index] = value;
    setSearchTerms(newTerms);
    // Устанавливаем активный инпут
    if (activeInputIndex !== index) {
        setActiveInputIndex(index);
    }
    // Убираем подсказки, если поле очищено
    if (value === '') {
        setSuggestions([]);
    }
    // Сбрасываем результат и ошибку при любом изменении ввода
    setRecommendationResult(null);
    setRecError(null);
  };

  // Обработчик выбора подсказки
  const handleSuggestionClick = (index: number, movieTitle: string) => {
    const newTerms = [...searchTerms];
    newTerms[index] = movieTitle; // Вставляем название в инпут
    setSearchTerms(newTerms);
    setSuggestions([]); // Скрываем подсказки
    setActiveInputIndex(null); // Убираем фокус/активность
    setRecommendationResult(null); // Сбрасываем результат
    setRecError(null);
  };

  // Обработчик получения фокуса инпутом
  const handleInputFocus = (index: number) => {
    setActiveInputIndex(index);
    // Пытаемся загрузить подсказки, если в поле уже что-то есть
    if (searchTerms[index]) {
        fetchSuggestions(searchTerms[index]);
    }
  };

   // Обработчик потери фокуса инпутом
   const handleInputBlur = () => {
       // Небольшая задержка, чтобы успел сработать onMouseDown на подсказке
       setTimeout(() => {
           // Скрываем подсказки, если фокус ушел за пределы обертки поиска
           if (!document.activeElement?.closest(`.${styles.search_wrapper}`)) {
                setActiveInputIndex(null);
                setSuggestions([]);
           }
       }, 150);
   };

   // Асинхронная функция для запроса рекомендации скрещивания
   const handleGetRecommendation = async () => {
       // Проверка наличия URL API
       if (!flaskApiUrl) {
           setRecError("Ошибка конфигурации: URL API не найден.");
           console.error("Ошибка: NEXT_PUBLIC_FLASK_API_URL не установлена в .env.local");
           return;
       }
       // Проверка, что все поля заполнены
       const filledMovies = searchTerms.filter(term => term.trim() !== "");
       if (filledMovies.length !== movie_count) {
            setRecError(`Пожалуйста, введите названия для всех ${movie_count} фильмов.`);
            return;
       }

       // Установка состояния загрузки, сброс предыдущих данных
       setIsRecLoading(true);
       setRecommendationResult(null);
       setRecError(null);

       try {
           // Отправка POST-запроса на Flask эндпоинт /recommend_movie
           const response = await axios.post<CrossingApiResponse>(
               `${flaskApiUrl}/recommend_movie`,
               { movies: searchTerms } // Передаем массив названий
           );

           console.log("Ответ API скрещивания:", response.data); // Лог для отладки

           // Обработка ответа
           if (response.data.success && response.data.recommendation) {
               // Сохраняем полученный объект рекомендации
               setRecommendationResult(response.data.recommendation);
           } else {
               // Сохраняем ошибку из ответа API (включая 404)
               setRecError(response.data.error || "Не удалось получить рекомендацию.");
           }

       } catch (error) {
            // Обработка ошибок сети или HTTP-статуса
            console.error("Ошибка при запросе рекомендации:", error);
            if (axios.isAxiosError(error)) {
                 if (error.response) {
                     // Ошибка от Flask (включая 404, 500)
                     setRecError(error.response.data?.error || `Ошибка сервера (${error.response.status})`);
                 } else if (error.request) {
                     // Нет ответа от сервера
                     setRecError("Не удалось подключиться к серверу рекомендаций.");
                 } else {
                     // Ошибка настройки запроса
                     setRecError(`Ошибка при формировании запроса: ${error.message}`);
                 }
            } else {
                // Другие ошибки
                setRecError("Произошла неизвестная ошибка при запросе.");
            }
       } finally {
           setIsRecLoading(false); // Снимаем флаг загрузки
       }
   };

   // Заглушка для кнопки "Случайно"
   const handleRandomClick = () => {
       console.log("Кнопка 'Случайно' нажата - логика не реализована");
       setRecommendationResult(null); // Сброс результата
       setRecError("Функция случайного подбора еще не реализована.");
   }

  // JSX разметка компонента
  return (
    <div className={styles.main}>
      {/* Заголовок */}
      <h1 className={styles.title}>сколько фильмов скрещиваем?</h1>

      {/* Выбор количества фильмов (попкорны) */}
      <div className={styles.popcorn_container}>
        {[1, 2, 3, 4, 5].map((count) => (
          <div
            key={count}
            className={`${styles.popcorn_wrapper} ${count <= selected_popcorns ? "" : styles.inactive} ${count === 1 ? styles.disabled : ""}`}
            onClick={() => handle_popcorn_click(count)}
            title={count === 1 ? "Минимум 2 фильма для скрещивания" : `Скрестить ${count} фильма`}
          >
            <img
              src={count <= selected_popcorns ? "/Popcorn_active.png" : "/Popcorn_inactive.png"} // Убедись, что пути верны
              alt={`${count} попкорна`}
              className={styles.popcorn_image}
            />
          </div>
        ))}
      </div>

      {/* Контейнер для ввода названий фильмов */}
      <div className={styles.movies_container}>
        {Array.from({ length: movie_count }).map((_, index) => (
          <React.Fragment key={index}>
            {/* Карточка для ввода одного фильма */}
            <div className={styles.movie_card}>
              <div className={styles.movie_content}>Фильм {index + 1}</div>
              {/* Обертка для инпута и подсказок */}
              <div
                 className={styles.search_wrapper}
                 ref={el => inputRefs.current[index] = el}
              >
                <div className={styles.search_container}>
                  {/* Поле ввода */}
                  <input
                    type="text"
                    placeholder="Введите название фильма..."
                    className={styles.search_input}
                    value={searchTerms[index]}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onFocus={() => handleInputFocus(index)}
                    onBlur={handleInputBlur}
                    autoComplete="off"
                    disabled={isRecLoading} // Блокируем во время основного запроса
                  />
                </div>
                 {/* Список подсказок */}
                 {activeInputIndex === index && (suggestions.length > 0 || isLoadingSuggestions) && (
                    <ul className={styles.suggestions_list}>
                        {isLoadingSuggestions && <li className={styles.suggestion_item_loading}>Загрузка...</li>}
                        {!isLoadingSuggestions && suggestions.map((movie) => (
                            <li
                                key={movie.movie_id} // Используй уникальный ID, если есть
                                className={styles.suggestion_item}
                                onMouseDown={() => handleSuggestionClick(index, movie.title)} // Используем onMouseDown
                            >
                                {movie.title} {movie.year ? `(${movie.year})` : ''}
                            </li>
                        ))}
                         {!isLoadingSuggestions && suggestions.length === 0 && searchTerms[index] && (
                             <li className={styles.suggestion_item_no_results}>Ничего не найдено</li>
                         )}
                    </ul>
                 )}
              </div>
            </div>

            {/* Разделитель "+" */}
            {index < movie_count - 1 && (
              <div className={styles.divider}>
                <img className={styles.image_crossing} src="/crossing.png" alt="плюс" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Кнопки действий */}
      <div className={styles.buttons_result}>
        {/* Кнопка "Подобрать фильмы" */}
        <button
            className={styles.button_set}
            onClick={handleGetRecommendation}
            disabled={isRecLoading || searchTerms.some(term => term.trim() === "")} // Блокируем, если загрузка или есть пустые поля
        >
          {isRecLoading ? "Подбираем..." : "подобрать фильмы"}
        </button>
        {/* Кнопка "Случайно" */}
        <button
            className={styles.button_random}
            onClick={handleRandomClick}
            disabled={isRecLoading} // Блокируем во время основного запроса
            title="Случайный подбор (не реализовано)"
        >
          <img className={styles.image_random} src="/Dice.png" alt="Случайно" />
        </button>
      </div>

      {/* Область вывода результата */}
      <div className={styles.result}>
        {/* Индикатор загрузки */}
        {isRecLoading && <p className={styles.loadingMessage}>Ищем идеальное сочетание...</p>}
        {/* Сообщение об ошибке */}
        {recError && !isRecLoading && <p className={styles.errorMessage}>Ошибка: {recError}</p>}

        {/* Отображение ОДНОЙ карточки результата */}
        {recommendationResult && !isRecLoading && !recError && (
            <div className={styles.recommendation_output_single}>
                 <MovieCardResult
                     titleLine={recommendationResult.titleLine}
                     posterFilename={recommendationResult.posterFilename}
                 />
            </div>
        )}
      </div>
    </div>
  );
}