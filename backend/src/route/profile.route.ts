// backend/src/route/profile.route.ts
import { Elysia, t } from 'elysia';
import { ProfileParamsBodyDto, ProfileResponseDto } from "../dto/Auth.dto";
import { DefaultResponseDto, OffsetLengthQueryDto } from "../dto/Response.dto.ts";
import { UserProvider } from "../providers/user.provider.ts";
import prisma from "../util/prisma.ts";
import { jwt } from '@elysiajs/jwt';
import { MovieIdParamsDto } from '../dto/Movie.dto.ts'; // Убедись, что путь правильный!

// Определяем тип для JWT payload. ЗАМЕНИ НА СВОЙ!
// Этот тип ДОЛЖЕН совпадать с тем, что ты помещаешь в JWT в auth.route.ts
type JWTPayload = {
    username: string;
    userId: number; // Добавь, если есть userId в токене
    // ... другие поля из твоего JWT
};

const profileRoutes = new Elysia({ prefix: "/profile", detail: { tags: ["Profile"] } });

// Вспомогательная функция для создания ответов с ошибками
const createErrorResponse = (message: string, status: number = 500) => {
    return new Response(JSON.stringify({ success: false, message }), {
        status: status,
        headers: { 'Content-Type': 'application/json' }
    });
};

// Endpoint для получения своего профиля
profileRoutes.get('/', async (ctx) => {
    const verification = await ctx.jwt.verify(ctx.headers.authorization);
    if (!verification) {
        return createErrorResponse('Invalid token', 401); // Возвращаем ошибку 401
    }

    // Используем type assertion, чтобы указать TypeScript тип verification
    const { username } = verification as JWTPayload;

    let userData = await UserProvider.getByUsername(username);
    if (!userData) {
        return createErrorResponse('User not found', 404); // Возвращаем ошибку 404
    }
    return { success: true, data: userData };
}, {
    response: ProfileResponseDto, // DTO для ответа
    beforeHandle: async (ctx) => {
        // Проверка JWT перед выполнением основного обработчика
        if (!await ctx.jwt.verify(ctx.headers.authorization)) {
            return createErrorResponse("Unauthorized", 401);
        }
    }
});

// Endpoint для получения списка избранного
profileRoutes.get('/favorites', async (ctx) => {
    const verification = await ctx.jwt.verify(ctx.headers.authorization);
    if (!verification) {
        return createErrorResponse('Invalid token', 401); // Возвращаем ошибку 401
    }

    const { username } = verification as JWTPayload;

    try {
        let userData = await UserProvider.getByUsername(username);
        if (!userData) {
            return createErrorResponse('User not found', 404);
        }

        let length = parseInt(ctx.query.length || "20");
        let offset = parseInt(ctx.query.offset || "0");

        let eventsData = await prisma.user_movie_favorites.findMany({
            where: {
                user_id: userData.id
            },
            include: {
                movies: true,
            },
            take: length,
            skip: offset
        });
        if (!eventsData) {
            return createErrorResponse("Favorites not found", 404);
        }

        return {
            success: true,
            pagination: {
                length: length,
                offset: offset
            },
            data: eventsData
        };
    } catch (e) {
        console.error(e);
        return createErrorResponse('An error occurred', 500); // Возвращаем ошибку 500
    }
}, {
    query: OffsetLengthQueryDto, // DTO для query параметров
    response: DefaultResponseDto, // DTO для ответа
    beforeHandle: async (ctx) => {
        if (!await ctx.jwt.verify(ctx.headers.authorization)) {
            return createErrorResponse("Unauthorized", 401);
        }
    }
});

// Endpoint для добавления фильма в избранное
profileRoutes.post('/favorites/:movieId', async (ctx) => {
    const verification = await ctx.jwt.verify(ctx.headers.authorization);
    if (!verification) {
        return createErrorResponse('Invalid token', 401);
    }

    const { username } = verification as JWTPayload;

    let userData = await UserProvider.getByUsername(username);
    if (!userData) {
        return createErrorResponse("User not found", 404)
    }

    try {
        await prisma.user_movie_favorites.create({
            data: {
                user_id: userData.id,
                movie_id: parseInt(ctx.params.movieId) // Преобразуем movieId в число
            }
        });
        return { success: true };
    } catch (e) {
        console.error(e);
        return createErrorResponse('An error occurred', 500);
    }
}, {
    params: MovieIdParamsDto, // DTO для параметров
    response: ProfileResponseDto,  // DTO для ответа
    beforeHandle: async (ctx) => {
        if (!await ctx.jwt.verify(ctx.headers.authorization)) {
            return createErrorResponse("Unauthorized", 401);
        }
    }
});

// Endpoint для удаления фильма из избранного
profileRoutes.delete('/favorites/:movieId', async (ctx) => {
    const verification = await ctx.jwt.verify(ctx.headers.authorization);
    if (!verification) {
        return createErrorResponse('Invalid token', 401);
    }

    const { username } = verification as JWTPayload;

    let userData = await UserProvider.getByUsername(username);
    if (!userData) {
        return createErrorResponse("User not found", 404)
    }
    try {
        await prisma.user_movie_favorites.delete({
            where: {
                user_id_movie_id: {  // Используем правильное имя составного ключа
                    user_id: userData.id,
                    movie_id: parseInt(ctx.params.movieId) // Преобразуем movieId в число
                }
            }
        });
        return { success: true };
    } catch (e) {
        console.error(e);
        return createErrorResponse('An error occurred', 500);
    }
}, {
    params: MovieIdParamsDto, // DTO для параметров
    response: ProfileResponseDto,  // DTO для ответа
    beforeHandle: async (ctx) => {
        if (!await ctx.jwt.verify(ctx.headers.authorization)) {
            return createErrorResponse("Unauthorized", 401);
        }
    }
});

// Роут для получения списка актеров (не требует JWT)
profileRoutes.get("/actors", async () => {
    try {
        const actors = await prisma.actors.findMany();
        return { actors };
    } catch (error) {
        console.error("Error fetching actors:", error);
        return createErrorResponse('Failed to fetch actors', 500);
    }
});

export default profileRoutes;