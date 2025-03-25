import { Elysia, t } from 'elysia';
import { DefaultResponseDto, OffsetLengthQueryDto } from "../dto/Response.dto.ts";
import { UserProvider } from "../providers/user.provider.ts";
import prisma from "../util/prisma.ts";
import { jwt } from '@elysiajs/jwt';
import { MovieIdParamsDto } from '../dto/Movie.dto.ts';

// Определяем тип для JWT payload.  ЭТО ДОЛЖНО СОВПАДАТЬ С ТЕМ, ЧТО ВЫ ПОМЕЩАЕТЕ В JWT!
type JWTPayload = {
    username: string;
    userId: number; // ДОБАВЬТЕ userId, если он есть в токене (а он должен быть!).
    // ... другие поля из вашего JWT (если есть) ...
};

const profileRoutes = new Elysia({ prefix: '/profile', detail: { tags: ['Profile'] } });

// Endpoint для получения своего профиля
profileRoutes.get('/', async (ctx) => {
    const authorization = ctx.headers.authorization;
    if (!authorization) {
        return { status: 401, body: { success: false, message: 'Unauthorized' } };
    }
    const verification = await ctx.jwt.verify(authorization);

    if (!verification) {
        return { status: 401, body: { success: false, message: 'Invalid token' } };
    }
    const { userId } = verification as JWTPayload;
    const userData = await UserProvider.getByID(userId);
    if (!userData) {
        return { status: 404, body: { success: false, message: 'User not found' } };
    }

    // !!! ИСПРАВЛЕНИЕ: Убираем обертку 200: { ... } и явно устанавливаем статус !!!
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
    response: {
        200: t.Object({
            success: t.Boolean(), // Оставляем t.Boolean() пока
            data: t.Object({
                user_id: t.Number(),
                username: t.String(),
                email: t.String(),
                // ... другие поля, которые вы возвращаете ...
            })
        }),
        401: t.Object({
            success: t.Boolean(),
            message: t.String()
        }),
        404: t.Object({
            success: t.Boolean(),
            message: t.String()
        })
    }
});

// Endpoint для получения списка избранного
profileRoutes.get('/favorites', async (ctx) => {
    const authorization = ctx.headers.authorization;
    if (!authorization) {
        return { status: 401, body: { success: false, message: 'Unauthorized' } };
    }

    const verification = await ctx.jwt.verify(authorization);
    if (!verification) {
         return { status: 401, body: { success: false, message: 'Invalid token' } };
    }

    const { userId } = verification as JWTPayload;

    try {
        const userData = await UserProvider.getByID(userId); // Исправлено: getByID
        if (!userData) {
            return { status: 404, body: { success: false, message: 'User not found' } };
        }

        const length = parseInt(ctx.query.length || "20");
        const offset = parseInt(ctx.query.offset || "0");

        const favoritesData = await prisma.user_movie_favorites.findMany({ // Изменил имя переменной
            where: {
                user_id: userData.user_id // Исправлено: используем user_id из userData
            },
            include: {
                movies: true, // Включаем данные о фильмах
            },
            take: length,
            skip: offset
        });
        //  Убрал проверку на !eventsData, т.к. пустой массив - это нормальный результат.

        return {
            status: 200,
            body: {
                success: true,
                pagination: {
                    length: length,
                    offset: offset
                },
                data: favoritesData // Возвращаем данные об избранном
            }
        };
    } catch (e) {
        console.error(e);
        return { status: 500, body: { success: false, message: "An error occurred" } }; // Возвращаем ошибку 500
    }
}, {
    query: OffsetLengthQueryDto,
    response: { // ЯВНО указываем схему ответа.
        200: t.Object({  // Добавил описание для 200 OK
            success: t.Boolean(),
            data: t.Array(t.Any()), //  t.Array(t.Any())!  Укажи тип элементов массива!
            pagination: t.Object({
                length: t.Number(),
                offset: t.Number()
            })
        }),
        401: t.Object({
            success: t.Boolean(),
            message: t.String()
        }),
        404: t.Object({ // Добавил описание для 404
            success: t.Boolean(),
            message: t.String()
        }),
        500: t.Object({ // Добавил описание для 500
            success: t.Boolean(),
            message: t.String()
        })
    }
});

