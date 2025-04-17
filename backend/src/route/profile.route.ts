// backend/src/route/profile.route.ts
import { Elysia, t } from 'elysia';
import { DefaultResponseDto, OffsetLengthQueryDto } from "../dto/Response.dto.ts"; // Убедись, что пути верны
import { UserProvider } from "../providers/user.provider.ts"; // Убедись, что пути верны
import prisma from "../util/prisma.ts"; // Убедись, что пути верны
// Убери @elysiajs/jwt, если используешь checkAuth из middleware
// import { jwt } from '@elysiajs/jwt';
import { checkAuth } from '../middleware/authentication.middleware.ts'; // Импортируем checkAuth
import { MovieIdParamsDto } from '../dto/Movie.dto.ts'; // Убедись, что пути верны

// Определяем тип для хранилища Elysia, чтобы знать про userId
interface AuthStore {
    userId?: number;
    [key: string]: any; // Для совместимости
}

// Тип для фильма (упрощенный, можно вынести)
const MovieSchema = t.Object({
    movie_id: t.Number(),
    title: t.String(),
    original_title: t.Nullable(t.String()),
    year: t.Nullable(t.Number()),
    poster_filename: t.Nullable(t.String()),
    // Добавь другие поля, если нужно
});

// Тип для записи из user_movie_favorites
const FavoriteMovieRecordSchema = t.Object({
    user_id: t.Number(),
    movie_id: t.Number(),
    added_at: t.Nullable(t.Date()), // Используем t.Date(), если Prisma возвращает Date
    movies: MovieSchema // Используем схему для фильма
});


const profileRoutes = new Elysia({ prefix: '/profile', detail: { tags: ['Profile'] } });

// --- Получение своего профиля (ИСПРАВЛЕНО) ---
profileRoutes.get('/', async (ctx) => {
    const authorization = ctx.headers.authorization;
    if (!authorization) {
        ctx.set.status = 401; return { success: false, message: 'Unauthorized' };
    }

    try {
        // Проверяем токен (убедись, что ctx.jwt доступен - настроен через app.use(jwt(...)))
        const verification = await ctx.jwt.verify(authorization);
        if (!verification || typeof verification.userId !== 'number') { // Добавил проверку типа userId
            ctx.set.status = 401; return { success: false, message: 'Invalid or missing token payload' };
        }

        const { userId } = verification;

        // Получаем данные пользователя
        // UserProvider.getByID УЖЕ должен возвращать rating, т.к. нет select в провайдере
        const userData = await UserProvider.getByID(userId);
        if (!userData) {
            ctx.set.status = 404; return { success: false, message: 'User not found' };
        }

        ctx.set.status = 200;
        // Возвращаем данные, ВКЛЮЧАЯ рейтинг
        return {
            success: true,
            data: {
                user_id: userData.user_id,
                username: userData.username,
                email: userData.email,
                rating: userData.rating ?? 0, // <-- ДОБАВЛЕНО: Возвращаем рейтинг (или 0, если null)
                // Добавь другие поля, если нужно (например, аватар)
            }
        };
    } catch (error: any) {
         // Обработка ошибок верификации JWT или других ошибок
         console.error("Error verifying token or fetching profile:", error);
         if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
             ctx.set.status = 401;
             return { success: false, message: 'Invalid or expired token' };
         }
         ctx.set.status = 500;
         return { success: false, message: 'Internal server error' };
    }
}, {
    // Обновляем схему ответа, добавляя rating
    response: {
        200: t.Object({
            success: t.Boolean(),
            data: t.Object({
                user_id: t.Number(),
                username: t.String(),
                email: t.String(),
                rating: t.Number() // <-- ДОБАВЛЕНО: Указываем, что rating будет числом
            })
        }),
        401: t.Object({ success: t.Boolean(), message: t.String() }),
        404: t.Object({ success: t.Boolean(), message: t.String() }),
        500: t.Object({ success: t.Boolean(), message: t.String() })
    }
});


