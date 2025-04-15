// frontend/src/widgets/ProfileUser/ProfileUser.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./ProfileUser.module.css";
import { searchMovies, type MovieSuggestion } from "@/api/movies";
// API для подборок
import {
    createUserCompilation,
    getMyCompilations,
    type UserCompilationSummary
} from "@/api/compilations";
// API для избранного
import { getFavoriteMovies } from "@/api/favorites";
import { type Movie as FavoriteMovieData } from "@/api/favorites"; // Импортируем тип Movie как FavoriteMovieData

import axios from 'axios';
import useAuth from "@/hooks/useAuth";
import useDebounce from "@/hooks/useDebounce";
import Image from "next/image";
import Link from 'next/link';
// import toast from 'react-hot-toast'; // Раскомментируйте, если используете тосты

// --- Типы ---
type ActiveProfileTab = "saved" | "best_compilations" | "compilations" | "create_compilation";
interface SelectedMovie extends MovieSuggestion {} // Для формы создания подборки

// --- Константы ---
const PUBLIC_POSTER_PATH = '/posters/';
const PLACEHOLDER_POSTER = `${PUBLIC_POSTER_PATH}placeholder.jpg`; // Убедитесь, что файл существует

// --- Компонент-карточка для ПОДБОРКИ пользователя ---
interface UserCompilationCardProps { compilation: UserCompilationSummary; }
const UserCompilationCard: React.FC<UserCompilationCardProps> = ({ compilation }) => {
    const getPosterUrl = (filename: string | null): string => { if (!filename) return PLACEHOLDER_POSTER; return `${PUBLIC_POSTER_PATH}${filename}`; };
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => { e.currentTarget.src = PLACEHOLDER_POSTER; };
    function getMovieDeclension(count: number): string { const cases = [2, 0, 1, 1, 1, 2]; const titles = ['фильм', 'фильма', 'фильмов']; return titles[(count % 100 > 4 && count % 100 < 20) ? 2 : cases[Math.min(count % 10, 5)]]; }
    return ( <Link href={`/compilations/${compilation.id}`} className={styles.userCompilationCard} title={`Перейти к подборке "${compilation.title}"`}> <div className={styles.userCompilationPosters}> {compilation.previewPosters.slice(0, 4).map((poster, index) => (<div key={index} className={styles.userCompilationPosterWrapper}><Image src={getPosterUrl(poster)} alt="" fill sizes="(max-width: 768px) 25vw, 100px" style={{ objectFit: 'cover' }} className={styles.userCompilationPoster} onError={handleImageError} unoptimized/></div>))} {Array.from({ length: Math.max(0, 4 - compilation.previewPosters.length) }).map((_, index) => (<div key={`placeholder-${index}`} className={`${styles.userCompilationPosterWrapper} ${styles.placeholder}`}></div>))} </div> <div className={styles.userCompilationInfo}><h3 className={styles.userCompilationTitle}>{compilation.title}</h3><div className={styles.userCompilationMeta}><span>{compilation.movieCount} {getMovieDeclension(compilation.movieCount)}</span></div></div> </Link> );
};
// --- Конец UserCompilationCard ---

// --- Компонент-карточка для ИЗБРАННОГО фильма ---
interface FavoriteMovieCardProps { movie: FavoriteMovieData; }
const FavoriteMovieCard: React.FC<FavoriteMovieCardProps> = ({ movie }) => {
    const getPosterUrl = (filename: string | null): string => { if (!filename) return PLACEHOLDER_POSTER; return `${PUBLIC_POSTER_PATH}${filename}`; };
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => { e.currentTarget.src = PLACEHOLDER_POSTER; };

    return (
        <Link href={`/films/${movie.movie_id}`} className={styles.favoriteMovieCard} title={`Перейти к фильму "${movie.title}"`}>
             <div className={styles.favoriteMoviePosterWrapper}>
                 <Image
                    src={getPosterUrl(movie.poster_filename ?? null)}
                    alt={movie.title}
                    fill
                    sizes="(max-width: 480px) 30vw, (max-width: 768px) 20vw, 150px"
                    style={{ objectFit: 'cover' }}
                    className={styles.favoriteMoviePoster}
                    onError={handleImageError}
                    unoptimized
                 />
             </div>
            <div className={styles.favoriteMovieInfo}>
                <h4 className={styles.favoriteMovieTitle}>{movie.title}</h4>
                {movie.year && <span className={styles.favoriteMovieYear}>{movie.year}</span>}
            </div>
        </Link>
    );
};
// --- Конец FavoriteMovieCard ---


