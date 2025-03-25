// backend/src/route/movies.route.ts (ПОЛНЫЙ РАБОЧИЙ КОД ELYSIA ROUTING)
import { Elysia } from 'elysia';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MoviesRoute = new Elysia()
    // 1. Получение списка всех фильмов
    .get('/movies', async () => {
        try {
            const movies = await prisma.movies.findMany({
                select: {
                    movie_id: true,
                    title: true,
                    poster_filename: true,
                },
            });
            return movies;
        } catch (error) {
            console.error("Ошибка при получении списка фильмов:", error);
            return new Response("Internal Server Error", { status: 500 });
        }
    })
    // 2. Получение информации о фильме по ID
    .get('/movies/:id', async ({ params: { id } }) => {
        try {
            const movieId = parseInt(id);
            const movie = await prisma.movies.findUnique({
                where: {
                    movie_id: movieId // !!! ИСПРАВЛЕНО: Добавлен movie_id в where clause !!!
                },
                select: {
                    movie_id: true,
                    title: true,
                    original_title: true,
                    year: true,
                    description: true,
                    kinomatch_rating: true,
                    imdb_rating: true,
                    poster_filename: true,
                    trailer_filename: true,
                },
            });

            if (!movie) {
                return new Response("Movie not found", { status: 404 });
            }

            return movie;
        } catch (error) {
            console.error("Ошибка при получении фильма по ID:", error);
            return new Response("Internal Server Error", { status: 500 });
        }
    })
    // 3. Получение списка "новинок" (последние добавленные фильмы - логика может быть изменена)
    .get('/movies/new', async () => {
        try {
            const newMovies = await prisma.movies.findMany({
                take: 10, // Например, 10 новинок
                orderBy: { movie_id: 'desc' }, // Сортировка по ID в обратном порядке (последние добавленные)
                select: {
                    movie_id: true,
                    title: true,
                    poster_filename: true,
                },
            });
            return newMovies;
        } catch (error) {
            console.error("Ошибка при получении новинок:", error);
            return new Response("Internal Server Error", { status: 500 });
        }
    })
    // 4. Получение списка "топ рейтинга" (фильмы с высоким kinomatch_rating - логика может быть изменена)
    .get('/movies/top_rated', async () => {
        try {
            const topRatedMovies = await prisma.movies.findMany({
                take: 10, // Например, 10 фильмов в топе
                orderBy: { kinomatch_rating: 'desc' }, // Сортировка по kinomatch_rating (по убыванию)
                where: { kinomatch_rating: { not: null } }, // Исключаем фильмы без рейтинга
                select: {
                    movie_id: true,
                    title: true,
                    poster_filename: true,
                    kinomatch_rating: true,
                },
            });
            return topRatedMovies;
        } catch (error) {
            console.error("Ошибка при получении топа рейтинга:", error);
            return new Response("Internal Server Error", { status: 500 });
        }
    });

export default MoviesRoute;