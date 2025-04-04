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
import cron from 'node-cron'; // Импорт node-cron
import { updateSystemCompilationsByGenre } from './service/compilations.service'; // Импорт функции обновления
import { Context } from 'elysia';

// Импорт Elysia роутов
import AuthRoute from "./route/auth.route.ts";
import ProfileRoute from "./route/profile.route.ts";
import ActorsRoute from './route/actors.route.ts';
import MoviesRoute from './route/movies.route.ts';
import GenresRoute from './route/genres.route.ts';
import DirectorsRoute from './route/directors.route.ts';
import CountriesRoute from './route/countries.route.ts';
import CompilationsRoute from './route/compilations.route.ts'; // Импорт CompilationsRoute

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

    app.error((ctx: Context, error: any) => { 
        console.error("Global error handler caught:", error);
    
        return new Response(JSON.stringify({
            success: false,
            message: {
                message: "Внутренняя ошибка сервера",
                text: "Произошла внутренняя ошибка сервера. Пожалуйста, попробуйте позже."
            }
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    });

    app.group("/api", (apiGroup) => // Изменяем параметр на apiGroup для ясности
        apiGroup // Используем apiGroup внутри group()
            .use(AuthRoute)       // Подключаем Elysia роуты как плагины
            .use(ProfileRoute)
            .use(ActorsRoute)
            .use(MoviesRoute)
            .use(GenresRoute)
            .use(DirectorsRoute)
            .use(CountriesRoute)
            .use(CompilationsRoute) // Подключаем CompilationsRoute
    );


        // **Временно запускаем обновление подборок сразу при старте сервера**
        console.log('Running system compilations update job immediately...');
        await updateSystemCompilationsByGenre();
        console.log('System compilations update job finished.');
    // // Запуск автоматического обновления подборок по жанрам каждый день в 3 часа ночи (время сервера)
    // cron.schedule('0 3 * * *', async () => {
    //     console.log('Running system compilations update job...');
    //     try {
    //         await updateSystemCompilationsByGenre();
    //     } catch (error) {
    //         console.error("Error during system compilations update job:", error);
    //     }
    // });


    app.listen(8000, () => {
        console.log(`Server started on http://localhost:8000`);
    });
}

bootstrap();