export default function ProfileUser() {
  // --- Состояния ---
  const [activeTab, setActiveTab] = useState<ActiveProfileTab>("saved"); // Начинаем с избранного

  // Состояния формы создания подборки
  const [compilationName, setCompilationName] = useState('');
  const [movieSearchQuery, setMovieSearchQuery] = useState('');
  const [selectedMovies, setSelectedMovies] = useState<SelectedMovie[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  // Состояния поиска фильмов для формы
  const [searchResults, setSearchResults] = useState<MovieSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Состояния для подборок пользователя
  const [userCompilations, setUserCompilations] = useState<UserCompilationSummary[]>([]);
  const [isLoadingUserCompilations, setIsLoadingUserCompilations] = useState(false);
  const [userCompilationsError, setUserCompilationsError] = useState<string | null>(null);

  // Состояния для избранных фильмов
  const [favoriteMovies, setFavoriteMovies] = useState<FavoriteMovieData[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);

  // --- Рефы ---
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLUListElement>(null);
  const hasFetchedUserCompilations = useRef(false);
  const hasFetchedFavorites = useRef(false); // Флаг для избранного

  // --- Хуки ---
  const { user, loading: authLoading } = useAuth() || { user: null, loading: true }; // Дефолтные значения
  const debouncedSearchQuery = useDebounce(movieSearchQuery, 400);

  // --- Функции (локальные, т.к. специфичны для UI) ---
  const getPosterUrl = (filename: string | null): string => {
      if (!filename) return PLACEHOLDER_POSTER;
      return `${PUBLIC_POSTER_PATH}${filename}`;
  };
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      e.currentTarget.src = PLACEHOLDER_POSTER;
      console.warn("Ошибка загрузки изображения, используется заглушка.");
  };

  // --- Эффект поиска фильмов для формы ---
  useEffect(() => {
      const performSearch = async () => {
        if (!isSearchFocused || !debouncedSearchQuery.trim()) { setSearchResults([]); setIsSearching(false); return; }
        setIsSearching(true);
        try {
            const results = await searchMovies(debouncedSearchQuery);
            if (isSearchFocused && debouncedSearchQuery === movieSearchQuery) setSearchResults(results); else setSearchResults([]);
        } catch (error) { console.error("Ошибка поиска фильмов:", error); setSearchResults([]);
        } finally { if (isSearchFocused && debouncedSearchQuery === movieSearchQuery) setIsSearching(false); }
    };
    performSearch();
  }, [debouncedSearchQuery, isSearchFocused, movieSearchQuery]);

  // --- Эффект загрузки ПОДБОРОК пользователя ---
   useEffect(() => {
    if (activeTab === 'compilations' && user && !authLoading && (!hasFetchedUserCompilations.current || userCompilationsError)) {
        const fetchUserCompilations = async () => {
            setIsLoadingUserCompilations(true); setUserCompilationsError(null); hasFetchedUserCompilations.current = true;
            try { setUserCompilations(await getMyCompilations()); }
            catch (error: any) { console.error("Error fetching user compilations:", error); let message = "Ошибка загрузки подборок."; if (axios.isAxiosError(error) && error.response?.status === 401) message = "Войдите в систему."; else if (error instanceof Error) message = error.message; setUserCompilationsError(message); hasFetchedUserCompilations.current = false; }
            finally { setIsLoadingUserCompilations(false); }
        }; fetchUserCompilations();
    }
  }, [activeTab, user, authLoading, userCompilationsError]); // Обновленная зависимость

  // --- Эффект загрузки ИЗБРАННЫХ фильмов ---
  useEffect(() => {
    if (activeTab === 'saved' && user && !authLoading && (!hasFetchedFavorites.current || favoritesError)) {
        const fetchFavorites = async () => {
            setIsLoadingFavorites(true); setFavoritesError(null); hasFetchedFavorites.current = true; console.log("Fetching favorite movies in ProfileUser...");
            try {
                const favoriteRecords = await getFavoriteMovies();
                const moviesOnly = favoriteRecords.map(record => record.movies).filter(m => m != null);
                setFavoriteMovies(moviesOnly as FavoriteMovieData[]); console.log("Favorite movies fetched:", moviesOnly);
            } catch (error: any) {
                console.error("Error fetching favorite movies in ProfileUser:", error); let message = "Ошибка загрузки избранных."; if (axios.isAxiosError(error) && error.response?.status === 401) message = "Войдите в систему."; else if (error instanceof Error) message = error.message; setFavoritesError(message); hasFetchedFavorites.current = false;
            } finally { setIsLoadingFavorites(false); }
        }; fetchFavorites();
    }
  }, [activeTab, user, authLoading, favoritesError]);

  // --- Обработчики формы создания подборки ---
  const handleSearchFocus = () => setIsSearchFocused(true);
  const handleSearchBlur = () => { setTimeout(() => { if (document.activeElement !== searchInputRef.current && !searchResultsRef.current?.contains(document.activeElement)) setIsSearchFocused(false); }, 150); };
  const handleSelectMovie = (movieToAdd: MovieSuggestion) => { if (!selectedMovies.some(m => m.movie_id === movieToAdd.movie_id)) setSelectedMovies(prev => [...prev, movieToAdd]); setMovieSearchQuery(''); setSearchResults([]); setIsSearching(false); setIsSearchFocused(false); };
  const handleRemoveMovie = (movieIdToRemove: number) => { setSelectedMovies(prev => prev.filter(m => m.movie_id !== movieIdToRemove)); };
  const handlePublish = async () => {
      if (!compilationName || selectedMovies.length === 0 || isPublishing) return; setIsPublishing(true); const dataToSend = { title: compilationName, movieIds: selectedMovies.map(m => m.movie_id) };
      try {
          const response = await createUserCompilation(dataToSend); alert(`Подборка "${response.compilation.title}" создана!`); setCompilationName(''); setSelectedMovies([]); setMovieSearchQuery(''); hasFetchedUserCompilations.current = false; setActiveTab("compilations");
      } catch (error: any) { console.error("Failed to publish compilation:", error); let errorMessage = "Ошибка создания подборки."; if (axios.isAxiosError(error) && error.response) errorMessage = error.response.data?.message || errorMessage; else if (error instanceof Error) errorMessage = error.message; alert(`Ошибка: ${errorMessage}`);
      } finally { setIsPublishing(false); }
  };

  const showSearchResults = isSearchFocused && (isSearching || searchResults.length > 0 || (debouncedSearchQuery.trim() && !isSearching));

  // --- JSX Разметка ---
  return (
    <main className={styles.main}>
        {/* User Info */}
        <div className={styles.user_info}>
             <div className={styles.avatar_user_nick}>
                 <div className={styles.user_avatar}></div>
                 <div className={styles.container}>
                     {/* TODO: Подставить реальные данные */}
                     <p className={styles.username_profile}>{user?.username || 'USERNAME'}</p>
                     <p className={styles.user_rating}>Рейтинг <span className={styles.rating_count}>{user ? '128' : '0'}</span></p>
                 </div>
             </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
             <button className={`${styles.tab_button} ${activeTab === "saved" ? styles.active : ""}`} onClick={() => setActiveTab("saved")}>избранные фильмы</button>
             <button className={`${styles.tab_button} ${activeTab === "best_compilations" ? styles.active : ""}`} onClick={() => setActiveTab("best_compilations")}>избранные подборки</button>
             <button className={`${styles.tab_button} ${activeTab === "compilations" ? styles.active : ""}`} onClick={() => setActiveTab("compilations")}>ваши подборки</button>
             <button className={`${styles.tab_button} ${activeTab === "create_compilation" ? styles.active : ""}`} onClick={() => setActiveTab("create_compilation")}>создать подборку</button>
        </div>

      {/* Content Area */}
      <div className={styles.tab_content_area}>

        {/* --- Saved Films Tab --- */}
        {activeTab === "saved" && (
            <div className={styles.tab_content}>
                {authLoading && <p>Проверка авторизации...</p>}
                {!authLoading && !user && <p>Войдите в аккаунт, чтобы увидеть избранные фильмы.</p>}
                {user && isLoadingFavorites && <p>Загрузка избранных фильмов...</p>}
                {user && favoritesError && (
                    <div className={styles.errorMessage}>
                        <p>Ошибка: {favoritesError}</p>
                        <button onClick={() => { hasFetchedFavorites.current = false; setFavoritesError(null); }} className={styles.retryButton}>Повторить</button>
                    </div>
                )}
                {user && !isLoadingFavorites && !favoritesError && (
                    <>
                        {favoriteMovies.length === 0 ? (
                            <p>Вы еще не добавили ни одного фильма в избранное.</p>
                        ) : (
                            <div className={styles.favoriteMoviesGrid}>
                                {favoriteMovies.map(movie => (
                                    <FavoriteMovieCard key={movie.movie_id} movie={movie} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        )}

        {/* --- Saved Compilations Tab --- */}
        {activeTab === "best_compilations" && (
            <div className={styles.tab_content}><p>Здесь будут избранные подборки (функционал не реализован)</p></div>
        )}

        {/* --- User's Compilations Tab --- */}
        {activeTab === "compilations" && (
            <div className={styles.tab_content}>
                 {authLoading && <p>Проверка авторизации...</p>}
                 {!authLoading && !user && <p>Войдите в аккаунт, чтобы увидеть ваши подборки.</p>}
                 {user && isLoadingUserCompilations && <p>Загрузка ваших подборок...</p>}
                 {user && userCompilationsError && ( <div className={styles.errorMessage}><p>Ошибка: {userCompilationsError}</p><button onClick={() => { hasFetchedUserCompilations.current = false; setUserCompilationsError(null); }} className={styles.retryButton}>Повторить</button></div>)}
                 {user && !isLoadingUserCompilations && !userCompilationsError && ( <> {userCompilations.length === 0 ? ( <p>Вы пока не создали ни одной подборки. Перейдите во вкладку "Создать подборку".</p> ) : ( <div className={styles.userCompilationsGrid}> {userCompilations.map(comp => ( <UserCompilationCard key={comp.id} compilation={comp} /> ))} </div> )} </> )}
            </div>
        )}

        {/* --- Create Compilation Tab --- */}
        {activeTab === "create_compilation" && (
             <div className={`${styles.tab_content} ${styles.create_compilation_container}`}>
                <div className={styles.create_compilation_form}>
                    <h2 className={styles.create_title}>СОЗДАНИЕ ПОДБОРКИ</h2>
                    {/* Compilation Name Input */}
                    <div className={styles.input_group}> <label htmlFor="compilationName">ВВЕДИТЕ НАЗВАНИЕ ПОДБОРКИ</label> <input type="text" id="compilationName" className={styles.input_field} value={compilationName} onChange={(e) => setCompilationName(e.target.value)} placeholder="Название вашей подборки..." disabled={isPublishing} /> </div>
                    {/* Movie Search Input & Results */}
                    <div className={`${styles.input_group} ${styles.search_container_relative}`}> <label htmlFor="movieName">ВВЕДИТЕ НАЗВАНИЕ ФИЛЬМА</label> <input ref={searchInputRef} type="text" id="movieName" className={styles.input_field} value={movieSearchQuery} onChange={(e) => setMovieSearchQuery(e.target.value)} onFocus={handleSearchFocus} onBlur={handleSearchBlur} placeholder="Начните вводить название..." autoComplete="off" aria-autocomplete="list" aria-controls="movie-search-results" aria-expanded={showSearchResults} disabled={isPublishing} /> {showSearchResults && !isPublishing && ( <ul ref={searchResultsRef} id="movie-search-results" className={styles.suggestions_list} role="listbox"> {isSearching && <li className={styles.suggestion_item_loading} role="option" aria-busy="true">Загрузка...</li>} {!isSearching && searchResults.length > 0 && (searchResults.map(movie => (<li key={movie.movie_id} className={styles.suggestion_item} onMouseDown={() => handleSelectMovie(movie)} role="option" aria-selected="false" tabIndex={-1}> <Image src={getPosterUrl(movie.poster_filename)} alt="" aria-hidden="true" width={40} height={60} className={styles.suggestion_image} onError={handleImageError} unoptimized /> <span className={styles.suggestion_text}>{movie.title}</span> {movie.year && <span className={styles.suggestion_year}>({movie.year})</span>} </li>)))} {!isSearching && searchResults.length === 0 && debouncedSearchQuery.trim() && (<li className={styles.suggestion_item_no_results} role="option">Ничего не найдено</li>)} </ul> )} </div>
                    {/* Selected Movies Display */}
                    <div className={`${styles.selected_movies} ${isPublishing ? styles.disabled_overlay : ''}`}> {selectedMovies.length > 0 ? (selectedMovies.map(movie => (<div key={movie.movie_id} className={styles.movie_card_small}> <button onClick={() => handleRemoveMovie(movie.movie_id)} className={styles.remove_movie_button} title="Удалить фильм" disabled={isPublishing}>×</button> <Image src={getPosterUrl(movie.poster_filename)} alt={movie.title} width={130} height={180} style={{ objectFit: 'cover' }} className={styles.movie_card_poster} onError={handleImageError} unoptimized /> <p title={movie.title}>{movie.title}</p> </div>))) : (<p className={styles.no_movies_placeholder}>Добавьте фильмы в подборку, используя поиск выше</p>)} </div>
                    {/* Publish Button */}
                    <button className={styles.publish_button} onClick={handlePublish} disabled={!compilationName || selectedMovies.length === 0 || isPublishing}> {isPublishing ? 'Публикация...' : 'ОПУБЛИКОВАТЬ'} </button>
                </div>
             </div>
        )}
      </div>
    </main>
  );
}