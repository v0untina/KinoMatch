"use client";

import React, { useEffect, useState, useRef } from "react";
import styles from "./CrossingFilms.module.css";
import { Link } from "@nextui-org/react";
import axios from 'axios'; // Импортируем axios для запросов к API

interface Movie {
    movie_id: number;
    title: string;
    poster_filename: string | null; // poster_filename может быть null
}

export default function CrossingFilms() {
    const [isTitleVisible, setIsTitleVisible] = useState(false);
    const [areCardsVisible, setAreCardsVisible] = useState(false);
    const [isCrossingImageVisible, setIsCrossingImageVisible] = useState(false);
    const [isButtonVisible, setIsButtonVisible] = useState(false);
    const [movies, setMovies] = useState<Movie[]>([]); // Состояние для хранения фильмов из API

    const titleRef = useRef(null);
    const cardsRef = useRef(null);
    const crossingImageRef = useRef(null);
    const buttonRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    if (entry.target === titleRef.current) setIsTitleVisible(true);
                    if (entry.target === cardsRef.current) setAreCardsVisible(true);
                    if (entry.target === crossingImageRef.current) setIsCrossingImageVisible(true);
                    if (entry.target === buttonRef.current) setIsButtonVisible(true);
                }
            },
            { threshold: 0.5 }
        );

        observer.observe(titleRef.current);
        observer.observe(cardsRef.current);
        observer.observe(crossingImageRef.current);
        observer.observe(buttonRef.current);

        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        // Функция для загрузки фильмов с бэкенда
        const loadMovies = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/movies');
                setMovies(response.data.movies); // Сохраняем фильмы в состояние
            } catch (error) {
                console.error("Ошибка при загрузке фильмов:", error);
            }
        };

        loadMovies(); // Вызываем функцию загрузки фильмов при монтировании компонента
    }, []);

    return (
        <main className={styles.main}>
            <h2
                ref={titleRef}
                className={`${styles.title} ${isTitleVisible ? styles.fadeIn : ''}`}
            >
                скрестить фильмы
            </h2>
            <div className={styles.crossing_center}>
                <div
                    ref={cardsRef}
                    className={`${styles.crossing} ${areCardsVisible ? styles.fadeIn : ''}`}
                >
                    {movies.slice(0, 2).map((movie, index) => ( // Отображаем первые 2 фильма из массива movies
                        <div key={movie.movie_id} className={`${styles.crossing_card} ${areCardsVisible ? styles.cardAnimation : ''}`}>
                        {/* Отображаем постер фильма, если poster_filename есть */}
                        {movie.poster_filename && (
                            <img
                                className={styles.card_image}
                                src={`/${movie.poster_filename}`} // Путь к постеру формируем как / + poster_filename (относительно public)
                                alt={movie.title}
                            />
                        )}
                        {/* Отображаем название фильма под постером */}
                        <span className={styles.crossing_film_title}>{movie.title}</span>
                    </div>
                    ))}
                    <img
                        ref={crossingImageRef}
                        className={`${styles.crossing_image} ${isCrossingImageVisible ? styles.crossingImageAnimation : ''}`}
                        src="/interface/crossing.png"
                        alt=""
                    />
                    {movies.slice(2, 4).map((movie, index) => ( // Отображаем следующие 2 фильма
                         <div key={movie.movie_id} className={`${styles.crossing_card} ${areCardsVisible ? styles.cardAnimation : ''}`}>
                         {/* Отображаем постер фильма, если poster_filename есть */}
                         {movie.poster_filename && (
                             <img
                                 className={styles.card_image}
                                 src={`/${movie.poster_filename}`} // Путь к постеру формируем как / + poster_filename (относительно public)
                                 alt={movie.title}
                             />
                         )}
                         {/* Отображаем название фильма под постером */}
                         <span className={styles.crossing_film_title}>{movie.title}</span>
                     </div>
                    ))}
                </div>
            </div>
            <div
                ref={buttonRef}
                className={`${styles.loginlink} ${isButtonVisible ? styles.fadeIn : ''}`}
            >
                <Link href={'/login'}>
                    <button className={styles.loginbutton}>подобрать фильм</button>
                </Link>
            </div>
        </main>
    );
}