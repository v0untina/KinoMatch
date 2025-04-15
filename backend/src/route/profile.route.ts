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

// --- Получение своего профиля ---
// (Этот роут не использует checkAuth, а проверяет токен вручную - ОСТАВЛЯЕМ ПОКА ТАК,
// но лучше перевести на checkAuth для единообразия)
profileRoutes.get('/', async (ctx) => {
    // ... (код получения userId из токена и userData остается) ...
    const authorization = ctx.headers.authorization;
    if (!authorization) {
        ctx.set.status = 401; return { success: false, message: 'Unauthorized' };
    }
    // Предполагаем, что ctx.jwt настроен глобально или через .use()
    // Если checkAuth настроен глобально, этот код можно упростить, беря userId из store
    const verification = await ctx.jwt.verify(authorization); // Нужен ctx.jwt!
    if (!verification) {
        ctx.set.status = 401; return { success: false, message: 'Invalid token' };
    }
    const { userId } = verification as { userId: number }; // Упростил тип JWTPayload
    const userData = await UserProvider.getByID(userId);
    if (!userData) {
        ctx.set.status = 404; return { success: false, message: 'User not found' };
    }

    // !!! ИСПРАВЛЕНИЕ: Устанавливаем статус и возвращаем только тело !!!
    ctx.set.status = 200;
    return {
        success: true,
        data: {
            user_id: userData.user_id,
            username: userData.username,
            email: userData.email,
            // ... другие нужные поля пользователя ...
        }
    };
}, {
    // Схема ответа остается как есть
    response: {
        200: t.Object({ success: t.Boolean(), data: t.Object({ user_id: t.Number(), username: t.String(), email: t.String() }) }),
        401: t.Object({ success: t.Boolean(), message: t.String() }),
        404: t.Object({ success: t.Boolean(), message: t.String() })
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

export default profileRoutes;