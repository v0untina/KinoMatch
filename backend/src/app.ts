// backend/src/app.ts (обновленный для Elysia роутов)
import Elysia from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { jwt } from '@elysiajs/jwt';
import 'dotenv/config';
import colors from "colors";
import packageJSON from "./../package.json";
import { Logestic } from 'logestic';
import fs from 'node:fs/promises';

// Импорт Elysia роутов (ВНИМАНИЕ: импортируем Elysia роуты, а не Express)
import AuthRoute from "./route/auth.route.ts"; // Пока предположим, что AuthRoute тоже переписан на Elysia
import ProfileRoute from "./route/profile.route.ts"; // ... и ProfileRoute
import ActorsRoute from './route/actors.route.ts'; // ... и ActorsRoute
import MoviesRoute from './route/movies.route.ts'; // Импортируем Elysia версию MoviesRoute
import GenresRoute from './route/genres.route.ts'; // ... и т.д.
import DirectorsRoute from './route/directors.route.ts';
import CountriesRoute from './route/countries.route.ts';

const app = new Elysia();

async function bootstrap() {
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
        console.error(colors.red("FATAL ERROR: JWT_SECRET environment variable is not defined!"));
        process.exit(1);
    }

    app.use(Logestic.preset('fancy'));

    app.use(
        jwt({
            name: 'jwt',
            secret: JWT_SECRET
        })
    );

    app.use(swagger(
        {
            documentation: {
                info: {
                    title: 'Docs',
                    version: '1.0.0'
                }
            }
        }
    ));

    app.options("*", (ctx) => {
        ctx.set.status = 204;
        return '204 No Content';
    });

    app.use(cors({
        credentials: true,
        origin: 'http://localhost:3000',
        allowedHeaders: "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    }));

    app.get("/", () => {
        return {
            message: "Добро пожаловать в KinoMatch Backend API!"
        };
    });

    app.get("/favicon.ico", async ({ set }) => {
        try {
            const favicon = await fs.readFile('./backend/public/favicon.ico');
            set.headers['Content-Type'] = 'image/x-icon';
            return favicon;
        } catch (error) {
            set.status = 404;
            return 'Favicon not found';
        }
    });
    
    app.error((ctx, error) => {
        console.error("Global error handler caught:", error); // Логируем ошибку на сервере
    
        // Формируем ответ об ошибке в формате DefaultResponseDto
        return new Response(JSON.stringify({
            success: false,
            message: {
                message: "Внутренняя ошибка сервера", // Общее сообщение об ошибке
                text: "Произошла внутренняя ошибка сервера. Пожалуйста, попробуйте позже."
            }
        }), {
            status: 500, // Возвращаем статус 500 Internal Server Error
            headers: { 'Content-Type': 'application/json' }
        });
    });
    
    app.group("/api", (apiGroup) => // Изменяем параметр на apiGroup для ясности
        apiGroup // Используем apiGroup внутри group()
            .use(AuthRoute)       // Подключаем Elysia роуты как плагины
            .use(ProfileRoute)
            .use(ActorsRoute)
            .use(MoviesRoute)    // Подключаем Elysia MoviesRoute
            .use(GenresRoute)
            .use(DirectorsRoute)
            .use(CountriesRoute)
    );

    app.listen(8000, () => {
        console.log(`Server started on http://localhost:8000`);
    });
}

bootstrap();