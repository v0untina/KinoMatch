// backend/src/route/movies.route.ts
import { Elysia, t } from 'elysia';
import { Prisma, PrismaClient } from '@prisma/client'; // Импортируем Prisma для Raw SQL

// Инициализация Prisma Client (убедитесь, что она происходит правильно в вашем проекте)
const prisma = new PrismaClient();

// Интерфейс для результата поиска и случайных фильмов
interface MovieSearchResult {
    movie_id: number;
    title: string;
    year: number | null;
    poster_filename: string | null;
}

// (Важно: Убедитесь, что у вас глобально настроена обработка ошибок Elysia или добавьте ее)

const MoviesRoute = new Elysia({ prefix: '/movies' })

    // 1. Получение списка всех фильмов
    .get('/', async ({ set }) => {
        try {
            const movies = await prisma.movies.findMany({
                select: { movie_id: true, title: true, poster_filename: true, year: true },
                orderBy: { title: 'asc' }
            });
            return movies;
        } catch (error) {
            console.error("Ошибка при получении списка фильмов:", error);
            set.status = 500;
            return { success: false, error: "Internal Server Error" };
        }
    })

    // 2. Получение детальной информации о фильме по ID
    .get('/:id', async ({ params: { id }, set }) => {
        try {
            const movie = await prisma.movies.findUnique({
                where: { movie_id: id },
                select: { // Ваш существующий select
                    movie_id: true, title: true, original_title: true, year: true,
                    description: true, kinomatch_rating: true, imdb_rating: true,
                    poster_filename: true, trailer_filename: true,
                    movie_actors: {
                        select: { character_name: true, actors: { select: { actor_id: true, name: true, photo_filename: true } } }
                    },
                    movie_directors: {
                        select: { directors: { select: { director_id: true, name: true, photo_filename: true } } }
                    },
                    movie_genres: {
                        select: { genres: { select: { genre_id: true, name: true } } }
                    },
                    countries: { select: { country_id: true, name: true } }
                    // Добавьте другие связи, если они нужны
                },
            });

            if (!movie) {
                 set.status = 404;
                 return { success: false, error: "Movie not found" };
            }
            // Преобразуем Decimal в number для JSON (если нужно)
            if (movie.kinomatch_rating) movie.kinomatch_rating = Number(movie.kinomatch_rating);
            if (movie.imdb_rating) movie.imdb_rating = Number(movie.imdb_rating);

            return movie; // Elysia автоматически вернет JSON
        } catch (error) {
            console.error(`Ошибка при получении фильма по ID ${id}:`, error);
            set.status = 500;
            return { success: false, error: "Internal Server Error" };
        }
    }, {
        params: t.Object({
            id: t.Numeric({ error: "ID фильма должен быть числом" })
        })
    })

    // 3. ЭНДПОИНТ ДЛЯ ПОИСКА (АВТОДОПОЛНЕНИЯ)
    .get('/search', async ({ query, set }) => {
        const searchQuery = query.q;
        if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.trim().length < 1) {
             return []; // Возвращаем пустой массив, а не ошибку
        }
        try {
            const movies: MovieSearchResult[] = await prisma.movies.findMany({
                where: {
                    title: { contains: searchQuery.trim(), mode: 'insensitive' },
                },
                select: { movie_id: true, title: true, year: true, poster_filename: true },
                take: 10,
                orderBy: { title: 'asc' }
            });
            return movies;
        } catch (error) {
            console.error("Ошибка при поиске фильмов:", error);
            set.status = 500;
            return { success: false, error: "Internal Server Error during search" };
        }
    }, {
        query: t.Object({
            q: t.Optional(t.String())
        })
    })


    // --- ИЗМЕНЕНИЕ: Маршрут /new (новинки) ---
    .get('/new', async ({ set }) => {
        try {
            const newMovies = await prisma.movies.findMany({
                take: 20, // Можно взять чуть больше, если нужно на фронте
                // Сортируем по году выхода (убывание), фильмы без года - в конце
                orderBy: [
                    { year: { sort: 'desc', nulls: 'last' } },
                    // Дополнительная сортировка по ID для стабильности, если годы совпадают
                    { movie_id: 'desc' }
                ],
                select: { movie_id: true, title: true, poster_filename: true, year: true },
            });
            return newMovies;
        } catch (error) {
            console.error("Ошибка при получении новинок:", error);
             set.status = 500;
             return { success: false, error: "Internal Server Error" };
        }
    })

    // --- ИЗМЕНЕНИЕ: Маршрут /top_rated (топ рейтинга IMDb) ---
    .get('/top_rated', async ({ set }) => {
        try {
            const topRatedMovies = await prisma.movies.findMany({
                take: 20, // Можно взять чуть больше
                // Сортируем по IMDb рейтингу (убывание), фильмы без рейтинга - в конце
                orderBy: { imdb_rating: { sort: 'desc', nulls: 'last' } },
                // Убираем фильмы без IMDb рейтинга из выборки
                where: { imdb_rating: { not: null } },
                // Выбираем нужные поля, включая imdb_rating
                select: { movie_id: true, title: true, poster_filename: true, imdb_rating: true, year: true },
            });

            // Преобразование Decimal в number (если imdb_rating все еще Decimal)
            const resultsWithNumbers = topRatedMovies.map(movie => ({
                ...movie,
                // Теперь преобразуем imdb_rating
                imdb_rating: movie.imdb_rating ? Number(movie.imdb_rating) : null
            }));
            return resultsWithNumbers;
        } catch (error) {
            console.error("Ошибка при получении топа рейтинга IMDb:", error);
             set.status = 500;
             return { success: false, error: "Internal Server Error" };
        }
    })


    // 6. НОВЫЙ ЭНДПОИНТ ДЛЯ СЛУЧАЙНЫХ ФИЛЬМОВ
    .get('/random', async ({ query, set }) => {
        const count = query.count; // Валидация уже гарантирует, что это число >= 1

        try {
            // Используем $queryRaw для выполнения SQL-запроса с ORDER BY RANDOM()
            // Синтаксис может немного отличаться для других БД (MySQL: RAND())
            // Для PostgreSQL используем RANDOM()
            const randomMovies: MovieSearchResult[] = await prisma.$queryRaw(
                Prisma.sql`SELECT movie_id, title, year, poster_filename
                           FROM movies
                           ORDER BY RANDOM()
                           LIMIT ${count}`
            );

            // Если база данных вернула меньше фильмов, чем запрошено (например, их просто меньше)
            if (randomMovies.length < count) {
                 console.warn(`Запрошено ${count} случайных фильмов, но найдено только ${randomMovies.length}`);
            }

            // Если вообще ничего не найдено
             if (randomMovies.length === 0) {
                set.status = 404;
                return { success: false, error: "Не удалось найти случайные фильмы." };
            }

            return { success: true, movies: randomMovies };

        } catch (error: any) {
            console.error(`Ошибка при получении случайных фильмов (count=${count}):`, error);
            set.status = 500; // Internal Server Error
            return { success: false, error: "Внутренняя ошибка сервера при получении случайных фильмов." };
        }
    }, { // Валидация query-параметра 'count'
        query: t.Object({
            // t.Numeric() автоматически преобразует строку в число и валидирует
            count: t.Numeric({ minimum: 1, error: "Параметр 'count' должен быть числом больше 0." })
        })
    });

export default MoviesRoute;