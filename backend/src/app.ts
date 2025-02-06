// backend/src/app.ts
import Elysia from 'elysia'; // Импортируем Elysia
import { swagger } from '@elysiajs/swagger'; // Импортируем Swagger
import { cors } from '@elysiajs/cors'; // Импортируем CORS
import { jwt } from '@elysiajs/jwt'; // Импортируем JWT
import 'dotenv/config'; // Подключаем переменные окружения из .env
import colors from "colors";
import packageJSON from "./../package.json";
import { Logestic } from 'logestic'; // Импортируем Logestic (для логирования)
import fs from 'node:fs/promises';

// Импорт роутов
import AuthRoute from "./route/auth.route.ts";
import ProfileRoute from "./route/profile.route.ts";
import ActorsRoute from './route/actors.route.ts';
import MoviesRoute from './route/movies.route.ts';
import GenresRoute from './route/genres.route.ts';
import DirectorsRoute from './route/directors.route.ts';
import CountriesRoute from './route/countries.route.ts';

// Создаём Elysia приложение
const app = new Elysia();

async function bootstrap() {
    const JWT_SECRET = process.env.JWT_SECRET; // Получаем секретный ключ JWT из переменных окружения

    if (!JWT_SECRET) {
        console.error(colors.red("FATAL ERROR: JWT_SECRET environment variable is not defined!"));
        process.exit(1); // Завершаем работу приложения, если секретный ключ не задан
    }

    // Подключаем middleware для логирования
    app.use(Logestic.preset('fancy'));

    // Подключаем JWT middleware
    app.use(
        jwt({
            name: 'jwt',  // Имя, под которым JWT будет доступен в контексте (ctx.jwt)
            secret: JWT_SECRET // Секретный ключ для подписи и проверки JWT
        })
    );

    // Подключаем Swagger (доступен по /swagger)
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

    // Обработка CORS preflight запросов (OPTIONS)
    app.options("*", (ctx) => {
        ctx.set.status = 204;
        return '204 No Content';
    });

    // Настройка CORS (разрешаем запросы с фронтенда)
    app.use(cors({
        credentials: true,
        origin: 'http://localhost:3000', // Разрешаем запросы с фронтенда на порту 3000
        allowedHeaders: "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    }));

    // Обработчик для корневого пути "/"
    app.get("/", () => {
        return {
            message: "Добро пожаловать в KinoMatch Backend API!"
        };
    });

    // Обработчик для favicon.ico (просто отдаем файл, если он есть)
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

    // Группируем все API роуты под префиксом /api
    app.group("/api", (app) =>
        app
            .use(AuthRoute)       // Роуты для аутентификации
            .use(ProfileRoute)    // Роуты для профиля и избранного
            .use(ActorsRoute)     // Роуты для актеров
            .use(MoviesRoute)     // Роуты для фильмов
            .use(GenresRoute)     // Роуты для жанров
            .use(DirectorsRoute)  // Роуты для режиссеров
            .use(CountriesRoute)  // Роуты для стран
    );

    // Запускаем сервер на порту 8000
    app.listen(8000, () => {
        console.log(`Server started on http://localhost:8000`);
    });
}

bootstrap();