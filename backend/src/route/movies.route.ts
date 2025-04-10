// backend/src/route/movies.route.ts
import { Elysia, t } from 'elysia'; // Импортируем t для валидации
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Определим интерфейс для результата поиска (опционально, но улучшает читаемость)
interface MovieSearchResult {
    movie_id: number;
    title: string;
    year: number | null;
}

const MoviesRoute = new Elysia({ prefix: '/movies' }) // Добавляем префикс для организации роутов

    // 1. Получение списка всех фильмов (упрощенный вариант для общих списков)
    .get('/', async () => {
        try {
            const movies = await prisma.movies.findMany({
                select: {
                    movie_id: true,
                    title: true,
                    poster_filename: true,
                    year: true, // Добавим год для информативности
                },
                orderBy: { // Можно добавить сортировку по умолчанию
                    title: 'asc'
                }
            });
            return movies;
        } catch (error) {
            console.error("Ошибка при получении списка фильмов:", error);
            // В реальном приложении лучше логировать ошибку
            return new Response("Internal Server Error", { status: 500 });
        }
    })

    // 2. Получение детальной информации о фильме по ID (с валидацией)
    .get('/:id', async ({ params: { id } }) => {
        try {
            // ID уже будет числом благодаря валидации t.Numeric()
            const movie = await prisma.movies.findUnique({
                where: {
                    movie_id: id // Используем валидированный id
                },
                select: { // Используем только select для явного выбора полей
                    movie_id: true,
                    title: true,
                    original_title: true,
                    year: true,
                    description: true,
                    kinomatch_rating: true,
                    imdb_rating: true,
                    poster_filename: true,
                    trailer_filename: true,
                    movie_actors: {
                        select: {
                            character_name: true,
                            actors: {
                                select: {
                                    actor_id: true,
                                    name: true,
                                    photo_filename: true
                                }
                            }
                        }
                    },
                    movie_directors: {
                        select: {
                            directors: {
                                select: {
                                    director_id: true,
                                    name: true,
                                    photo_filename: true
                                }
                            }
                        }
                    },
                    movie_genres: {
                        select: {
                            genres: {
                                select: {
                                    genre_id: true,
                                    name: true
                                }
                            }
                        }
                    },
                    countries: {
                        select: {
                            country_id: true,
                            name: true
                        }
                    }
                    // Добавь сюда другие связи, если они нужны (например, movie_online_cinema, movie_reviews)
                    // movie_online_cinema: { ... },
                    // movie_reviews: { ... }
                },
            });

            if (!movie) {
                // Используем стандартный ответ Elysia для 404
                 return new Response("Movie not found", { status: 404 });
            }

            return movie;
        } catch (error) {
            console.error(`Ошибка при получении фильма по ID ${id}:`, error);
            return new Response("Internal Server Error", { status: 500 });
        }
    }, { // Валидация параметра ID
        params: t.Object({
            id: t.Numeric({ error: "ID фильма должен быть числом" }) // Проверяем, что ID - число
        })
    })

    // 3. ЭНДПОИНТ ДЛЯ ПОИСКА (АВТОДОПОЛНЕНИЯ)
    .get('/search', async ({ query }) => {
        const searchQuery = query.q; // Получаем параметр 'q' из запроса (?q=...)

        // Проверяем, что searchQuery - это непустая строка
        if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.trim().length < 1) {
             // Если запрос пустой или некорректный, возвращаем пустой массив
             // Не возвращаем ошибку, так как это ожидаемое поведение для пустого поиска
             return [];
        }

        try {
            // Ищем фильмы в базе данных
            const movies: MovieSearchResult[] = await prisma.movies.findMany({
                where: {
                    title: {
                        contains: searchQuery.trim(), // Ищем по частичному совпадению, убрав пробелы по краям
                        mode: 'insensitive', // Регистронезависимый поиск
                    },
                },
                select: { // Выбираем только необходимые поля для подсказок
                    movie_id: true,
                    title: true,
                    year: true,
                },
                take: 10, // Ограничиваем количество результатов (настрой по необходимости)
                orderBy: { // Сортируем для предсказуемости (например, по названию)
                    title: 'asc'
                }
            });
            return movies; // Возвращаем массив найденных фильмов
        } catch (error) {
            console.error("Ошибка при поиске фильмов:", error);
            // В случае ошибки базы данных возвращаем 500
            return new Response("Internal Server Error during search", { status: 500 });
        }
    }, { // Валидация query-параметра 'q'
        query: t.Object({
            q: t.Optional(t.String()) // 'q' - строка, но может отсутствовать
        })
    })


    // 4. Получение списка "новинок" (пример)
    .get('/new', async () => {
        try {
            const newMovies = await prisma.movies.findMany({
                take: 10, // Количество новинок
                orderBy: { movie_id: 'desc' }, // Сортируем по ID (предполагая, что новые имеют больший ID)
                select: {
                    movie_id: true,
                    title: true,
                    poster_filename: true,
                    year: true,
                },
            });
            return newMovies;
        } catch (error) {
            console.error("Ошибка при получении новинок:", error);
            return new Response("Internal Server Error", { status: 500 });
        }
    })

    // 5. Получение списка "топ рейтинга" (пример по Kinomatch рейтингу)
    .get('/top_rated', async () => {
        try {
            const topRatedMovies = await prisma.movies.findMany({
                take: 10, // Количество фильмов в топе
                orderBy: { kinomatch_rating: 'desc' }, // Сортируем по рейтингу (по убыванию)
                where: {
                    kinomatch_rating: {
                        not: null // Исключаем фильмы без рейтинга
                    }
                },
                select: {
                    movie_id: true,
                    title: true,
                    poster_filename: true,
                    kinomatch_rating: true,
                    year: true,
                },
            });
            return topRatedMovies;
        } catch (error) {
            console.error("Ошибка при получении топа рейтинга:", error);
            return new Response("Internal Server Error", { status: 500 });
        }
    });
    // Добавь здесь другие эндпоинты, связанные с фильмами, если нужно

export default MoviesRoute;