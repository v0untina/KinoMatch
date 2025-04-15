// frontend/src/widgets/AboutMovie/AboutMovie.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios"; // Используется для fetchMovieDetails
import styles from "./AboutMovie.module.css";
import useAuth from "@/hooks/useAuth"; // Хук для получения пользователя
import {
    getFavoriteMovies,
    addFavoriteMovie,
    removeFavoriteMovie,
} from "@/api/favorites"; // API функции для избранного
import toast from 'react-hot-toast'; // Для уведомлений

// --- Интерфейсы ---
interface Movie {
  movie_id: number;
  title: string;
  original_title: string | null;
  year: number | null;
  description: string | null;
  kinomatch_rating: number | null;
  imdb_rating: number | null;
  poster_filename: string | null;
  trailer_filename: string | null;
  country_id: number | null;
  movie_actors?: { actors: { actor_id: number; name: string; photo_filename: string | null; }; character_name: string | null; }[];
  movie_directors?: { directors: { director_id: number; name: string; photo_filename: string | null; }; }[];
  movie_genres?: { genres: { genre_id: number; name: string; }; }[];
  countries?: { country_id: number; name: string; };
}

// --- Компоненты StarRating и StarIcon ---
const StarRating = ({ rating }: { rating: number | null }) => {
    if (rating === null) return null;
    const numericRating = Number(rating); if (isNaN(numericRating)) return null;
    const fullStars = Math.floor(numericRating);
    const hasHalfStar = numericRating % 1 >= 0.3 && numericRating % 1 <= 0.7;
    const hasPartialStar = numericRating % 1 > 0.7;
    const emptyStars = 5 - fullStars - (hasHalfStar || hasPartialStar ? 1 : 0);
    return (<div className={styles.rating_container}> {[...Array(fullStars)].map((_, i) => (<StarIcon key={`full-${i}`} filled={true} />))} {hasHalfStar && <StarIcon key="half" filled="half" />} {hasPartialStar && <StarIcon key="partial" filled="partial" />} {[...Array(emptyStars)].map((_, i) => (<StarIcon key={`empty-${i}`} filled={false} />))} <span className={styles.rating_value}>{numericRating.toFixed(1)}</span> </div>);
};
const StarIcon = ({ filled }: { filled: boolean | "half" | "partial" }) => {
    const starColor = "rgba(0, 185, 174, 1)"; const emptyColor = "#E0E0E0"; const path = "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";
    if (filled === true) { return (<svg className={styles.star} viewBox="0 0 24 24" style={{ fill: starColor }}><path d={path}/></svg>); }
    else if (filled === "half") { return (<div className={styles.star_partial_container}><svg className={styles.star} viewBox="0 0 24 24" style={{ fill: starColor, clipPath: 'inset(0 50% 0 0)'}}><path d={path}/></svg><svg className={styles.star} viewBox="0 0 24 24" style={{ fill: emptyColor }}><path d={path}/></svg></div>); }
    else if (filled === "partial") { return (<div className={styles.star_partial_container}><svg className={styles.star} viewBox="0 0 24 24" style={{ fill: starColor, clipPath: 'inset(0 20% 0 0)'}}><path d={path}/></svg><svg className={styles.star} viewBox="0 0 24 24" style={{ fill: emptyColor }}><path d={path}/></svg></div>); }
    else { return (<svg className={styles.star} viewBox="0 0 24 24" style={{ fill: emptyColor }}><path d={path}/></svg>); }
};
// --- Конец StarRating и StarIcon ---


