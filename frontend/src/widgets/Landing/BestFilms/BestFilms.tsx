// frontend/src/widgets/Landing/BestFilms/BestFilms.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./BestFilms.module.css";
import axios from "axios";
import Link from "next/link";

interface Movie {
  movie_id: number;
  title: string;
  poster_filename: string | null;
}

export default function BestFilms() {
  const [newMovies, setNewMovies] = useState<Movie[]>([]);
  const [bestMovies, setBestMovies] = useState<Movie[]>([]);
  const [isLoadingNew, setIsLoadingNew] = useState(true);
  const [isLoadingBest, setIsLoadingBest] = useState(true);
  const [errorNew, setErrorNew] = useState<string | null>(null);
  const [errorBest, setErrorBest] = useState<string | null>(null);
  const [isNewFilmsVisible, setIsNewFilmsVisible] = useState(false);
  const [isBestFilmsVisible, setIsBestFilmsVisible] = useState(false);
  const [newMoviesIndex, setNewMoviesIndex] = useState(0);
  const [bestMoviesIndex, setBestMoviesIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(5); 

  const newFilmsRef = useRef<HTMLDivElement>(null);
  const bestFilmsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const calculateVisibleCount = () => {
    if (!containerRef.current) return 5;
    
    const containerWidth = containerRef.current.offsetWidth;
    const cardWidth = 220; 
    const padding = 60; 
    
    const availableWidth = containerWidth - padding;
    const count = Math.floor(availableWidth / cardWidth);
    
    return Math.max(3, Math.min(count, 12));
  };

  useEffect(() => {
    const handleResize = () => {
      setVisibleCount(calculateVisibleCount());
    };

    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const observerNewFilms = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNewFilmsVisible(true);
        }
      },
      { threshold: 0.5 }
    );
    const observerBestFilms = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsBestFilmsVisible(true);
        }
      },
      { threshold: 0.5 }
    );
    
    if (newFilmsRef.current) {
      observerNewFilms.observe(newFilmsRef.current);
    }

    if (bestFilmsRef.current) {
      observerBestFilms.observe(bestFilmsRef.current);
    }

    return () => {
      if (newFilmsRef.current) {
        observerNewFilms.unobserve(newFilmsRef.current);
      }
      if (bestFilmsRef.current) {
        observerBestFilms.unobserve(bestFilmsRef.current);
      }
    };
  }, []);

  const fetchMovies = async (url: string, setMovies: (movies: Movie[]) => void, setIsLoading: (loading: boolean) => void, setError: (error: string | null) => void) => {
    setIsLoading(true);
    setError(null);
    try {
      const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await axios.get(`${baseURL}/movies${url}`);
      setMovies(response.data);
    } catch (e: any) {
      console.error("Ошибка при загрузке фильмов:", e);
      setError("Не удалось загрузить фильмы. Попробуйте позже.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies("/new", setNewMovies, setIsLoadingNew, setErrorNew);
    fetchMovies("/top_rated", setBestMovies, setIsLoadingBest, setErrorBest);
  }, []);

  const handleNextNew = () => {
    if (newMovies.length === 0) return; // Защита от пустого массива
    // Вычисляем новый индекс с учетом visibleCount и зацикливанием
    setNewMoviesIndex(prev => (prev + visibleCount) % newMovies.length);
  };
  
  const handleNextBest = () => {
    if (bestMovies.length === 0) return; // Защита от пустого массива
    // Вычисляем новый индекс с учетом visibleCount и зацикливанием
    setBestMoviesIndex(prev => (prev + visibleCount) % bestMovies.length);
  };
  

  const getVisibleMovies = (movies: Movie[], currentIndex: number) => {
    const endIndex = currentIndex + visibleCount;
    if (endIndex <= movies.length) {
      return movies.slice(currentIndex, endIndex);
    } else {
      return [...movies.slice(currentIndex), ...movies.slice(0, endIndex - movies.length)];
    }
  };

  return (
    <main className={styles.main} ref={containerRef}>
      <div className={styles.container_new_films} ref={newFilmsRef}>
        <h2 className={`${styles.subtitle} ${isNewFilmsVisible ? styles.fadeIn : ''}`}>
          популярные новинки
        </h2>
        {isLoadingNew && <p>Загрузка новинок...</p>}
        {errorNew && <p className={styles.error}>{errorNew}</p>}
        <div className={`${styles.new_films} ${isNewFilmsVisible ? styles.slideUp : ''}`}>
          {!isLoadingNew && !errorNew && getVisibleMovies(newMovies, newMoviesIndex).map((movie) => (
            <Link href={`/films/${movie.movie_id}`} key={movie.movie_id} className={styles.card_film}>
              <img
                className={styles.image}
                src={movie.poster_filename ? `/posters/${movie.poster_filename}` : "/interface/defaultAvatar.webp"}
                alt={movie.title}
              />
              <span className={styles.film_title}>{movie.title}</span>
            </Link>
          ))}
          <button className={styles.button_next} onClick={handleNextNew}><img className={styles.next_button_image} src="/next.png" alt="" /></button>
        </div>
      </div>

      <div className={styles.best_films} ref={bestFilmsRef}>
        <h2 className={`${styles.subtitle} ${isBestFilmsVisible ? styles.fadeIn : ''}`}>
          топ рейтинга
        </h2>
        {isLoadingBest && <p>Загрузка топа рейтинга...</p>}
        {errorBest && <p className={styles.error}>{errorBest}</p>}
        <div className={`${styles.new_films} ${isBestFilmsVisible ? styles.slideUp : ''}`}>
          {!isLoadingBest && !errorBest && getVisibleMovies(bestMovies, bestMoviesIndex).map((movie) => (
            <Link href={`/films/${movie.movie_id}`} key={movie.movie_id} className={styles.card_film}>
              <img
                className={styles.image_f}
                src={movie.poster_filename ? `/posters/${movie.poster_filename}` : "/interface/defaultAvatar.webp"}
                alt={movie.title}
              />
              <span className={styles.film_title}>{movie.title}</span>
            </Link>
          ))}
          <button className={styles.button_next} onClick={handleNextBest}><img className={styles.next_button_image} src="/next.png" alt="" /></button>
        </div>
      </div>
    </main>
  );
}