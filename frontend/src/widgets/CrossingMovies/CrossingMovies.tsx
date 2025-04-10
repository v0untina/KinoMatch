"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import styles from "./CrossingMovies.module.css";
import { searchMovies, MovieSuggestion } from "@/api/movies"; // Импортируем API функцию и тип
import useDebounce from "@/hooks/useDebounce"; // Предполагаем, что у тебя есть хук для debounce

// --- Добавь хук useDebounce, если его нет ---
// Создай файл frontend/src/hooks/useDebounce.ts
/*
import { useState, useEffect } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Отменяем таймер при размонтировании или изменении значения/задержки
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
*/
// --- Конец хука useDebounce ---


export default function CrossingMovies() {
  const [selected_popcorns, set_selected_popcorns] = useState(2);
  const [movie_count, set_movie_count] = useState(2);

  // Состояния для поиска
  // Храним поисковые запросы для каждого инпута
  const [searchTerms, setSearchTerms] = useState<string[]>(Array(movie_count).fill(""));
  // Храним найденные подсказки
  const [suggestions, setSuggestions] = useState<MovieSuggestion[]>([]);
  // Индекс активного инпута, для которого показываем подсказки
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);
  // Флаг загрузки подсказок
  const [isLoading, setIsLoading] = useState(false);

  // Ссылки на контейнеры инпутов для позиционирования подсказок
  const inputRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Обновляем массив inputRefs при изменении movie_count
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, movie_count);
  }, [movie_count]);


  // Обновляем searchTerms при изменении movie_count
  useEffect(() => {
    setSearchTerms(prevTerms => {
        const newTerms = Array(movie_count).fill("");
        // Копируем существующие значения, если они есть
        for (let i = 0; i < Math.min(prevTerms.length, movie_count); i++) {
            newTerms[i] = prevTerms[i];
        }
        return newTerms;
    });
  }, [movie_count]);


  // Используем debounce для поискового запроса активного инпута
  const debouncedSearchTerm = useDebounce(
    activeInputIndex !== null ? searchTerms[activeInputIndex] : "",
    300 // Задержка в мс перед отправкой запроса
  );

  // Функция для загрузки подсказок
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || activeInputIndex === null) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    const results = await searchMovies(query);
    // Показываем подсказки только если инпут все еще активен
    // и поисковый запрос не изменился с момента начала запроса
    if (activeInputIndex !== null && query === searchTerms[activeInputIndex]) {
        setSuggestions(results);
    }
    setIsLoading(false);
  }, [activeInputIndex, searchTerms]); // Добавляем searchTerms в зависимости


  // Загружаем подсказки при изменении debouncedSearchTerm
  useEffect(() => {
    if (debouncedSearchTerm && activeInputIndex !== null) {
      fetchSuggestions(debouncedSearchTerm);
    } else {
      setSuggestions([]); // Очищаем подсказки, если запрос пустой
    }
  }, [debouncedSearchTerm, fetchSuggestions, activeInputIndex]);

  const handle_popcorn_click = (count: number) => {
    if (count < 2) return;
    set_selected_popcorns(count);
    set_movie_count(count);
    // Сбрасываем активный инпут и подсказки при изменении кол-ва
    setActiveInputIndex(null);
    setSuggestions([]);
  };

  // Обработчик изменения текста в инпуте
  const handleInputChange = (index: number, value: string) => {
    const newSearchTerms = [...searchTerms];
    newSearchTerms[index] = value;
    setSearchTerms(newSearchTerms);
    // Устанавливаем активный инпут при начале ввода
    if (activeInputIndex !== index) {
        setActiveInputIndex(index);
    }
    // Если поле очистили, сразу убираем подсказки
    if (value === '') {
        setSuggestions([]);
    }
  };

  // Обработчик выбора подсказки
  const handleSuggestionClick = (index: number, movieTitle: string) => {
    const newSearchTerms = [...searchTerms];
    newSearchTerms[index] = movieTitle;
    setSearchTerms(newSearchTerms);
    setSuggestions([]); // Скрываем подсказки
    setActiveInputIndex(null); // Сбрасываем активный инпут
  };

  // Обработчик фокуса на инпуте
  const handleInputFocus = (index: number) => {
    setActiveInputIndex(index);
    // Повторно загружаем подсказки, если в поле уже что-то есть
    if (searchTerms[index]) {
        fetchSuggestions(searchTerms[index]);
    }
  };

   // Обработчик потери фокуса (с небольшой задержкой, чтобы успеть кликнуть по подсказке)
   const handleInputBlur = () => {
       setTimeout(() => {
           // Проверяем, не был ли фокус переведен на другой инпут поиска или подсказку
           // Это простая проверка, можно усложнить при необходимости
           if (!document.activeElement?.closest(`.${styles.search_wrapper}`)) {
                setActiveInputIndex(null);
                setSuggestions([]);
           }
       }, 150); // Небольшая задержка
   };


  return (
    <div className={styles.main}>
      <h1 className={styles.title}>сколько фильмов скрещиваем?</h1>
      <div className={styles.popcorn_container}>
        {[1, 2, 3, 4, 5].map((count) => (
          <div
            key={count}
            className={`${styles.popcorn_wrapper} ${
              count <= selected_popcorns ? "" : styles.inactive
            } ${count === 1 ? styles.disabled : ""}`}
            onClick={() => handle_popcorn_click(count)}
          >
            <img
              src={count <= selected_popcorns ? "/popcorn_active.png" : "/popcorn_inactive.png"}
              alt={`${count} попкорна`}
              className={styles.popcorn_image}
            />
          </div>
        ))}
      </div>

      <div className={styles.movies_container}>
        {Array.from({ length: movie_count }).map((_, index) => (
          <React.Fragment key={index}>
            <div className={styles.movie_card}>
              <div className={styles.movie_content}>Фильм {index + 1}</div>
              {/* Обертка для позиционирования подсказок */}
              <div
                 className={styles.search_wrapper} // Добавляем класс для обертки
                 ref={el => inputRefs.current[index] = el} // Сохраняем ссылку на DOM-элемент
              >
                <div className={styles.search_container}>
                  <input
                    type="text"
                    placeholder="Поиск фильма..."
                    className={styles.search_input}
                    value={searchTerms[index]}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onFocus={() => handleInputFocus(index)}
                    onBlur={handleInputBlur} // Добавляем обработчик потери фокуса
                    autoComplete="off" // Отключаем встроенный автокомплит браузера
                  />
                </div>
                 {/* Отображение подсказок */}
                 {activeInputIndex === index && (suggestions.length > 0 || isLoading) && (
                    <ul className={styles.suggestions_list}>
                        {isLoading && <li className={styles.suggestion_item_loading}>Загрузка...</li>}
                        {!isLoading && suggestions.map((movie) => (
                            <li
                                key={movie.movie_id}
                                className={styles.suggestion_item}
                                // Используем onMouseDown вместо onClick, чтобы сработать до onBlur инпута
                                onMouseDown={() => handleSuggestionClick(index, movie.title)}
                            >
                                {movie.title} {movie.year ? `(${movie.year})` : ''}
                            </li>
                        ))}
                         {!isLoading && suggestions.length === 0 && searchTerms[index] && (
                             <li className={styles.suggestion_item_no_results}>Ничего не найдено</li>
                         )}
                    </ul>
                 )}
              </div>
            </div>

            {index < movie_count - 1 && (
              <div className={styles.divider}>
                <img className={styles.image_crossing} src="/crossing.png" alt="" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className={styles.buttons_result}>
        <button className={styles.button_set}>подобрать фильмы</button>
        <button className={styles.button_random}>
          <img className={styles.image_random} src="/Dice.png" alt="" />
        </button>
      </div>
      <div className={styles.result}>
        {/* Здесь будет результат */}
      </div>
    </div>
  );
}