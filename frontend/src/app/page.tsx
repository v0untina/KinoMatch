// frontend/src/app/page.tsx
"use client";
import styles from './page.module.css'
import React, { useState, useEffect } from "react";
import EventsViewer from "@/widgets/EventsViewer/EventsViewer";
import MainLayout from "@/layouts/MainLayout/MainLayout";
import LeftBarLayout from "@/layouts/LeftBarLayout/LeftBarLayout";
import MovieRecommendationWidget from '@/widgets/MovieRecommendationWidget/MovieRecommendationWidget';

// API imports
import { getActors } from '@/api/actors';
import { getMovies } from '@/api/movies';
import { getGenres } from '@/api/genres';
import { getDirectors } from '@/api/directors';
import { getCountries } from '@/api/countries';

// Type imports
import type { Actor } from '@/types/actor.interface';
import type { Movie } from '@/types/movie.interface';
import type { Genre } from '@/types/genre.interface';
import type { Director } from '@/types/director.interface';
import type { Country } from '@/types/country.interface';

export default function Home() {
    // State for actors
    const [actors, setActors] = useState<Actor[]>([]);
    const [actorsLoading, setActorsLoading] = useState(true);
    const [actorsError, setActorsError] = useState<string | null>(null);

    // State for movies
    const [movies, setMovies] = useState<Movie[]>([]);
    const [moviesLoading, setMoviesLoading] = useState(true);
    const [moviesError, setMoviesError] = useState<string | null>(null);

    // State for genres
    const [genres, setGenres] = useState<Genre[]>([]);
    const [genresLoading, setGenresLoading] = useState(true);
    const [genresError, setGenresError] = useState<string | null>(null);

    // State for directors
    const [directors, setDirectors] = useState<Director[]>([]);
    const [directorsLoading, setDirectorsLoading] = useState(true);
    const [directorsError, setDirectorsError] = useState<string | null>(null);

    // State for countries
    const [countries, setCountries] = useState<Country[]>([]);
    const [countriesLoading, setCountriesLoading] = useState(true);
    const [countriesError, setCountriesError] = useState<string | null>(null);

    // Fetch actors
    useEffect(() => {
        const fetchActors = async () => {
            try {
                const actorsData = await getActors();
                setActors(actorsData);
            } catch (err: any) {
                setActorsError(err.message || 'An error occurred while fetching actors.');
            } finally {
                setActorsLoading(false);
            }
        };
        fetchActors();
    }, []);

    // Fetch movies
    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const moviesData = await getMovies();
                setMovies(moviesData);
            } catch (err: any) {
                setMoviesError(err.message || 'An error occurred while fetching movies.');
            } finally {
                setMoviesLoading(false);
            }
        };
        fetchMovies();
    }, []);

    // Fetch genres
    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const genresData = await getGenres();
                setGenres(genresData);
            } catch (err: any) {
                setGenresError(err.message || 'An error occurred while fetching genres.');
            } finally {
                setGenresLoading(false);
            }
        };
        fetchGenres();
    }, []);

    // Fetch directors
    useEffect(() => {
        const fetchDirectors = async () => {
            try {
                const directorsData = await getDirectors();
                setDirectors(directorsData);
            } catch (err: any) {
                setDirectorsError(err.message || 'An error occurred while fetching directors.');
            } finally {
                setDirectorsLoading(false);
            }
        };
        fetchDirectors();
    }, []);

    // Fetch countries
    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const countriesData = await getCountries();
                setCountries(countriesData);
            } catch (err: any) {
                setCountriesError(err.message || 'An error occurred while fetching countries.');
            } finally {
                setCountriesLoading(false);
            }
        };
        fetchCountries();
    }, []);


    return (
        <MainLayout>
            <LeftBarLayout>
                <div>
                    <h1>Главная страница KinoMatch</h1>
                    <p>Добро пожаловать в KinoMatch!</p>

                    <h2>Список актеров</h2>
                    {actorsLoading && <p>Загрузка актеров...</p>}
                    {actorsError && <p style={{ color: 'red' }}>Ошибка: {actorsError}</p>}
                    <ul>
                        {actors.map((actor) => (
                            <li key={actor.actor_id}>{actor.name}</li>
                        ))}
                    </ul>

                    <h2>Список фильмов</h2>
                    {moviesLoading && <p>Загрузка фильмов...</p>}
                    {moviesError && <p style={{ color: 'red' }}>Ошибка: {moviesError}</p>}
                    <ul>
                        {movies.map((movie) => (
                            <li key={movie.movie_id}>{movie.title}</li>
                        ))}
                    </ul>

                    <h2>Список жанров</h2>
                    {genresLoading && <p>Загрузка жанров...</p>}
                    {genresError && <p style={{ color: 'red' }}>Ошибка: {genresError}</p>}
                    <ul>
                        {genres.map((genre) => (
                            <li key={genre.genre_id}>{genre.name}</li>
                        ))}
                    </ul>

                    <h2>Список режиссеров</h2>
                    {directorsLoading && <p>Загрузка режиссеров...</p>}
                    {directorsError && <p style={{ color: 'red' }}>Ошибка: {directorsError}</p>}
                    <ul>
                        {directors.map((director) => (
                            <li key={director.director_id}>{director.name}</li>
                        ))}
                    </ul>

                    <h2>Список стран</h2>
                    {countriesLoading && <p>Загрузка стран...</p>}
                    {countriesError && <p style={{ color: 'red' }}>Ошибка: {countriesError}</p>}
                    <ul>
                        {countries.map((country) => (
                            <li key={country.country_id}>{country.name}</li>
                        ))}
                    </ul>

                    <MovieRecommendationWidget />
                    <EventsViewer />
                </div>
            </LeftBarLayout>
        </MainLayout>
    );
}