// --- Получение списка избранного ---
profileRoutes.get('/favorites', async (ctx) => {
    const userId = (ctx.store as AuthStore).userId; // Получаем из store
    if (!userId) {
        // Эта проверка на случай, если checkAuth не отработал как надо
        ctx.set.status = 401; return { success: false, message: "Unauthorized" };
    }

    try {
        // Пагинация
        const length = parseInt(ctx.query.length || "1000"); // Увеличил дефолт
        const offset = parseInt(ctx.query.offset || "0");

        const favoritesData = await prisma.user_movie_favorites.findMany({
            where: { user_id: userId }, // Используем userId из store
            include: { movies: true }, // Включаем данные о фильмах
            take: length,
            skip: offset
        });

        // !!! ИСПРАВЛЕНИЕ: Устанавливаем статус и возвращаем только тело !!!
        ctx.set.status = 200;
        return {
            success: true,
            pagination: { length, offset },
            data: favoritesData // Возвращаем данные об избранном
        };
    } catch (e) {
        console.error("Error fetching favorites:", e);
        ctx.set.status = 500; // Внутренняя ошибка сервера
        return { success: false, message: "Произошла ошибка при получении избранного" };
    }
}, {
    // Применяем middleware аутентификации
    beforeHandle: [checkAuth],
    query: OffsetLengthQueryDto,
    response: {
        // Используем более точную схему для data
        200: t.Object({
            success: t.Boolean(),
            data: t.Array(FavoriteMovieRecordSchema), // Уточнили схему
            pagination: t.Object({ length: t.Number(), offset: t.Number() })
        }),
        401: t.Object({ success: t.Boolean(), message: t.String() }),
        500: t.Object({ success: t.Boolean(), message: t.String() })
        // Убрали 404, т.к. пустой список - не ошибка
    }
});


// --- Добавление фильма в избранное ---
profileRoutes.post('/favorites/:movieId', async (ctx) => {
    const userId = (ctx.store as AuthStore).userId;
    if (!userId) {
        ctx.set.status = 401; return { success: false, message: "Unauthorized" };
    }
    const movieId = parseInt(ctx.params.movieId); // Получаем и парсим ID фильма

    try {
        // Проверяем, существует ли фильм (опционально, но хорошо бы)
        const movieExists = await prisma.movies.findUnique({ where: { movie_id: movieId } });
        if (!movieExists) {
             ctx.set.status = 404;
             return { success: false, message: "Фильм с таким ID не найден." };
        }

        // Создаем запись в избранном
        await prisma.user_movie_favorites.create({
            data: { user_id: userId, movie_id: movieId }
        });

        // !!! ИСПРАВЛЕНИЕ: Устанавливаем статус и возвращаем только тело !!!
        ctx.set.status = 201; // 201 Created
        return { success: true, message: "Фильм добавлен в избранное" };
    } catch (e: any) {
        console.error("Error adding favorite:", e);
        // Обработка ошибки уникальности (если уже добавлено)
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            ctx.set.status = 409; // Conflict
            return { success: false, message: "Этот фильм уже в избранном." };
        }
        ctx.set.status = 500;
        return { success: false, message: "Произошла ошибка при добавлении в избранное" };
    }
}, {
    beforeHandle: [checkAuth], // Требуется аутентификация
    params: MovieIdParamsDto, // Валидация параметра movieId
    response: {
        201: t.Object({ success: t.Boolean(), message: t.String() }), // Успешное добавление
        401: t.Object({ success: t.Boolean(), message: t.String() }), // Не авторизован
        404: t.Object({ success: t.Boolean(), message: t.String() }), // Фильм не найден
        409: t.Object({ success: t.Boolean(), message: t.String() }), // Уже добавлен (Conflict)
        500: t.Object({ success: t.Boolean(), message: t.String() })  // Внутренняя ошибка
    }
});