// Endpoint для добавления фильма в избранное
profileRoutes.post('/favorites/:movieId', async (ctx) => {
    const authorization = ctx.headers.authorization;
     if (!authorization) {
        return { status: 401, body: { success: false, message: 'Unauthorized' } };
    }
    const verification = await ctx.jwt.verify(authorization);
    if (!verification) {
         return { status: 401, body: { success: false, message: 'Invalid token' } };
    }

    const { userId } = verification as JWTPayload;

    const userData = await UserProvider.getByID(userId); // Исправлено: getByID
    if (!userData) {
        return { status: 404, body: { success: false, message: 'User not found' } };
    }

    try {
        await prisma.user_movie_favorites.create({
            data: {
                user_id: userData.user_id, // Исправлено: используем user_id из userData
                movie_id: parseInt(ctx.params.movieId) // Преобразуем movieId в число
            }
        });
        return { status: 201, body: { success: true } }; // Используем 201 Created
    } catch (e) {
        console.error(e);
        return { status: 500, body: { success: false, message: "An error occurred" } };
    }
}, {
    params: MovieIdParamsDto,
    response: { // ЯВНО указываем схему ответа.
        201: t.Object({ // Добавил описание для 201 Created
            success: t.Boolean()
        }),
        401: t.Object({
            success: t.Boolean(),
            message: t.String()
        }),
        404: t.Object({
            success: t.Boolean(),
            message: t.String()
        }),
        500: t.Object({
            success: t.Boolean(),
            message: t.String()
        })
    }
});

// Endpoint для удаления фильма из избранного
profileRoutes.delete('/favorites/:movieId', async (ctx) => {
   const authorization = ctx.headers.authorization;
     if (!authorization) {
        return { status: 401, body: { success: false, message: 'Unauthorized' } };
    }
    const verification = await ctx.jwt.verify(authorization);
    if (!verification) {
        return { status: 401, body: { success: false, message: 'Invalid token' } };
    }

    const { userId } = verification as JWTPayload;

    const userData = await UserProvider.getByID(userId); // Исправлено: getByID
    if (!userData) {
        return { status: 404, body: { success: false, message: 'User not found' } };
    }

    try {
        await prisma.user_movie_favorites.delete({
            where: {
                user_id_movie_id: {
                    user_id: userData.user_id,  // Исправлено: используем user_id из userData
                    movie_id: parseInt(ctx.params.movieId) // Преобразуем movieId в число
                }
            }
        });
        return { status: 200, body: { success: true } }; // Используем 200 OK
    } catch (e) {
        console.error(e);
        return { status: 500, body: { success: false, message: "An error occurred" } };
    }
}, {
    params: MovieIdParamsDto,
    response: { // ЯВНО указываем схему ответа
        200: t.Object({
            success: t.Boolean()
        }),
        401: t.Object({
            success: t.Boolean(),
            message: t.String()
        }),
        404: t.Object({
            success: t.Boolean(),
            message: t.String()
        }),
        500: t.Object({
            success: t.Boolean(),
            message: t.String()
        })
    }
});

// Роут для получения списка актеров (не требует JWT)
profileRoutes.get("/actors", async (ctx) => { // Добавил ctx
    try {
        const actors = await prisma.actors.findMany();
        return { status: 200, body: { success: true, data: actors } }; // Оборачиваем в объект с кодом 200 и success
    } catch (error) {
        console.error("Error fetching actors:", error);
        return { status: 500, body: { success: false, message: 'Failed to fetch actors' } };
    }
}, {
    response: { // Добавлено описание ответа
        200: t.Object({
            success: t.Boolean(),
            data: t.Array(t.Any()) // !!! Укажи тип элементов массива !!!
        }),
        500: t.Object({
            success: t.Boolean(),
            message: t.String()
        })
    }
});

export default profileRoutes;