export default function AboutMovie() {
  const params = useParams();
  const router = useRouter();
  const movieIdParam = params?.id;
  // Парсим ID, убеждаемся что это число
  const movieId = movieIdParam && !isNaN(parseInt(Array.isArray(movieIdParam) ? movieIdParam[0] : movieIdParam, 10))
                  ? parseInt(Array.isArray(movieIdParam) ? movieIdParam[0] : movieIdParam, 10)
                  : null;

  // --- Состояния ---
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoadingMovie, setIsLoadingMovie] = useState(true);
  const [errorMovie, setErrorMovie] = useState<string | null>(null);

  // Получаем СТАБИЛЬНЫЕ значения из контекста благодаря useMemo в AuthProvider
  const { user, loading: authLoading } = useAuth() || { user: null, loading: true }; // Дефолтные значения
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteMovieIds, setFavoriteMovieIds] = useState<Set<number>>(new Set());
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(false); // Изначально false
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  // --- Загрузка деталей фильма ---
  useEffect(() => {
    // Проверяем корректность movieId
    if (!movieId) {
      setErrorMovie("Некорректный ID фильма");
      setIsLoadingMovie(false);
      return;
    }
    setIsLoadingMovie(true);
    setErrorMovie(null);
    const fetchMovieDetails = async () => {
      try {
        const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
        const response = await axios.get(`${baseURL}/movies/${movieId}`);
        setMovie(response.data);
      } catch (e: any) {
        console.error(`Ошибка при загрузке фильма ID ${movieId}:`, e);
        if (axios.isAxiosError(e) && e.response?.status === 404) {
          setErrorMovie("Фильм с таким ID не найден.");
        } else {
          setErrorMovie("Не удалось загрузить информацию о фильме.");
        }
      } finally {
        setIsLoadingMovie(false);
      }
    };
    fetchMovieDetails();
  }, [movieId]); // Зависимость только от movieId

  // --- Загрузка списка избранных фильмов пользователя ---
  // Убрали isFavoritesLoading из зависимостей useCallback
  const fetchFavorites = useCallback(async () => {
    // Проверки внутри функции
    if (!user || isFavoritesLoading) return;

    console.log("Fetching favorite movies for user:", user.user_id); // Debug log
    setIsFavoritesLoading(true);
    try {
        const favoriteRecords = await getFavoriteMovies();
        setFavoriteMovieIds(new Set(favoriteRecords.map(fav => fav.movie_id)));
        console.log("Favorite movie IDs loaded successfully."); // Debug log
    } catch (error) {
        console.error("Error fetching user favorites:", error);
        setFavoriteMovieIds(new Set()); // Очищаем в случае ошибки
    } finally {
        setIsFavoritesLoading(false);
    }
    // Функция теперь зависит только от user?.user_id (или user, если стабилен)
  }, [user?.user_id]); // Зависимость только от ID пользователя

  // useEffect, который вызывает fetchFavorites
  useEffect(() => {
    console.log("Favorites useEffect Check. AuthLoading:", authLoading, "User:", !!user); // Debug log
    // Используем СТАБИЛЬНЫЙ user из контекста
    if (!authLoading && user) {
        console.log("Auth ready and user exists, calling fetchFavorites."); // Debug log
        fetchFavorites(); // Вызываем мемоизированную функцию
    } else if (!authLoading && !user) {
        // Очищаем состояние, если пользователь вышел или не залогинен
        console.log("Auth ready but no user, clearing favorites state."); // Debug log
        setFavoriteMovieIds(new Set());
        setIsFavorite(false); // Сбрасываем статус для текущего фильма
    }
    // Зависимости: authLoading, СТАБИЛЬНЫЙ user, СТАБИЛЬНАЯ fetchFavorites
  }, [authLoading, user, fetchFavorites]);

  // --- Определение статуса isFavorite для текущего фильма ---
  useEffect(() => {
    if (movieId) {
      setIsFavorite(favoriteMovieIds.has(movieId));
    } else {
      setIsFavorite(false); // Сброс, если нет movieId
    }
  }, [favoriteMovieIds, movieId]);

  // --- Функция добавления/удаления из избранного ---
  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error("Нужно войти в аккаунт, чтобы добавлять в избранное.");
      router.push('/login');
      return;
    }
    if (!movieId) {
      toast.error("Ошибка: ID фильма не определен.");
      return;
    }
    if (isTogglingFavorite) return; // Защита от двойного клика

    setIsTogglingFavorite(true);
    const currentMovieId = movieId; // Сохраняем ID

    try {
      if (isFavorite) { // Удаляем
        await removeFavoriteMovie(currentMovieId);
        setFavoriteMovieIds(prevIds => { const newIds = new Set(prevIds); newIds.delete(currentMovieId); return newIds; });
        toast.success(`"${movie?.title}" удален из избранного`);
      } else { // Добавляем
        await addFavoriteMovie(currentMovieId);
        setFavoriteMovieIds(prevIds => { const newIds = new Set(prevIds); newIds.add(currentMovieId); return newIds; });
        toast.success(`"${movie?.title}" добавлен в избранное`);
      }
    } catch (error: any) {
      console.error("Error toggling favorite:", error);
      let message = isFavorite ? "Не удалось удалить из избранного." : "Не удалось добавить в избранное.";
      if (axios.isAxiosError(error) && error.response?.data?.message) message = error.response.data.message;
      toast.error(message);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  // --- Рендеринг ---
  // Показываем загрузку пока не завершится ЗАГРУЗКА ФИЛЬМА И проверка АУТЕНТИФИКАЦИИ
  if (isLoadingMovie || authLoading) return <div className={styles.loading}>Загрузка...</div>;
  // Показываем ошибку ЗАГРУЗКИ ФИЛЬМА
  if (errorMovie) return <div className={styles.error}>{errorMovie}</div>;
  // Показываем если фильм НЕ НАЙДЕН (даже если не было ошибки сети)
  if (!movie) return <div className={styles.error}>Фильм не найден</div>;

  // Кнопку избранного показываем только если пользователь авторизован
  const showFavoriteButton = !!user;

  return (
    <div className={styles.container}>
      {/* Колонка с постером и кнопками */}
      <div className={styles.poster_container}>
        <img
          src={movie.poster_filename ? `/posters/${movie.poster_filename}` : "/interface/defaultAvatar.webp"}
          alt={movie.title}
          className={styles.poster}
          onError={(e) => e.currentTarget.src = "/interface/defaultAvatar.webp"} // Обработка ошибки загрузки постера
        />
        <div className={styles.buttons_container}>
          <button className={styles.trailer_button}>смотреть трейлер</button>
          {/* Кнопка избранного */}
          {showFavoriteButton && (
             <button
                className={`${styles.favorites_button} ${isFavorite ? styles.favorite_active : ''}`}
                onClick={handleToggleFavorite}
                disabled={isTogglingFavorite || isFavoritesLoading} // Блокируем и при загрузке списка избранного
              >
                {/* Текст кнопки зависит от статуса загрузки и состояния избранного */}
                {isTogglingFavorite
                  ? 'Обработка...'
                  : isFavoritesLoading
                  ? 'Загрузка...'
                  : isFavorite
                  ? 'В избранном'
                  : 'Добавить в избранное'}
             </button>
          )}
          {/* Сообщение для неавторизованных пользователей */}
          {!user && (<p className={styles.login_prompt}>Войдите, чтобы добавить в избранное</p>)}
        </div>
      </div>

      {/* Колонка с информацией о фильме */}
      <div className={styles.info_container}>
        <h1 className={styles.title}>{movie.title} {movie.original_title ? `| ${movie.original_title}` : ''}</h1>

        {/* Meta: Рейтинги */}
        <div className={styles.meta}>
          {(movie.kinomatch_rating !== null && movie.kinomatch_rating !== undefined) && (
            <div className={styles.rating}> <StarRating rating={movie.kinomatch_rating} /> </div>
          )}
          {movie.imdb_rating && (
            <span className={styles.imdb_rating}><span className={styles.imdb_title}>IMDb</span> {Number(movie.imdb_rating).toFixed(1)}</span>
          )}
        </div>

        {/* Meta: Жанры и Страна */}
        {(movie.movie_genres?.length || movie.countries) && (
          <div className={styles.about_film}>
              {movie.movie_genres && movie.movie_genres.length > 0 && (
                <div className={styles.film_container}>
                  <img className={styles.image_anim} src="/Animation.png" alt="Жанры" />
                  <p className={styles.zhanr}>
                    {movie.movie_genres.map((mg, index) => ( <React.Fragment key={mg.genres.genre_id}>{mg.genres.name}{index < movie.movie_genres.length - 1 ? ', ' : ''}</React.Fragment> ))}
                  </p>
                </div>
              )}
              {movie.countries && (
                <div className={styles.film_container}>
                  <img className={styles.image_country} src="/Earth Globe.png" alt="Страна" />
                  <p className={styles.country}>{movie.countries.name}</p>
                </div>
              )}
          </div>
        )}

        {/* Описание */}
        {movie.description && (
          <div className={styles.description}>
            <p className={styles.description_title}>{movie.description}</p>
          </div>
        )}

        {/* Онлайн-кинотеатры (пример статики) */}
        <div className={styles.kinoteatrs}>
          <div className={styles.container_title}>
            <img className={styles.image_tv} src="/Retro TV.png" alt="" />
            <p className={styles.title_kino}>Онлайн-кинотеатры</p>
          </div>
          <div className={styles.images_kino}>
            <img className={styles.kino_image} src="/start.png" alt="" />
            <img className={styles.kino_image} src="/start.png" alt="" />
            <img className={styles.kino_image} src="/start.png" alt="" />
          </div>
        </div>

        {/* Актеры */}
        {movie.movie_actors && movie.movie_actors.length > 0 && (
          <div className={styles.actors}>
            <h3 className={styles.actors_title}>Актёры</h3>
            <div className={styles.people_list}>
              {movie.movie_actors.map((ma, index) => (
                <div key={ma.actors.actor_id} className={`${styles.person} ${styles.actor_enter}`} style={{ animationDelay: `${index * 0.3}s` }}>
                  <img
                    src={ma.actors.photo_filename ? `/actors/${ma.actors.photo_filename}` : "/interface/defaultAvatar.webp"}
                    alt={ma.actors.name}
                    className={styles.person_photo}
                    onError={(e) => e.currentTarget.src = "/interface/defaultAvatar.webp"} // Обработка ошибки фото актера
                  />
                  <div className={styles.person_info}>
                    <span className={styles.person_name}>{ma.actors.name}<br /></span>
                    {ma.character_name && (<span className={styles.character_name}>{ma.character_name}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Отзывы (пример статики) */}
        <div className={styles.review_container}>
          <h2 className={styles.review_title}>отзывы</h2>
          <div className={styles.reviews}>
            {/* TODO: Заменить на реальные отзывы */}
            <div className={styles.review}> <img className={styles.image_user} src="/User.png" alt="" /> <p className={styles.comment}>Приятно удивлена новым мультфильмом! <br /> Яркая анимация и забавные персонажи.</p> </div>
            <div className={styles.review}> <img className={styles.image_user} src="/User.png" alt="" /> <p className={styles.comment}>Рекомендую всем, кто хочет поднять настроение!</p> </div>
          </div>
        </div>
      </div>
    </div>
  );
}