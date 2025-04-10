// backend/src/app.ts
import Elysia from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { jwt } from '@elysiajs/jwt';
// --- ДОБАВЬ ЭТО ---
import { staticPlugin } from '@elysiajs/static';
import path from 'path'; // Убедись, что path импортирован
// --- КОНЕЦ ДОБАВЛЕНИЯ ---
import 'dotenv/config';
import colors from "colors";
import packageJSON from "./../package.json";
import { Logestic } from 'logestic';
import fs from 'node:fs/promises';
import cron from 'node-cron';
import { updateSystemCompilationsByGenre } from './service/compilations.service';

// Импорт Elysia роутов
import AuthRoute from "./route/auth.route";
import ProfileRoute from "./route/profile.route";
import ActorsRoute from './route/actors.route';
import MoviesRoute from './route/movies.route';
import GenresRoute from './route/genres.route';
import DirectorsRoute from './route/directors.route';
import CountriesRoute from './route/countries.route';
import CompilationsRoute from './route/compilations.route';
import PostsRoute from './route/posts.route';

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
            name: 'jwt',
            secret: JWT_SECRET
        })
    );

    // --- ИЗМЕНЕННЫЙ БЛОК НАСТРОЙКИ СТАТИКИ ---
    // Используем 'assets', который отсчитывается от process.cwd() (обычно корень папки backend)
    const assetsFolder = 'data/images'; // Путь относительно корня проекта (backend/)
    const absoluteAssetsPath = path.resolve(process.cwd(), assetsFolder); // Получаем абсолютный путь для лога и создания папок
    console.log(colors.magenta(`Serving static files from (using assets): ${absoluteAssetsPath}`));
    console.log(colors.magenta(`process.cwd(): ${process.cwd()}`)); // Посмотрим текущую рабочую директорию

    // Убедимся, что директория для загрузок существует (используем абсолютный путь)
    try {
        await fs.mkdir(absoluteAssetsPath, { recursive: true });
        await fs.mkdir(path.join(absoluteAssetsPath, 'posts'), { recursive: true }); // И для постов
        console.log(colors.green(`Static directories ensured/created at ${absoluteAssetsPath}`));
    } catch (error) {
        console.error(colors.red(`Error creating static directories:`), error);
    }

    app.use(staticPlugin({
        assets: assetsFolder,   // <--- Указываем папку относительно корня проекта
        prefix: '/public/images', // <--- Префикс URL остается тот же
        // noCache: true,       // Раскомментируй для разработки, если нужно
        // alwaysStatic: true, // Можно попробовать добавить, если assets не сработает сразу
    }));
    console.log(colors.yellow(`Static file serving enabled at /public/images using assets folder: '${assetsFolder}'`));
    // Ожидаем, что запрос /public/images/posts/file.png будет искать файл в backend/data/images/posts/file.png
    // --- КОНЕЦ ИЗМЕНЕННОГО БЛОКА --



    // Плагин для Swagger документации
    app.use(swagger( /* ... твои настройки swagger ... */ ));

    // Обработка preflight запросов OPTIONS
    app.options("*", (ctx) => {
        ctx.set.status = 204;
        return '';
    });

    // Плагин для настройки CORS
    app.use(cors({
        credentials: true,
        origin: 'http://localhost:3000',
        allowedHeaders: "Origin, X-Requested-With, Content-Type, Accept, Authorization",
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
    }));

    // Базовый роут для проверки работоспособности
    app.get("/", () => {
        return {
            message: `KinoMatch Backend API v${packageJSON.version} is running!`
        };
    });

    // Роут для favicon (опционально)
    app.get("/favicon.ico", async ({ set }) => { /* ... твой код favicon ... */ });

    // --- Глобальные обработчики ошибок ---
    app.onError(({ code, error, set }) => { /* ... твой обработчик ошибок ... */ });

    // --- Группа для всех API роутов ---
    app.group("/api", (apiGroup) =>
        apiGroup
            .use(AuthRoute)
            .use(ProfileRoute)
            .use(ActorsRoute)
            .use(MoviesRoute)
            .use(GenresRoute)
            .use(DirectorsRoute)
            .use(CountriesRoute)
            .use(CompilationsRoute)
            .use(PostsRoute) // Роут постов уже здесь
    );

    // --- Запуск Cron Job для обновления подборок ---
    cron.schedule('0 3 * * *', async () => { /* ... твой cron job ... */ });
    console.log(colors.yellow('Cron job for compilations update scheduled...'));

    // --- Запуск сервера ---
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;
    app.listen(PORT, () => {
        console.log(colors.green(`🚀 Server v${packageJSON.version} started successfully on http://localhost:${PORT}`));
        console.log(colors.blue(`📚 API Documentation available at http://localhost:${PORT}/docs`));
        console.log(colors.magenta(`🖼️ Images will be served from /public/images`)); // Добавим лог
    });
}

bootstrap().catch(err => {
    console.error(colors.red("💥 Failed to bootstrap the application:"), err);
    process.exit(1);
});