// backend/src/app.ts
import Elysia from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { jwt } from '@elysiajs/jwt';
import { staticPlugin } from '@elysiajs/static';
import path from 'path';
import 'dotenv/config';
import colors from "colors";
import packageJSON from "./../package.json";
import { Logestic } from 'logestic';
import fs from 'node:fs/promises';
import cron from 'node-cron'; // <--- ДОБАВЛЕНО: Импорт node-cron
import { PrismaClient } from '@prisma/client'; // <--- ДОБАВЛЕНО: Импорт PrismaClient
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

// --- Инициализация Prisma (если нужна глобально) ---
// const prisma = new PrismaClient();
// ---

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
    // (твой код настройки статики остается без изменений)
    const assetsFolder = 'data/images';
    const absoluteAssetsPath = path.resolve(process.cwd(), assetsFolder);
    console.log(colors.magenta(`Serving static files from (using assets): ${absoluteAssetsPath}`));
    console.log(colors.magenta(`process.cwd(): ${process.cwd()}`));
    try {
        await fs.mkdir(absoluteAssetsPath, { recursive: true });
        await fs.mkdir(path.join(absoluteAssetsPath, 'posts'), { recursive: true });
        console.log(colors.green(`Static directories ensured/created at ${absoluteAssetsPath}`));
    } catch (error) {
        console.error(colors.red(`Error creating static directories:`), error);
    }
    app.use(staticPlugin({
        assets: assetsFolder,
        prefix: '/public/images',
    }));
    console.log(colors.yellow(`Static file serving enabled at /public/images using assets folder: '${assetsFolder}'`));
    // --- КОНЕЦ НАСТРОЙКИ СТАТИКИ --

    // Плагин для Swagger документации
    // (твой код Swagger остается без изменений)
     app.use(swagger({
        documentation: {
            info: {
                title: `KinoMatch API Documentation v${packageJSON.version}`,
                version: packageJSON.version,
                description: `The backend API documentation for the KinoMatch project. Base URL: /api`,
            },
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
            tags: [
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
        path: '/docs'
    }));

    // Плагин для настройки CORS
    // (твой код CORS остается без изменений)
    app.use(cors({
        credentials: true,
        origin: 'http://localhost:3000',
        allowedHeaders: "Origin, X-Requested-With, Content-Type, Accept, Authorization",
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
    }));

    // Базовый роут
    // (твой базовый роут остается без изменений)
    app.get("/", () => {
        return {
            message: `KinoMatch Backend API v${packageJSON.version} is running!`
        };
    });

    // Роут для favicon
    // (твой роут favicon остается без изменений)
    app.get("/favicon.ico", async ({ set }) => {
         try {
            const faviconPath = path.join(process.cwd(), 'public', 'favicon.ico');
            const file = await fs.readFile(faviconPath);
            set.headers['Content-Type'] = 'image/x-icon';
            return file;
        } catch (e) {
            set.status = 404;
            return 'Not Found';
        }
     });

    // Глобальные обработчики ошибок
    // (твой код onError остается без изменений)
    app.onError(({ code, error, set }) => {
        console.error(colors.red(`[${code}] Error: ${error.message}`));
        if (code === 'NOT_FOUND') { set.status = 404; return { success: false, message: 'Resource not found.' }; }
        if (code === 'VALIDATION') {
            set.status = 400; let validationErrors: any = 'Validation failed.';
            if (error && typeof error.message === 'string') { try { const parsed = JSON.parse(error.message); validationErrors = parsed; } catch (_) { validationErrors = error.message; }} else if (error instanceof Error) { validationErrors = error.message; }
            return { success: false, message: 'Validation Error', errors: validationErrors };
        }
        if (code === 'INTERNAL_SERVER_ERROR') { set.status = 500; return { success: false, message: 'An internal server error occurred.' }; }
        set.status = 500; return { success: false, message: 'Something went wrong!' };
     });


    // Группа для всех API роутов
    // (твой код app.group остается без изменений)
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

    // --- БЛОК CRON ДЛЯ ОБНОВЛЕНИЯ ПОДБОРОК (ТВОЙ СУЩЕСТВУЮЩИЙ) ---
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
    // --- КОНЕЦ БЛОКА CRON ДЛЯ ПОДБОРОК ---


    // --- БЛОК CRON ДЛЯ ПАРСЕРА НОВОСТЕЙ (ТВОЙ СУЩЕСТВУЮЩИЙ) ---
    const PARSER_SCRIPT_PATH = path.join(__dirname, '..', '..', 'parser.py');
    const PYTHON_EXECUTABLE = process.env.PYTHON_EXECUTABLE || 'python3';

    cron.schedule('0 3 * * *', () => {
        console.log(colors.cyan(`Running scheduled job: Parsing news using ${PYTHON_EXECUTABLE}...`));
        const { spawn } = require('child_process');
        try {
            const pythonProcess = spawn(PYTHON_EXECUTABLE, [PARSER_SCRIPT_PATH]);
            pythonProcess.stdout.on('data', (data: Buffer) => console.log(colors.blue(`[News Parser STDOUT]: ${data.toString().trim()}`)));
            pythonProcess.stderr.on('data', (data: Buffer) => console.error(colors.yellow(`[News Parser STDERR]: ${data.toString().trim()}`)));
            pythonProcess.on('close', (code: number | null) => { if (code === 0) console.log(colors.green('News parsing job completed successfully.')); else console.error(colors.red(`News parsing job failed with exit code: ${code ?? 'unknown'}`)); });
            pythonProcess.on('error', (err: Error) => console.error(colors.red('Failed to start news parser process:'), err));
        } catch (spawnError) {
             console.error(colors.red('Error spawning news parser process:'), spawnError);
        }
    }, {
        scheduled: true,
        timezone: "Europe/Moscow"
    });
    console.log(colors.yellow('Cron job for news parser scheduled for 03:00 AM Moscow time...'));
    // --- КОНЕЦ БЛОКА CRON ДЛЯ ПАРСЕРА ---


   // --- БЛОК РАСЧЕТА РЕЙТИНГА ---

// Интерфейс для поста из JSON
interface PostFromJson {
    id: string;
    author: string;
    text?: string;
    createdAt: string;
    likes: number;
    comments?: any[];
    likedBy?: number[];
    imageUrl?: string;
}

// Функция расчета рейтинга
async function runRatingCalculation() {
    console.log(`[CronJob] [${new Date().toISOString()}] Running scheduled user rating calculation (Posts Only)...`);
    const localPrisma = new PrismaClient();
    const POINTS_PER_POST_LIKE = 1; // Оставляем только вес для лайков постов
    // const POINTS_PER_COMPILATION_FAVORITE = 5; // --- ЗАКОММЕНТИРОВАНО/УДАЛЕНО ---
    let updatedUsersCount = 0;
    let errorCount = 0;

    // --- Чтение и парсинг posts.json ---
    let postsData: PostFromJson[] = [];
    const postsJsonPath = path.join(__dirname, '..', 'data', 'posts.json');
    try {
        console.log(`[CronJob:Rating] Attempting to read posts data from: ${postsJsonPath}`);
        const postsFileContent = await fs.readFile(postsJsonPath, 'utf-8');
        postsData = JSON.parse(postsFileContent);
        if (!Array.isArray(postsData)) {
            throw new Error('Parsed posts.json is not an array.');
        }
        console.log(`[CronJob:Rating] Successfully read and parsed ${postsData.length} posts from posts.json`);
    } catch (fileError: any) {
        console.error(colors.red(`[CronJob:Rating] FATAL ERROR: Could not read or parse posts.json at ${postsJsonPath}. Aborting rating calculation. Error: ${fileError.message}`));
        await localPrisma.$disconnect().catch(e => console.error("Error disconnecting prisma after file error:", e));
        return;
    }
    // --- Конец чтения JSON ---

    try {
        const users = await localPrisma.users.findMany({
            select: { user_id: true, username: true },
        });
        console.log(`[CronJob:Rating] Found ${users.length} users to process.`);

        for (const user of users) {
            try {
                // 1. Считаем лайки постов из JSON
                const totalPostLikes = postsData
                    .filter(post => post.author === user.username)
                    .reduce((sum, post) => sum + (post.likes ?? 0), 0);

                // 2. --- БЛОК ПОДСЧЕТА ИЗБРАННЫХ ПОДБОРОК ЗАКОММЕНТИРОВАН/УДАЛЕН ---
                /*
                const compilationFavoriteCount = await localPrisma.user_collection_favorites.count({
                    where: {
                        user_movie_collections: { user_id: user.user_id },
                        user_id: { not: user.user_id },
                    },
                });
                const totalCompilationFavorites = compilationFavoriteCount;
                */
               const totalCompilationFavorites = 0; // Просто ставим 0, пока нет функционала

                // 3. Рассчитываем рейтинг (теперь только по лайкам)
                const calculatedRating = totalPostLikes * POINTS_PER_POST_LIKE;
                // Старая формула: (totalPostLikes * POINTS_PER_POST_LIKE) + (totalCompilationFavorites * POINTS_PER_COMPILATION_FAVORITE);

                // 4. Обновляем рейтинг в БД
                await localPrisma.users.update({
                    where: { user_id: user.user_id },
                    data: { rating: calculatedRating },
                });
                updatedUsersCount++;
            } catch (userError: any) {
                // Добавим проверку, чтобы не падать, если ошибка именно с user_collection_favorites,
                // хотя мы и закомментировали вызов count()
                if (!(userError instanceof TypeError && userError.message.includes("user_collection_favorites"))) {
                     console.error(colors.red(`[CronJob:Rating] Error processing user ${user.user_id} (${user.username}): ${userError.message}`));
                     errorCount++;
                } else {
                    // Игнорируем ошибку, связанную с отсутствующей таблицей (на всякий случай)
                    console.warn(colors.yellow(`[CronJob:Rating] Ignored known error related to missing 'user_collection_favorites' for user ${user.user_id}`));
                }
            }
        } // Конец цикла for
        console.log(colors.green(`[CronJob:Rating] Finished calculation. Users updated: ${updatedUsersCount}. Errors: ${errorCount}.`));
    } catch (dbError: any) {
        console.error(colors.red('[CronJob:Rating] Fatal database error during rating calculation process:'), dbError);
    } finally {
        await localPrisma.$disconnect().catch(e => console.error("Error disconnecting prisma:", e));
        console.log(colors.blue('[CronJob:Rating] Local Prisma client for calculation disconnected.'));
    }
}

// Настройка Cron для расчета рейтинга (остается как было)
const ratingCronSchedule = '0 4 * * *'; // Например, каждый день в 4:00 утра
if (cron.validate(ratingCronSchedule)) {
    console.log(colors.yellow(`[CronJob:Rating] Scheduling user rating calculation (Posts Only) with pattern: "${ratingCronSchedule}"`));
    cron.schedule(ratingCronSchedule, runRatingCalculation, {
        scheduled: true,
        timezone: "Europe/Moscow"
    });
    // Немедленный запуск для теста
    console.log(colors.blue('[CronJob:Rating] Performing initial rating calculation (Posts Only) on startup...'));
    runRatingCalculation(); // <-- Раскомментировал для немедленного теста
} else {
    console.error(colors.red(`[CronJob:Rating] Invalid cron schedule pattern: "${ratingCronSchedule}". Rating calculation task will not run.`));
}
// --- КОНЕЦ БЛОКА РАСЧЕТА РЕЙТИНГА ---


    // --- Запуск сервера ---
    // (твой код запуска сервера остается без изменений)
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;
    if (isNaN(PORT)) {
        console.error(colors.red(`Invalid PORT specified in .env file. Using default 8000.`));
        process.env.PORT = '8000';
    }
    const effectivePort = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;
    app.listen(effectivePort, () => {
        console.log(colors.green(`🚀 Server v${packageJSON.version} started successfully on http://localhost:${effectivePort}`));
        console.log(colors.blue(`📚 API Documentation available at http://localhost:${effectivePort}/docs`));
        console.log(colors.magenta(`🖼️ Images are served from /public/images (mapped to ${absoluteAssetsPath})`));
    });
}

// Вызов основной асинхронной функции
bootstrap().catch(err => {
    console.error(colors.red("💥 Failed to bootstrap the application:"), err);
    process.exit(1);
});



// Экспортируем тип приложения
export type App = typeof app;