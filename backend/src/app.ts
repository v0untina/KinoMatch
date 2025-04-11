// backend/src/app.ts
import Elysia from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { jwt } from '@elysiajs/jwt';
import { staticPlugin } from '@elysiajs/static';
import path from 'path';
import 'dotenv/config';
import colors from "colors";
import packageJSON from "./../package.json"; // Убедитесь, что путь к package.json верный относительно backend/src
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
import { newsRoute } from './route/news.route';

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

    // --- Настройка статики ---
    const assetsFolder = 'data/images'; // Путь относительно корня проекта (backend/)
    const absoluteAssetsPath = path.resolve(process.cwd(), assetsFolder);
    console.log(colors.magenta(`Serving static files from (using assets): ${absoluteAssetsPath}`));
    console.log(colors.magenta(`process.cwd(): ${process.cwd()}`));

    // Убедимся, что директория для загрузок существует
    try {
        await fs.mkdir(absoluteAssetsPath, { recursive: true });
        await fs.mkdir(path.join(absoluteAssetsPath, 'posts'), { recursive: true }); // И для постов
        console.log(colors.green(`Static directories ensured/created at ${absoluteAssetsPath}`));
    } catch (error) {
        console.error(colors.red(`Error creating static directories:`), error);
    }

    app.use(staticPlugin({
        assets: assetsFolder,
        prefix: '/public/images',
        // noCache: true,       // Раскомментируй для разработки, если нужно
        // alwaysStatic: true,
    }));
    console.log(colors.yellow(`Static file serving enabled at /public/images using assets folder: '${assetsFolder}'`));
    // --- КОНЕЦ НАСТРОЙКИ СТАТИКИ --


    // Плагин для Swagger документации
    app.use(swagger({
        documentation: {
            info: {
                title: `KinoMatch API Documentation v${packageJSON.version}`,
                version: packageJSON.version,
                description: `The backend API documentation for the KinoMatch project. Base URL: /api`,
            },
             // Определение схемы безопасности для JWT
            security: [{ BearerAuth: [] }],
            components: {
                securitySchemes: {
                    BearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                        description: 'Enter JWT token prefixed with "Bearer "',
                    }
                }
            },
            tags: [ // Определение тегов для группировки эндпоинтов
                { name: 'Auth', description: 'Authentication endpoints (Login, Register)' },
                { name: 'Profile', description: 'User profile management' },
                { name: 'Movies', description: 'Movie related endpoints' },
                { name: 'Actors', description: 'Actor related endpoints' },
                { name: 'Directors', description: 'Director related endpoints' },
                { name: 'Genres', description: 'Genre related endpoints' },
                { name: 'Countries', description: 'Country related endpoints' },
                { name: 'Compilations', description: 'Movie compilations endpoints' },
                { name: 'Posts', description: 'User posts endpoints' },
                { name: 'News', description: 'External news endpoints' },
            ]
        },
        // Указываем путь, где будет доступна документация
        path: '/docs'
    }));

    // Плагин для настройки CORS - он должен обрабатывать OPTIONS автоматически
    app.use(cors({
        credentials: true,
        origin: 'http://localhost:3000', // Разрешаем запросы с фронтенда
        allowedHeaders: "Origin, X-Requested-With, Content-Type, Accept, Authorization",
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
            // Путь к иконке. Создайте папку public в корне backend, если ее нет, и положите туда иконку
            const faviconPath = path.join(process.cwd(), 'public', 'favicon.ico');
            const file = await fs.readFile(faviconPath);
            set.headers['Content-Type'] = 'image/x-icon';
            return file;
        } catch (e) {
            set.status = 404;
            return 'Not Found';
        }
     });

    // --- Глобальные обработчики ошибок ---
    app.onError(({ code, error, set }) => {
        console.error(colors.red(`[${code}] Error: ${error.message}`));
        // Раскомментируйте следующую строку для детальной отладки в консоли
        // console.error(error.stack);

        // Обработка специфических ошибок Elysia или HTTP статусов
        if (code === 'NOT_FOUND') {
            set.status = 404;
            return { success: false, message: 'Resource not found.' };
        }
        if (code === 'VALIDATION') {
            set.status = 400;
            // Безопасное отображение ошибки валидации
            let validationErrors: any = 'Validation failed.';
            if (error && typeof error.message === 'string') {
                 try {
                     // Попытка парсить, если ошибка содержит JSON
                     const parsed = JSON.parse(error.message);
                     validationErrors = parsed; // Показать распарсенную ошибку
                 } catch (_) {
                     validationErrors = error.message; // Показать исходное сообщение, если не JSON
                 }
            } else if (error instanceof Error) {
                validationErrors = error.message;
            }
            return { success: false, message: 'Validation Error', errors: validationErrors };
        }
        if (code === 'INTERNAL_SERVER_ERROR') {
            set.status = 500;
            return { success: false, message: 'An internal server error occurred.' };
        }

        // По умолчанию - ошибка сервера
        set.status = 500;
        // Не отправляем детали ошибки клиенту в продакшене
        return { success: false, message: 'Something went wrong!' };
     });

    // --- Группа для всех API роутов с префиксом /api ---
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
            .use(PostsRoute)
            .use(newsRoute)
    );

    // --- Запуск Cron Job для обновления подборок ---
    cron.schedule('5 3 * * *', async () => {
        console.log(colors.cyan('Running scheduled job: Updating system compilations by genre...'));
        try {
            await updateSystemCompilationsByGenre();
            console.log(colors.green('System compilations update job completed successfully.'));
        } catch (error) {
            console.error(colors.red('Error during scheduled system compilations update:'), error);
        }
    }, {
        scheduled: true,
        timezone: "Europe/Moscow"
    });
    console.log(colors.yellow('Cron job for compilations update scheduled for 03:05 AM Moscow time...'));


    // --- Запуск Cron Job для парсера новостей ---
    const PARSER_SCRIPT_PATH = path.join(__dirname, '..', '..', 'parser.py'); // Путь к парсеру в корне проекта
    const PYTHON_EXECUTABLE = process.env.PYTHON_EXECUTABLE || 'python3'; // Или 'python'

    cron.schedule('0 3 * * *', () => { // Каждый день в 3:00
        console.log(colors.cyan(`Running scheduled job: Parsing news using ${PYTHON_EXECUTABLE}...`));
        const { spawn } = require('child_process'); // Импорт внутри для ленивой загрузки
        try {
            const pythonProcess = spawn(PYTHON_EXECUTABLE, [PARSER_SCRIPT_PATH]);

            pythonProcess.stdout.on('data', (data: Buffer) => {
                console.log(colors.blue(`[News Parser STDOUT]: ${data.toString().trim()}`));
            });
            pythonProcess.stderr.on('data', (data: Buffer) => {
                console.error(colors.yellow(`[News Parser STDERR]: ${data.toString().trim()}`));
            });
            pythonProcess.on('close', (code: number | null) => { // code может быть null
                if (code === 0) {
                    console.log(colors.green('News parsing job completed successfully.'));
                } else {
                    console.error(colors.red(`News parsing job failed with exit code: ${code ?? 'unknown'}`));
                }
            });
            pythonProcess.on('error', (err: Error) => {
                console.error(colors.red('Failed to start news parser process:'), err);
            });
        } catch (spawnError) {
             console.error(colors.red('Error spawning news parser process:'), spawnError);
        }
    }, {
        scheduled: true,
        timezone: "Europe/Moscow"
    });
    console.log(colors.yellow('Cron job for news parser scheduled for 03:00 AM Moscow time...'));
    // --- КОНЕЦ БЛОКА CRON ДЛЯ ПАРСЕРА ---


    // --- Запуск сервера ---
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;
    if (isNaN(PORT)) {
        console.error(colors.red(`Invalid PORT specified in .env file. Using default 8000.`));
        process.env.PORT = '8000'; // Исправляем для лога ниже
    }
    const effectivePort = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000; // Пересчитываем

    app.listen(effectivePort, () => {
        console.log(colors.green(`🚀 Server v${packageJSON.version} started successfully on http://localhost:${effectivePort}`));
        console.log(colors.blue(`📚 API Documentation available at http://localhost:${effectivePort}/docs`));
        console.log(colors.magenta(`🖼️ Images are served from /public/images (mapped to ${absoluteAssetsPath})`));
    });
}

// Вызов основной асинхронной функции и обработка возможных ошибок при запуске
bootstrap().catch(err => {
    console.error(colors.red("💥 Failed to bootstrap the application:"), err);
    process.exit(1); // Завершаем процесс с кодом ошибки
});

// Экспортируем тип приложения для возможного использования с Elysia Eden
export type App = typeof app;