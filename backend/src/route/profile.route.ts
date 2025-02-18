// backend/src/route/profile.route.ts
import { Elysia, t } from 'elysia';
import { ProfileParamsBodyDto, ProfileResponseDto } from "../dto/Auth.dto";
import { DefaultResponseDto, OffsetLengthQueryDto } from "../dto/Response.dto.ts";
import { UserProvider } from "../providers/user.provider.ts";
import prisma from "../util/prisma.ts";
import { jwt } from '@elysiajs/jwt'; //  Убедитесь, что импортируете jwt
import { MovieIdParamsDto } from '../dto/Movie.dto.ts';

// Определяем тип для JWT payload.  ЭТО ДОЛЖНО СОВПАДАТЬ С ТЕМ, ЧТО ВЫ ПОМЕЩАЕТЕ В JWT!
type JWTPayload = {
    username: string;
    userId: number; // ДОБАВЬТЕ userId, если он есть в токене.
    // ... другие поля из вашего JWT
};

const profileRoutes = new Elysia({ prefix: "/profile", detail: { tags: ["Profile"] } });

// Endpoint для получения своего профиля
profileRoutes.get('/', async (ctx) => {
    const verification = await ctx.jwt.verify(ctx.headers.authorization);
    if (!verification) {
        return { 401: { success: false, message: "Unauthorized" } }; // Возвращаем ошибку 401
    }

    // Используем type assertion и извлекаем userId.
    const { userId } = verification as JWTPayload;

    const userData = await UserProvider.getByID(userId); // Исправлено: getByID (с заглавной D)
    if (!userData) {
        return { 404: { success: false, message: "User not found" } };
    } else { // Добавлен else
        return { 200: { success: true, data: userData } };
    }
}, {
    response: t.Object({ // ЯВНО указываем схему ответа.
        success: t.Boolean(),
        data: t.Optional(t.Any())  // ЗАМЕНИТЕ t.Any на более конкретный тип вашего профиля!
    }),
    beforeHandle: async (ctx) => { // beforeHandle не должен ничего возвращать
        if (!await ctx.jwt.verify(ctx.headers.authorization)) {
            return { 401: { success: false, message: "Unauthorized" } };
        }
    }
});

// Endpoint для получения списка избранного
profileRoutes.get('/favorites', async (ctx) => {
    const verification = await ctx.jwt.verify(ctx.headers.authorization);
    if (!verification) {
        return { 401: { success: false, message: "Unauthorized" } };
    }

    const { userId } = verification as JWTPayload;

    try {
        const userData = await UserProvider.getByID(userId); // Исправлено: getByID
        if (!userData) {
            return { 404: { success: false, message: "User not found" } };
        }

        const length = parseInt(ctx.query.length || "20");
        const offset = parseInt(ctx.query.offset || "0");

        const eventsData = await prisma.user_movie_favorites.findMany({
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
            return { 404: { success: false, message: "Favorites not found" } };
        }

        return {
            200: { // Используем 200 OK
                success: true,
                pagination: {
                    length: length,
                    offset: offset
                },
                data: eventsData
            }
        };
    } catch (e) {
        console.error(e);
        return { 500: { success: false, message: "An error occurred" } }; // Возвращаем ошибку 500
    }
}, {
    query: OffsetLengthQueryDto, // DTO для query параметров
    response: t.Object({ // ЯВНО указываем схему ответа.
        success: t.Boolean(),
        data: t.Optional(t.Any()), // ЗАМЕНИТЕ t.Any на более конкретный тип!
        message: t.Optional(t.Object({
            code: t.Optional(t.String()),
            text: t.String(),
            message: t.String()
        })),
        pagination: t.Optional(t.Object({
            length: t.Number(),
            offset: t.Number()
        }))
    }),
    beforeHandle: async (ctx) => { // beforeHandle не должен ничего возвращать
        if (!await ctx.jwt.verify(ctx.headers.authorization)) {
            return { 401: { success: false, message: "Unauthorized" } };
        }
    }
});

// Endpoint для добавления фильма в избранное
profileRoutes.post('/favorites/:movieId', async (ctx) => {
    const verification = await ctx.jwt.verify(ctx.headers.authorization);
    if (!verification) {
        return { 401: { success: false, message: "Unauthorized" } };
    }

    const { userId } = verification as JWTPayload;

    const userData = await UserProvider.getByID(userId); // Исправлено: getByID
    if (!userData) {
        return { 404: { success: false, message: "User not found" } };
    }

    try {
        await prisma.user_movie_favorites.create({
            data: {
                user_id: userData.id,
                movie_id: parseInt(ctx.params.movieId) // Преобразуем movieId в число
            }
        });
        return { 200: { success: true } }; // Используем 200 OK
    } catch (e) {
        console.error(e);
        return { 500: { success: false, message: "An error occurred" } };
    }
}, {
    params: MovieIdParamsDto, // DTO для параметров
    response: t.Object({ // ЯВНО указываем схему ответа.
        success: t.Boolean(),
        data: t.Optional(t.Any()) // ЗАМЕНИТЕ t.Any на более конкретный тип!
    }),
    beforeHandle: async (ctx) => { // beforeHandle не должен ничего возвращать
        if (!await ctx.jwt.verify(ctx.headers.authorization)) {
            return { 401: { success: false, message: "Unauthorized" } };
        }
    }
});

// Endpoint для удаления фильма из избранного
profileRoutes.delete('/favorites/:movieId', async (ctx) => {
    const verification = await ctx.jwt.verify(ctx.headers.authorization);
    if (!verification) {
        return { 401: { success: false, message: "Unauthorized" } };
    }

    const { userId } = verification as JWTPayload;

    const userData = await UserProvider.getByID(userId); // Исправлено: getByID
    if (!userData) {
        return { 404: { success: false, message: "User not found" } };
    }

    try {
        await prisma.user_movie_favorites.delete({
            where: {
                user_id_movie_id: {
                    user_id: userData.id,
                    movie_id: parseInt(ctx.params.movieId) // Преобразуем movieId в число
                }
            }
        });
        return { 200: { success: true } }; // Используем 200 OK
    } catch (e) {
        console.error(e);
        return { 500: { success: false, message: "An error occurred" } };
    }
}, {
    params: MovieIdParamsDto, // DTO для параметров
    response: t.Object({  // ЯВНО указываем схему ответа
        success: t.Boolean(),
        data: t.Optional(t.Any()) // ЗАМЕНИТЕ t.Any на более конкретный тип!
    }),
    beforeHandle: async (ctx) => { // beforeHandle не должен ничего возвращать
        if (!await ctx.jwt.verify(ctx.headers.authorization)) {
            return { 401: { success: false, message: "Unauthorized" } };
        }
    }
});

// Роут для получения списка актеров (не требует JWT)
profileRoutes.get("/actors", async () => { //  Добавил ctx, хоть он и не используется
    try {
        const actors = await prisma.actors.findMany();
        return { 200: { actors } }; // Оборачиваем в объект с кодом 200
    } catch (error) {
        console.error("Error fetching actors:", error);
        return { 500: { success: false, message: 'Failed to fetch actors' } };
    }
});

export default profileRoutes;