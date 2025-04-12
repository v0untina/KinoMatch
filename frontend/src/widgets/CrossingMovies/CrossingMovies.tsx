// frontend/src/widgets/CrossingMovies/CrossingMovies.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link"; // Импортируем Link для навигации
import styles from "./CrossingMovies.module.css"; // Основные стили виджета + СТИЛИ ДЛЯ ДЕТАЛЬНОЙ КАРТОЧКИ
// Обновляем импорт API
import { searchMovies, MovieSuggestion, getRandomMovies } from "@/api/movies";
import useDebounce from "@/hooks/useDebounce";
import axios from "axios"; // Используется для запроса деталей

// --- Определение типа MovieDetails (упрощенный для карточки результата) ---
interface MovieGenre { genres: { genre_id: number; name: string; }; }
interface Country { country_id: number; name: string; }
interface MovieDetails {
  movie_id: number; title: string; original_title: string | null; year: number | null;
  description: string | null; kinomatch_rating: number | string | null; // Может приходить как строка
  imdb_rating: number | string | null;      // Может приходить как строка
  poster_filename: string | null;
  movie_genres?: MovieGenre[]; // Только нужные поля
  countries?: Country;         // Только нужные поля
}
// --- Конец определения типа MovieDetails ---

// --- Интерфейс для ОТВЕТА API СКРЕЩИВАНИЯ (с ID) ---
interface CrossingApiResponseWithId {
  success: boolean;
  recommendation_id?: number;
  error?: string;
}

// Базовые пути и заглушки
const imageBasePath = "/posters/";
const placeholderImage = `${imageBasePath}placeholder.jpg`;
const placeholderAvatar = "/interface/defaultAvatar.webp";

// --- КОМПОНЕНТЫ StarRating и StarIcon (для детальной карточки) ---
// Используют стили из CrossingMovies.module.css (styles.)
const StarRating = ({ rating }: { rating: number | string | null }) => {
    if (rating === null || rating === undefined) return null;
    const numericRating = Number(rating);
    if (isNaN(numericRating)) return null;

    const fullStars = Math.floor(numericRating);
    const hasHalfStar = numericRating % 1 >= 0.3 && numericRating % 1 <= 0.7;
    const hasPartialStar = numericRating % 1 > 0.7;
    const emptyStars = Math.max(0, 5 - fullStars - (hasHalfStar || hasPartialStar ? 1 : 0));

    return (
      <div className={styles.rating_container}> {/* Используем styles */}
        {[...Array(fullStars)].map((_, i) => (
          <StarIcon key={`full-${i}`} filled={true} />
        ))}
        {hasHalfStar && <StarIcon key="half" filled="half" />}
        {hasPartialStar && <StarIcon key="partial" filled="partial" />}
        {[...Array(emptyStars)].map((_, i) => (
          <StarIcon key={`empty-${i}`} filled={false} />
        ))}
        <span className={styles.rating_value}>{numericRating.toFixed(1)}</span> {/* Используем styles */}
      </div>
    );
};

const StarIcon = ({ filled }: { filled: boolean | "half" | "partial" }) => {
    // Используем стили из CrossingMovies.module.css (styles.)
    const starColor = "rgba(0, 185, 174, 1)"; // var(--clr-primary-500)
    const emptyColor = "#E0E0E0"; // Цвет пустой звезды
    const path = "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";

    if (filled === true) {
      return ( <svg className={styles.star} viewBox="0 0 24 24" style={{ fill: starColor }}> <path d={path}/> </svg> );
    } else if (filled === "half") {
      return (
        <div className={styles.star_partial_container}> {/* Используем styles */}
          <svg className={styles.star_half} viewBox="0 0 24 24" style={{ fill: starColor }}> <path d={path}/> </svg>
          <svg className={styles.star_half_empty} viewBox="0 0 24 24" style={{ fill: emptyColor }}> <path d={path}/> </svg>
        </div>
      );
    } else if (filled === "partial") {
       return (
        <div className={styles.star_partial_container}> {/* Используем styles */}
          <svg className={styles.star_partial} viewBox="0 0 24 24" style={{ fill: starColor }}> <path d={path}/> </svg>
          <svg className={styles.star_partial_empty} viewBox="0 0 24 24" style={{ fill: emptyColor }}> <path d={path}/> </svg>
        </div>
      );
    } else {
      return ( <svg className={styles.star} viewBox="0 0 24 24" style={{ fill: emptyColor }}> <path d={path}/> </svg> );
    }
};
// --- КОНЕЦ StarRating ---

