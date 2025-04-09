// backend/src/app.ts
import Elysia from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { jwt } from '@elysiajs/jwt';
import { staticPlugin } from '@elysiajs/static'; 
import 'dotenv/config';
import colors from "colors";
import packageJSON from "./../package.json";
import { Logestic } from 'logestic';
import fs from 'node:fs/promises';
import cron from 'node-cron';
import { updateSystemCompilationsByGenre } from './service/compilations.service';

// Импорт Elysia роутов
import AuthRoute from "./route/auth.route"; // Убери .ts если настроен moduleResolution
import ProfileRoute from "./route/profile.route";
import ActorsRoute from './route/actors.route';
import MoviesRoute from './route/movies.route';
import GenresRoute from './route/genres.route';
import DirectorsRoute from './route/directors.route';
import CountriesRoute from './route/countries.route';
import CompilationsRoute from './route/compilations.route';
import PostsRoute from './route/posts.route'; // Импорт роута постов

const app = new Elysia();

async function bootstrap() {
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
        console.error(colors.red("FATAL ERROR: JWT_SECRET environment variable is not defined!"));
        process.exit(1);
    }

    // Плагин для логирования запросов
    app.use(Logestic.preset('fancy'));

    // Плагин для работы с JWT
    app.use(
        jwt({
            name: 'jwt', // Имя декоратора (доступен как ctx.jwt)
            secret: JWT_SECRET
        })
    );




    // Плагин для Swagger документации
    app.use(swagger(
        {
            path: '/docs', // Путь к документации
            documentation: {
                info: {
                    title: `KinoMatch API Docs v${packageJSON.version}`, // Используем версию из package.json
                    version: packageJSON.version // Версия API
                },
                tags: [ // Определяем теги для группировки эндпоинтов
                    { name: 'Auth', description: 'Аутентификация и регистрация' },
                    { name: 'Profile', description: 'Управление профилем пользователя' },
                    { name: 'Movies', description: 'Фильмы' },
                    { name: 'Actors', description: 'Актеры' },
                    { name: 'Directors', description: 'Режиссеры' },
                    { name: 'Genres', description: 'Жанры' },
                    { name: 'Countries', description: 'Страны' },
                    { name: 'Compilations', description: 'Подборки фильмов' },
                    { name: 'Posts', description: 'Посты пользователей' }
                ]
            }
        }
    ));

    // Обработка preflight запросов OPTIONS
    app.options("*", (ctx) => {
        ctx.set.status = 204; // No Content
        return ''; // Возвращаем пустой ответ
    });

    // Плагин для настройки CORS
    app.use(cors({
        credentials: true,
        origin: 'http://localhost:3000', // Разрешаем запросы с фронтенда
        allowedHeaders: "Origin, X-Requested-With, Content-Type, Accept, Authorization", // Разрешенные заголовки
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'] // Разрешенные методы
    }));



    // Базовый роут для проверки работоспособности
    app.get("/", () => {
        return {
            message: `KinoMatch Backend API v${packageJSON.version} is running!`
        };
    });

    // Роут для favicon (опционально)
    app.get("/favicon.ico", async ({ set }) => {
        try {
            // Путь к favicon относительно корня проекта
            const favicon = await fs.readFile('./public/favicon.ico');
            set.headers['Content-Type'] = 'image/x-icon';
            return favicon;
        } catch (error) {
            console.warn("Favicon not found at ./public/favicon.ico");
            set.status = 404;
            return 'Favicon not found';
        }
    });

    // --- Глобальные обработчики ошибок ---

// Замени существующий app.onError на этот:
app.onError(({ code, error, set }) => {
    // Логируем ошибку для отладки
    // Не показываем stack trace в продакшене из соображений безопасности
    console.error(`Error Handler [${code}]: ${error?.message || error}`);
    if (process.env.NODE_ENV !== 'production' && error?.stack) {
        console.error(error.stack);
    }

    // Обработка стандартных кодов ошибок Elysia
    switch (code) {
        case 'NOT_FOUND':
            set.status = 404;
            return { message: 'Запрашиваемый маршрут не найден.' };

        case 'VALIDATION':
            set.status = 400; // Bad Request
            return {
                message: 'Ошибка валидации входных данных.',
                // Попытка извлечь детали ошибки валидации (структура может отличаться)
                errors: error?.errors?.map((e: any) => ({
                    field: e.path, // Путь к полю с ошибкой
                    message: e.message, // Сообщение ошибки от TypeBox/валидатора
                 })) || error?.message // Фоллбэк на общее сообщение
            };

        case 'PARSE':
            set.status = 400; // Bad Request
            return { message: 'Ошибка разбора тела запроса (вероятно, невалидный JSON).' };

        case 'INTERNAL_SERVER_ERROR':
            set.status = 500;
            return { message: 'Внутренняя ошибка сервера.' };

        case 'UNKNOWN':
        default: // Обработка всех остальных или неизвестных ошибок
            set.status = error?.status || 500; // Пытаемся взять статус из самой ошибки, иначе 500
            // В продакшене лучше не отправлять детальное сообщение об ошибке
            const message = process.env.NODE_ENV === 'production'
                ? 'Произошла непредвиденная ошибка.'
                : error?.message || 'Произошла непредвиденная ошибка.';
            return { message };
    }
});
    // --- Конец обработчиков ошибок ---


    // --- Группа для всех API роутов ---
    app.group("/api", (apiGroup) =>
        apiGroup
            .use(AuthRoute)       // тэг 'Auth'
            .use(ProfileRoute)    // тэг 'Profile'
            .use(ActorsRoute)     // тэг 'Actors'
            .use(MoviesRoute)     // тэг 'Movies'
            .use(GenresRoute)     // тэг 'Genres'
            .use(DirectorsRoute)  // тэг 'Directors'
            .use(CountriesRoute)  // тэг 'Countries'
            .use(CompilationsRoute) // тэг 'Compilations'
            .use(PostsRoute)      // тэг 'Posts' - Добавляем роут постов
    );


    // --- Запуск Cron Job для обновления подборок ---
    // // Обновление каждый день в 3:00 ночи по времени сервера
    cron.schedule('0 3 * * *', async () => {
        console.log(colors.cyan('Running scheduled system compilations update job...'));
        try {
            await updateSystemCompilationsByGenre();
            console.log(colors.green('Scheduled system compilations update job finished successfully.'));
        } catch (error) {
            console.error(colors.red("Error during scheduled system compilations update job:"), error);
        }
    }, {
        scheduled: true,
        timezone: "Europe/Moscow" // Укажи свою таймзону, если сервер не в Москве
    });
    console.log(colors.yellow('Cron job for compilations update scheduled for 03:00 AM server time.'));

    // // Убираем немедленный запуск обновления при старте
    
    // console.log('Running system compilations update job immediately...');
    // await updateSystemCompilationsByGenre();
    // console.log('System compilations update job finished.');
    

    // --- Запуск сервера ---
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;
    app.listen(PORT, () => {
        console.log(colors.green(`🚀 Server v${packageJSON.version} started successfully on http://localhost:${PORT}`));
        console.log(colors.blue(`📚 API Documentation available at http://localhost:${PORT}/docs`));
    });
}

// Запускаем асинхронную функцию bootstrap
bootstrap().catch(err => {
    console.error(colors.red("💥 Failed to bootstrap the application:"), err);
    process.exit(1);
});