// --- Удаление фильма из избранного ---
profileRoutes.delete('/favorites/:movieId', async (ctx) => {
    const userId = (ctx.store as AuthStore).userId;
    if (!userId) {
        ctx.set.status = 401; return { success: false, message: "Unauthorized" };
    }
    const movieId = parseInt(ctx.params.movieId);

    try {
        // Удаляем запись
        const deleteResult = await prisma.user_movie_favorites.delete({
            where: {
                user_id_movie_id: { // Используем составной ключ
                    user_id: userId,
                    movie_id: movieId
                }
            }
        });
        // delete не бросает ошибку, если запись не найдена, поэтому проверяем count в результате (или можно сделать findFirst перед delete)
        // Однако, в данном случае, если записи нет, то и удалять нечего - это ОК.

        // !!! ИСПРАВЛЕНИЕ: Устанавливаем статус и возвращаем только тело !!!
        ctx.set.status = 200; // OK (или 204 No Content, если ничего не возвращаем)
        return { success: true, message: "Фильм удален из избранного" };
    } catch (e: any) {
        console.error("Error removing favorite:", e);
         // Обработка ошибки "запись не найдена для удаления"
         if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
            ctx.set.status = 404;
            return { success: false, message: "Фильм не найден в избранном." };
        }
        ctx.set.status = 500;
        return { success: false, message: "Произошла ошибка при удалении из избранного" };
    }
}, {
    beforeHandle: [checkAuth], // Требуется аутентификация
    params: MovieIdParamsDto, // Валидация параметра movieId
    response: {
        200: t.Object({ success: t.Boolean(), message: t.String() }), // Успешное удаление
        401: t.Object({ success: t.Boolean(), message: t.String() }), // Не авторизован
        404: t.Object({ success: t.Boolean(), message: t.String() }), // Не найден в избранном
        500: t.Object({ success: t.Boolean(), message: t.String() })  // Внутренняя ошибка
    }
});


// --- Роут для получения списка актеров (не требует JWT) ---
profileRoutes.get("/actors", async (ctx) => {
    try {
        const actors = await prisma.actors.findMany({
            select: { actor_id: true, name: true, photo_filename: true } // Выбираем нужные поля
        });
        // !!! ИСПРАВЛЕНИЕ: Устанавливаем статус и возвращаем только тело !!!
        ctx.set.status = 200;
        return { success: true, data: actors };
    } catch (error) {
        console.error("Error fetching actors:", error);
        ctx.set.status = 500;
        return { success: false, message: 'Не удалось получить список актеров' };
    }
}, {
    response: {
        200: t.Object({
            success: t.Boolean(),
            // Уточняем схему для актеров
            data: t.Array(t.Object({
                actor_id: t.Number(),
                name: t.String(),
                photo_filename: t.Nullable(t.String())
            }))
        }),
        500: t.Object({ success: t.Boolean(), message: t.String() })
    }
});


// --- НОВЫЙ МАРШРУТ: Получение топ пользователей по рейтингу ---
profileRoutes.get('/top-rated', async ({ query, set }) => {
    try {
        const limit = query.limit ? parseInt(query.limit, 10) : 5;
        // Простая валидация лимита
        if (isNaN(limit) || limit <= 0 || limit > 100) { // Добавил верхний предел
             set.status = 400;
             return { success: false, message: "Параметр 'limit' должен быть числом от 1 до 100." };
        }

        const topUsers = await prisma.users.findMany({
            orderBy: {
                rating: 'desc', // Сортировка по убыванию рейтинга
            },
            take: limit,       // Взять указанное количество
            select: {          // Выбрать только нужные поля
                user_id: true,
                username: true,
                rating: true,
                // Добавь сюда поле для аватара, если оно есть в модели users
                // avatar_filename: true,
            },
        });

        // Преобразование null рейтинга в 0
        const resultUsers = topUsers.map(user => ({
            ...user,
            rating: user.rating ?? 0,
        }));

        set.status = 200;
        return { success: true, data: resultUsers };

    } catch (error: any) {
        console.error("API Error fetching top rated users:", error);
        set.status = 500;
        return { success: false, message: error.message || "Ошибка сервера при получении рейтинга." };
    }
}, {
    query: t.Object({ // Валидация query параметра
        limit: t.Optional(t.String()) // Принимаем как строку, парсим и валидируем выше
    }),
    detail: { // Описание для Swagger
        summary: 'Get Top Rated Users',
        description: 'Retrieves a list of users sorted by rating in descending order. Default limit is 5.',
        tags: ['Profile'] // Используем тег Profile, так как роут находится здесь
    },
    response: { // Схема ответа
        200: t.Object({
            success: t.Boolean(),
            data: t.Array(t.Object({
                user_id: t.Number(),
                username: t.String(),
                rating: t.Number(), // Рейтинг будет числом (0, если был null)
                 // avatar_filename: t.Optional(t.Nullable(t.String())), // Если добавил аватар
            }))
        }),
        400: t.Object({ success: t.Boolean(), message: t.String() }), // Bad Request (неверный limit)
        500: t.Object({ success: t.Boolean(), message: t.String() })  // Internal Server Error
    }
});
// --- Конец нового маршрута ---


export default profileRoutes;