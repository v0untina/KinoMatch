"use client";

import bestFilmsStyles from '@/widgets/Landing/BestFilms/BestFilms.module.css';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getCompilationById } from '@/api/compilations';
import styles from './compilationPage.module.css';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';


interface Movie {
    movie_id: number;
    title: string;
    poster_filename?: string; // Имя файла постера
}

interface CompilationDetails {
    collection_id: number;
    title: string;
    movies: Movie[]; // Массив фильмов
}

function MovieCard({ movie }: { movie: Movie }) {
    return (
        <Link href={`/films/${movie.movie_id}`} className={styles.movieCard}> {}
            {movie.poster_filename && (
                <img
                src={`/posters/${movie.poster_filename}`}
                alt={movie.title}
                className={`${styles.moviePoster} ${bestFilmsStyles.image}`}
            />
            )}
            <h3 className={styles.movieTitle}>{movie.title}</h3>
        </Link>
    );
}

export default function CompilationPage() {
    const params = useParams();
    const id = params?.id;

    const [compilation, setCompilation] = useState<CompilationDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            const fetchCompilation = async () => {
                setLoading(true);
                setError(null);
                try {
                    const compilationId = parseInt(Array.isArray(id) ? id[0] : id, 10);
                    if (isNaN(compilationId)) {
                        throw new Error("Неверный ID подборки");
                    }
                    const data = await getCompilationById(compilationId);
                    setCompilation(data);
                } catch (e: any) {
                    setError(e.message || "Ошибка загрузки подборки");
                } finally {
                    setLoading(false);
                }
            };
            fetchCompilation();
        } else {
            setError("ID подборки не найден");
            setLoading(false);
        }
    }, [id]);

    return (
        <>
        <Header/>
        <div className={styles.container}>
            {loading && <p className={styles.message}>Загрузка данных подборки...</p>}
            {error && <p className={styles.message}>Ошибка: {error}</p>}
            {!loading && !error && !compilation && <p className={styles.message}>Подборка не найдена.</p>}

            {compilation && (
                <>
                    <h1 className={styles.title}>{compilation.title}</h1>
                    {compilation.movies.length > 0 ? (
                        <div className={styles.movieGrid}>
                            {compilation.movies.map(movie => (
                                <MovieCard key={movie.movie_id} movie={movie} />
                            ))}
                        </div>
                    ) : (
                        <p className={styles.message}>В этой подборке пока нет фильмов.</p>
                    )}
                </>
            )}
        </div>
        <Footer/>
        </>
    );
}