// --- КОМПОНЕНТ: ДЕТАЛЬНАЯ КАРТОЧКА РЕЗУЛЬТАТА ---
interface MovieDetailedResultCardProps { movie: MovieDetails; }
const MovieDetailedResultCard: React.FC<MovieDetailedResultCardProps> = ({ movie }) => {
  const imageUrl = movie.poster_filename
    ? `${imageBasePath}${movie.poster_filename}`
    : placeholderImage;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn(`Ошибка загрузки постера результата: ${imageUrl}. Используется заглушка.`);
    e.currentTarget.src = placeholderImage;
  };

  const truncateDescription = (text: string | null | undefined, maxLength: number) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    const lastSpaceIndex = text.lastIndexOf(' ', maxLength);
    return (lastSpaceIndex > 0 ? text.substring(0, lastSpaceIndex) : text.substring(0, maxLength)) + '...';
  };

  return (
    <Link href={`/films/${movie.movie_id}`} className={styles.detailedCardLink} title={`Перейти на страницу фильма "${movie.title}"`}>
      <div className={styles.detailedCardContainer}>
        <div className={styles.detailedCardPosterContainer}>
          <img src={imageUrl} alt={`Постер ${movie.title}`} className={styles.detailedCardPoster} onError={handleImageError} loading="lazy"/>
        </div>
        <div className={styles.detailedCardInfoContainer}>
          <h2 className={styles.detailedCardTitle}>
            {movie.title} {movie.original_title ? ` | ${movie.original_title}` : ''} {movie.year ? `(${movie.year})` : ''}
          </h2>
          <div className={styles.detailedCardMeta}>
            {movie.kinomatch_rating !== null && <div className={styles.rating}><StarRating rating={movie.kinomatch_rating} /></div>}
            {movie.imdb_rating !== null && <span className={styles.imdb_rating}><span className={styles.imdb_title}>IMDb</span> {Number(movie.imdb_rating).toFixed(1)}</span>}
          </div>
          {(movie.movie_genres && movie.movie_genres.length > 0) || movie.countries ? (
            <div className={styles.detailedCardAbout}>
              {movie.movie_genres && movie.movie_genres.length > 0 && (
                <div className={styles.detailedCardAboutItem}>
                  <img className={styles.detailedCardAboutIcon} src="/Animation.png" alt="Жанры" />
                  <p className={styles.detailedCardAboutText}>
                    {movie.movie_genres.map((mg, i) => (<React.Fragment key={mg.genres.genre_id}>{mg.genres.name}{i < movie.movie_genres!.length - 1 ? ', ' : ''}</React.Fragment>))}
                  </p>
                </div>
              )}
              {movie.countries && (
                <div className={styles.detailedCardAboutItem}>
                  <img className={styles.detailedCardAboutIcon} src="/Earth Globe.png" alt="Страна" />
                  <p className={styles.detailedCardAboutText}>{movie.countries.name}</p>
                </div>
              )}
            </div>
          ) : null}
          {movie.description && <div className={styles.detailedCardDescription}><p>{truncateDescription(movie.description, 250)}</p></div>}
        </div>
      </div>
    </Link>
  );
};
// --- КОНЕЦ Детальной карточки ---


// --- ОСНОВНОЙ КОМПОНЕНТ СКРЕЩИВАНИЯ ФИЛЬМОВ ---
export default function CrossingMovies() {
  // Состояния для UI
  const [selected_popcorns, set_selected_popcorns] = useState<number>(2);
  const [movie_count, set_movie_count] = useState<number>(2);
  const [searchTerms, setSearchTerms] = useState<string[]>(Array(movie_count).fill(""));
  const [suggestions, setSuggestions] = useState<MovieSuggestion[]>([]);
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false);
  const [selectedMovies, setSelectedMovies] = useState<(MovieSuggestion | null)[]>(Array(movie_count).fill(null));

  // Состояния для результата скрещивания
  const [isRecLoading, setIsRecLoading] = useState<boolean>(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [recommendedMovieId, setRecommendedMovieId] = useState<number | null>(null);

  // Состояния для загрузки деталей результата
  const [isDetailsLoading, setIsDetailsLoading] = useState<boolean>(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [recommendedMovieData, setRecommendedMovieData] = useState<MovieDetails | null>(null);

  // Состояния для случайного выбора
  const [isRandomLoading, setIsRandomLoading] = useState<boolean>(false);
  const [randomError, setRandomError] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLDivElement | null)[]>([]);
  const flaskApiUrl = process.env.NEXT_PUBLIC_FLASK_API_URL;
  const baseApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

  // --- Эффекты и обработчики ---

  // Эффект при изменении movie_count
   useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, movie_count);
    setSearchTerms(prevTerms => Array(movie_count).fill("").map((_, i) => prevTerms[i] || ""));
    setSelectedMovies(prevSelected => Array(movie_count).fill(null).map((_, i) => prevSelected[i] || null));
    setRecommendedMovieId(null); setRecommendedMovieData(null);
    setRecError(null); setDetailsError(null); setRandomError(null); // <-- Сброс ошибки рандома
    setActiveInputIndex(null); setSuggestions([]); setIsLoadingSuggestions(false);
  }, [movie_count]);

  // Debounce, fetchSuggestions, useEffect[debouncedSearchTerm]... (без изменений)
  const debouncedSearchTerm = useDebounce(
      activeInputIndex !== null ? searchTerms[activeInputIndex] : "", 300
  );
  const fetchSuggestions = useCallback(async (query: string) => {
     if (!query.trim() || activeInputIndex === null) { setSuggestions([]); return; }
     setIsLoadingSuggestions(true);
     try {
         const results = await searchMovies(query);
         if (activeInputIndex !== null && query === searchTerms[activeInputIndex]) { setSuggestions(results); }
     } catch (error) { console.error("Ошибка при поиске фильмов:", error); if (activeInputIndex !== null && query === searchTerms[activeInputIndex]) { setSuggestions([]); }
     } finally { if (activeInputIndex !== null && query === searchTerms[activeInputIndex]) { setIsLoadingSuggestions(false); } }
  }, [activeInputIndex, searchTerms]);
  useEffect(() => {
      if (debouncedSearchTerm && activeInputIndex !== null) { fetchSuggestions(debouncedSearchTerm); }
      else { if (!debouncedSearchTerm && activeInputIndex !== null) { setSuggestions([]); setIsLoadingSuggestions(false); } }
  }, [debouncedSearchTerm, fetchSuggestions, activeInputIndex]);


  // Обработчик клика по попкорну
  const handle_popcorn_click = (count: number) => {
    if (count < 2 || isRandomLoading || isRecLoading || isDetailsLoading) return; // Блокируем при любой загрузке
    set_selected_popcorns(count);
    set_movie_count(count);
  };

  // Обработчик изменения текста в инпуте
  const handleInputChange = (index: number, value: string) => {
     const newTerms = [...searchTerms]; newTerms[index] = value; setSearchTerms(newTerms);
    if (selectedMovies[index]) {
      const newSelected = [...selectedMovies]; newSelected[index] = null; setSelectedMovies(newSelected);
    }
    if (activeInputIndex !== index) setActiveInputIndex(index);
    if (value === '') { setSuggestions([]); setIsLoadingSuggestions(false); }
    setRecommendedMovieId(null); setRecommendedMovieData(null);
    setRecError(null); setDetailsError(null); setRandomError(null);
  };

  // Обработчик выбора подсказки
  const handleSuggestionClick = (index: number, movie: MovieSuggestion) => {
    const newTerms = [...searchTerms]; newTerms[index] = movie.title; setSearchTerms(newTerms);
    const newSelected = [...selectedMovies]; newSelected[index] = movie; setSelectedMovies(newSelected);
    setSuggestions([]); setIsLoadingSuggestions(false); setActiveInputIndex(null);
    setRecommendedMovieId(null); setRecommendedMovieData(null);
    setRecError(null); setDetailsError(null); setRandomError(null);
  };

  // Обработчики фокуса/блюра
  const handleInputFocus = (index: number) => {
     setActiveInputIndex(index);
     if (searchTerms[index].trim()) { /* fetch */ } else { setSuggestions([]); setIsLoadingSuggestions(false); }
   };
  const handleInputBlur = () => {
     setTimeout(() => {
           const activeEl = document.activeElement;
           const isFocusStillInside = activeEl?.closest(`.${styles.search_wrapper}`) || activeEl?.closest(`.${styles.suggestions_list}`);
           if (!isFocusStillInside) { setActiveInputIndex(null); setSuggestions([]); setIsLoadingSuggestions(false); }
       }, 150);
   };

  // Обработчик "Подобрать фильмы" (запрашивает ID)
  const handleGetRecommendation = async () => {
     if (!flaskApiUrl) { setRecError("URL Flask API не настроен"); return; }
     const moviesToCross = selectedMovies.slice(0, movie_count).filter(m => m !== null);
     if (moviesToCross.length !== movie_count) { setRecError(`Выберите фильмы для ${movie_count} полей`); return; }
     const movieTitlesToSend = moviesToCross.map(m => m!.title);

     setIsRecLoading(true); setRecommendedMovieId(null); setRecommendedMovieData(null);
     setRecError(null); setDetailsError(null); setRandomError(null); // Сброс всех ошибок

     try {
       const response = await axios.post<CrossingApiResponseWithId>(`${flaskApiUrl}/recommend_movie`, { movies: movieTitlesToSend });
       if (response.data.success && response.data.recommendation_id) {
         setRecommendedMovieId(response.data.recommendation_id);
       } else { setRecError(response.data.error || "Не удалось получить ID"); }
     } catch (error) {
         console.error("Ошибка при запросе ID рекомендации:", error);
         if (axios.isAxiosError(error)) {
             const flaskError = error.response?.data?.error || error.response?.data?.message || `Ошибка сервера Flask (${error.response?.status || 'N/A'})`;
             setRecError(error.response ? flaskError : (error.request ? "Нет ответа от Flask API." : `Ошибка запроса к Flask: ${error.message}`));
         } else { setRecError("Неизвестная ошибка при запросе ID."); }
     } finally { setIsRecLoading(false); }
   };

  // useEffect для загрузки ДЕТАЛЬНЫХ данных по ID
  useEffect(() => {
    if (!recommendedMovieId) { setRecommendedMovieData(null); setDetailsError(null); return; }
    const fetchMovieDetails = async () => {
      setIsDetailsLoading(true); setDetailsError(null); setRecommendedMovieData(null);
      try {
        const movieDetailsUrl = `${baseApiUrl}/movies/${recommendedMovieId}`;
        const response = await axios.get<MovieDetails>(movieDetailsUrl);
        setRecommendedMovieData(response.data);
      } catch (error) {
          console.error("Ошибка при загрузке деталей фильма:", error);
          if (axios.isAxiosError(error)) {
              const apiError = error.response?.data?.message || JSON.stringify(error.response?.data) || `Ошибка API (${error.response?.status || 'N/A'})`;
              setDetailsError(error.response ? `Не удалось загрузить детали: ${apiError}` : (error.request ? "Нет ответа от API деталей." : `Ошибка запроса деталей: ${error.message}`));
          } else { setDetailsError("Неизвестная ошибка при загрузке деталей."); }
      } finally { setIsDetailsLoading(false); }
    };
    fetchMovieDetails();
  }, [recommendedMovieId, baseApiUrl]);

  // ОБНОВЛЕННЫЙ Обработчик случайного выбора
   const handleRandomClick = async () => {
       console.log("Запрос случайных фильмов...");
       setIsRandomLoading(true);
       setRandomError(null);
       setRecommendedMovieId(null); setRecommendedMovieData(null);
       setRecError(null); setDetailsError(null);
       setSearchTerms(Array(movie_count).fill(""));
       setSelectedMovies(Array(movie_count).fill(null));
       setActiveInputIndex(null); setSuggestions([]);

       try {
           const randomMoviesResult = await getRandomMovies(movie_count);

           if (randomMoviesResult.length > 0) {
                const newSearchTerms: string[] = Array(movie_count).fill("");
                const newSelectedMovies: (MovieSuggestion | null)[] = Array(movie_count).fill(null);

                randomMoviesResult.forEach((movieData, i) => {
                    if (i < movie_count) { // Заполняем только нужное кол-во слотов
                        newSearchTerms[i] = movieData.title;
                        newSelectedMovies[i] = movieData;
                    }
                });

                setSearchTerms(newSearchTerms);
                setSelectedMovies(newSelectedMovies);

                if (randomMoviesResult.length < movie_count) {
                     setRandomError(`Предупреждение: Загружено ${randomMoviesResult.length} из ${movie_count} случайных фильмов.`);
                }
           } else {
               setRandomError("Не удалось получить случайные фильмы от API.");
           }
       } catch (error) {
            console.error("Неожиданная ошибка при обработке случайных фильмов:", error);
            setRandomError("Произошла ошибка при случайном подборе.");
       } finally {
           setIsRandomLoading(false);
       }
   };

   // Обработчики ошибок изображений
   const handleSuggestionImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => { console.warn("Ошибка постера подсказки."); e.currentTarget.src = placeholderImage; e.currentTarget.classList.add(styles.suggestion_image_error); };
   const handleHeaderImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => { console.warn("Ошибка постера заголовка."); e.currentTarget.src = placeholderImage; };

  // JSX разметка
  return (
    <div className={styles.main}>
      {/* Заголовок */}
      <h1 className={styles.title}>сколько фильмов скрещиваем?</h1>

      {/* Выбор попкорнов */}
       <div className={styles.popcorn_container}>
         {[1, 2, 3, 4, 5].map((count) => (
           <div
             key={count}
             className={`${styles.popcorn_wrapper} ${count <= selected_popcorns ? "" : styles.inactive} ${count === 1 ? styles.disabled : ""} ${(isRandomLoading || isRecLoading || isDetailsLoading) ? styles.disabled : ""}`}
             onClick={() => handle_popcorn_click(count)}
             title={count === 1 ? "Минимум 2 фильма" : `Скрестить ${count} фильма`}
           >
             <img src={count <= selected_popcorns ? "/Popcorn_active.png" : "/Popcorn_inactive.png"} alt={`${count} попкорна`} className={styles.popcorn_image} />
           </div>
         ))}
       </div>

      {/* Контейнер для ввода фильмов */}
      <div className={styles.movies_container}>
        {Array.from({ length: movie_count }).map((_, index) => {
          const currentSelectedMovie = selectedMovies[index];
          const headerPosterUrl = currentSelectedMovie?.poster_filename ? `${imageBasePath}${currentSelectedMovie.poster_filename}` : placeholderImage;
          const isLoadingAny = isRandomLoading || isRecLoading || isDetailsLoading;

          return (
            <React.Fragment key={index}>
              <div className={styles.movie_card}>
                <div className={styles.movie_content}>
                  {currentSelectedMovie ? ( <img src={headerPosterUrl} alt={currentSelectedMovie.title} className={styles.movie_content_poster} onError={handleHeaderImageError} loading="lazy" /> ) : ( `Фильм ${index + 1}` )}
                </div>
                <div className={styles.search_wrapper} ref={el => inputRefs.current[index] = el}>
                  <div className={styles.search_container}>
                    <input
                      type="text" placeholder="Название фильма..." className={styles.search_input}
                      value={searchTerms[index]} onChange={(e) => handleInputChange(index, e.target.value)}
                      onFocus={() => handleInputFocus(index)} onBlur={handleInputBlur}
                      autoComplete="off" disabled={isLoadingAny} aria-autocomplete="list"
                      aria-controls={`suggestions-list-${index}`} aria-expanded={activeInputIndex === index && (suggestions.length > 0 || isLoadingSuggestions)}
                    />
                  </div>
                   {activeInputIndex === index && !isLoadingAny && (suggestions.length > 0 || isLoadingSuggestions || (searchTerms[index] && !isLoadingSuggestions)) && (
                      <ul id={`suggestions-list-${index}`} className={styles.suggestions_list} role="listbox">
                          {isLoadingSuggestions && <li className={styles.suggestion_item_loading} role="option" aria-busy="true">Загрузка...</li>}
                          {!isLoadingSuggestions && suggestions.map((movie) => (
                              <li key={movie.movie_id} className={styles.suggestion_item} onMouseDown={() => handleSuggestionClick(index, movie)} role="option" tabIndex={-1}>
                                  <img src={movie.poster_filename ? `${imageBasePath}${movie.poster_filename}` : placeholderImage} alt="" aria-hidden="true" className={styles.suggestion_image} onError={handleSuggestionImageError} loading="lazy"/>
                                  <span className={styles.suggestion_text}>{movie.title} {movie.year ? `(${movie.year})` : ''}</span>
                              </li>
                          ))}
                           {!isLoadingSuggestions && suggestions.length === 0 && searchTerms[index] && <li className={styles.suggestion_item_no_results} role="option">Ничего не найдено</li>}
                      </ul>
                   )}
                </div>
              </div>
              {index < movie_count - 1 && ( <div className={styles.divider}><img className={styles.image_crossing} src="/crossing.png" alt="плюс" /></div> )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Кнопки действий */}
      <div className={styles.buttons_result}>
        <button
            className={styles.button_set} onClick={handleGetRecommendation}
            disabled={isRandomLoading || isRecLoading || isDetailsLoading || selectedMovies.slice(0, movie_count).some(movie => movie === null)} >
          {isRecLoading ? "Ищем ID..." : (isDetailsLoading ? "Загружаем..." : "подобрать фильмы")}
        </button>
        <button
            className={styles.button_random} onClick={handleRandomClick}
            disabled={isRandomLoading || isRecLoading || isDetailsLoading} title="Случайный подбор">
          {isRandomLoading ? (<div className={styles.spinner}></div>) : (<img className={styles.image_random} src="/Dice.png" alt="Случайно" />)}
        </button>
      </div>

       {/* Отображение ошибки случайного выбора */}
       {randomError && <p className={styles.errorMessage}>{randomError}</p>}

      {/* ОБЛАСТЬ ВЫВОДА РЕЗУЛЬТАТА (Детальная карточка) */}
      <div className={styles.resultDetailed}>
        {isRecLoading && <p className={styles.loadingMessage}>Ищем рекомендацию...</p>}
        {recError && !isRecLoading && <p className={styles.errorMessage}>{recError}</p>}
        {recommendedMovieId && !recError && !isRecLoading && (
          <>
            {isDetailsLoading && <p className={styles.loadingMessage}>Загружаем детали фильма...</p>}
            {detailsError && !isDetailsLoading && <p className={styles.errorMessage}>{detailsError}</p>}
            {recommendedMovieData && !isDetailsLoading && !detailsError && (<MovieDetailedResultCard movie={recommendedMovieData} />)}
          </>
        )}
      </div>
    </div>
  );
}