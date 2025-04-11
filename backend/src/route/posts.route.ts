// backend/src/route/posts.route.ts
import Elysia, { t, error } from 'elysia';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid'; // Убедитесь, что импортировано
import { checkAuth } from '../middleware/authentication.middleware';
import colors from 'colors'; // Убедитесь, что импортировано

// --- Интерфейсы ---
interface Store {
    userId: number;
    [key: string]: any;
}

// Интерфейс для комментария (можете настроить по своему усмотрению)
interface Comment {
    id: string;
    userId: number;
    authorUsername: string;
    text: string;
    createdAt: string;
    // userAvatar?: string; // Можно добавить позже
}


interface Post {
    id: string;
    author: string;
    text: string;
    createdAt: string;
    imageUrl?: string;
    likes: number;
    // Используем более конкретный тип для комментариев
    comments: Comment[]; // Изменено с any[]
    likedBy?: number[];
}

interface ClientPost {
    postId: string;
    username: string;
    content: string;
    timestamp: string;
    imageUrl?: string;
    likes: number;
    comments: Comment[]; // Используем Comment[]
}

// --- Инициализация Prisma и пути ---
const prisma = new PrismaClient();
const postsFilePath = path.join(__dirname, '../../data/posts.json');
const imagesDir = path.join(__dirname, '../../data/images/posts');
const publicImagePathPrefix = '/public/images/posts';

console.log(colors.yellow('--- Loading posts.route.ts ---'));
console.log('Posts file path:', postsFilePath);
console.log('Post images directory:', imagesDir);
console.log('Public image URL prefix:', publicImagePathPrefix);

// --- Вспомогательная функция для чтения постов из JSON ---
const readPosts = async (): Promise<Post[]> => {
    // ... (код функции readPosts остается без изменений, но убедитесь, что она
    //      корректно инициализирует comments: post.comments ?? [])
    console.log(`Attempting to read posts from: ${postsFilePath}`);
    try {
        try {
            await fs.access(postsFilePath);
        } catch (accessError) {
             console.log('Posts file not found, creating with empty array.');
             await fs.mkdir(path.dirname(postsFilePath), { recursive: true });
             await fs.writeFile(postsFilePath, '[]', 'utf-8');
             return [];
        }

        const data = await fs.readFile(postsFilePath, 'utf-8');
        if (!data.trim()) {
            console.warn('Posts file is empty, returning empty array.');
            return [];
        }
        const posts = (JSON.parse(data) as any[]).map((post): Post => ({
            id: post.id || uuidv4(),
            author: post.author || 'Unknown',
            text: post.text || '',
            createdAt: post.createdAt || new Date().toISOString(),
            imageUrl: post.imageUrl,
            likes: post.likes ?? 0,
            comments: (post.comments ?? []).map((comment: any) => ({ // Добавим базовую структуру коммента при чтении
                id: comment.id || uuidv4(),
                userId: comment.userId || 0, // По-хорошему userId должен быть всегда
                authorUsername: comment.authorUsername || 'Unknown',
                text: comment.text || '',
                createdAt: comment.createdAt || new Date().toISOString(),
            })) as Comment[], // Приводим к типу Comment[]
            likedBy: post.likedBy ?? [],
        }));
        console.log(`Successfully read and validated ${posts.length} posts.`);
        return posts;
    } catch (error: unknown) {
        if (error instanceof SyntaxError) {
            console.error(colors.red('Error parsing posts.json, resetting to empty array:'), error);
            try {
                await fs.writeFile(postsFilePath, '[]', 'utf-8');
            } catch (writeError) {
                 console.error(colors.red('Failed to reset corrupted posts.json file:'), writeError);
            }
            return [];
        }
        console.error(colors.red('Error reading posts file:'), error);
        throw new Error(`Could not read posts data.`);
    }
};

// --- Вспомогательная функция для записи постов в JSON ---
const writePosts = async (posts: Post[]) => {
    // ... (код функции writePosts остается без изменений)
    console.log(`Attempting to write ${posts.length} posts to: ${postsFilePath}`);
    try {
        await fs.mkdir(path.dirname(postsFilePath), { recursive: true });
        await fs.writeFile(postsFilePath, JSON.stringify(posts, null, 2), 'utf-8');
        console.log(colors.green('Posts successfully written to file.'));
    } catch (error: unknown) {
        console.error(colors.red('Error writing posts file:'), error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Could not save posts data: ${errorMessage}`);
    }
};

// --- Формирование полного URL изображения ---
const getFullImageUrl = (relativeUrl?: string): string | undefined => {
    // ... (код функции getFullImageUrl остается без изменений)
    if (!relativeUrl) return undefined;
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    return `${baseUrl.replace(/\/$/, '')}${relativeUrl.startsWith('/') ? '' : '/'}${relativeUrl}`;
};

// --- Роуты для постов ---
const PostsRoute = new Elysia({ prefix: '/posts' })

    // --- Получить все посты ---
    .get('/', async ({ set }) => {
        // ... (код GET / остается без изменений, но теперь использует ClientPost с Comment[])
        console.log(colors.cyan('--- GET /api/posts Request Received ---'));
        try {
            const posts = await readPosts();
            const clientPosts: ClientPost[] = posts.map(post => ({
                postId: post.id,
                username: post.author,
                content: post.text,
                timestamp: post.createdAt,
                imageUrl: getFullImageUrl(post.imageUrl),
                likes: post.likes,
                comments: post.comments, // Теперь это массив Comment[]
            }));
            clientPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            set.status = 200;
            console.log(colors.green(`--- GET /api/posts Responding with ${clientPosts.length} posts ---`));
            return clientPosts;
        } catch (err: unknown) {
            console.error(colors.red('--- ERROR in GET /api/posts ---'));
            console.error(err);
            const message = err instanceof Error ? err.message : 'Failed to get posts';
            return error(500, { message });
        }
    })

    // --- Роуты, требующие аутентификации ---
    .guard({
        beforeHandle: [checkAuth]
    }, (app) => app

        // --- ИСПРАВЛЕННЫЙ обработчик Создать новый пост ---
        .post('/', async (context) => {
            console.log(colors.bgMagenta.white('--- POST /api/posts HANDLER STARTED ---'));

            // Деструктурируем context ПРАВИЛЬНО
            const { body, store, set, error } = context as { // Добавляем 'error' для удобства
                body: { content: string; image?: File | undefined }, // Уточняем тип image
                store: Store,
                set: { status: number },
                error: (status: number, message: string | object) => Response // Типизация функции error
            };

            console.log('Store (userId):', store.userId);
            console.log('Body content:', body.content);
            console.log('Image present:', !!body.image);

            try { // --- НАЧАЛО TRY БЛОКА ---

                const userId = store.userId;

                // --- ВОТ ЭТА ЧАСТЬ БЫЛА ПРОПУЩЕНА ---
                // Получаем пользователя из базы данных
                console.log(colors.yellow(`Fetching user data for ID: ${userId}...`));
                const userFromDb = await prisma.users.findUnique({ // Используем другое имя временно, чтобы избежать конфликта имен
                    where: { user_id: userId },
                    select: { username: true }
                });

                if (!userFromDb || !userFromDb.username) {
                    console.error(colors.red(`User not found for ID: ${userId}`));
                    // Используем context.error для возврата ошибки
                    return error(404, 'Пользователь не найден');
                }
                console.log(colors.green(`User found for post creation: ${userFromDb.username}`));
                // --- КОНЕЦ ПРОПУЩЕННОЙ ЧАСТИ ---


                let relativeImageUrl: string | undefined = undefined;
                let publicImageUrl: string | undefined = undefined;

                // --- Обработка изображения (оставляем как было) ---
                if (body.image && body.image instanceof File && body.image.size > 0) { // Добавляем проверку instanceof File
                    console.log(`Processing image: ${body.image.name}, size: ${body.image.size}, type: ${body.image.type}`);
                    if (!body.image.type.startsWith('image/')) {
                        console.error(colors.red('Invalid file type uploaded.'));
                        return error(400, 'Недопустимый тип файла. Пожалуйста, загрузите изображение.');
                    }
                    const fileExtension = path.extname(body.image.name) || '.jpg'; // Значение по умолчанию
                    const uniqueFilename = `${uuidv4()}${fileExtension}`;
                    const savePath = path.join(imagesDir, uniqueFilename);

                    try {
                        await fs.mkdir(imagesDir, { recursive: true });
                        // Используем ArrayBuffer для записи файла
                        const buffer = Buffer.from(await body.image.arrayBuffer());
                        await fs.writeFile(savePath, buffer);

                        relativeImageUrl = `${publicImagePathPrefix}/${uniqueFilename}`;
                        publicImageUrl = getFullImageUrl(relativeImageUrl);
                        console.log(colors.green(`Image saved successfully: ${savePath}`));
                        console.log(`Relative URL: ${relativeImageUrl}, Public URL: ${publicImageUrl}`);
                    } catch (fileError: any) {
                        console.error(colors.red('Error saving image file:'), fileError);
                        // Возвращаем ошибку сервера, если не удалось сохранить файл
                        return error(500, 'Ошибка сервера при сохранении изображения.');
                    }
                } else {
                    console.log('No image uploaded or image data is invalid.');
                }
                // --- КОНЕЦ ОБРАБОТКИ ИЗОБРАЖЕНИЯ ---


                // --- Создание поста (теперь userFromDb определен) ---
                const newPost: Post = {
                    id: uuidv4(),
                    author: userFromDb.username, // Используем данные из userFromDb
                    text: body.content,
                    createdAt: new Date().toISOString(),
                    imageUrl: relativeImageUrl, // Используем относительный URL для хранения
                    likes: 0,
                    comments: [],
                    likedBy: [],
                };
                console.log('New post data created:', newPost);

                // Читаем существующие посты
                const posts = await readPosts();
                // Добавляем новый пост в начало массива
                posts.unshift(newPost);
                // Записываем обновленный массив постов
                await writePosts(posts);

                // --- Формируем ответ клиенту ---
                const clientPost: ClientPost = {
                    postId: newPost.id,
                    username: newPost.author,
                    content: newPost.text,
                    timestamp: newPost.createdAt,
                    imageUrl: publicImageUrl, // Отправляем полный URL клиенту
                    likes: newPost.likes,
                    comments: newPost.comments
                };

                set.status = 201; // Created
                console.log(colors.green('--- POST /api/posts Responding successfully ---'), clientPost);
                return clientPost; // Возвращаем созданный пост клиенту

            } catch (err: unknown) { // --- НАЧАЛО CATCH БЛОКА ---
                console.error(colors.red('--- ERROR in POST /api/posts ---'));
                console.error(err); // Логируем полную ошибку для отладки

                // Бросаем ошибку дальше, чтобы сработал глобальный обработчик onError в app.ts
                // Он вернет стандартизированный ответ 500
                throw err;
            } // --- КОНЕЦ CATCH БЛОКА ---

        }, { // Валидация для POST /
            body: t.Object({
                content: t.String({ minLength: 1, error: "Текст поста не может быть пустым" }),
                // Тип File в t.Optional для валидации загрузки файлов
                image: t.Optional(t.File({
                    // Можно добавить валидацию типа и размера здесь, если нужно
                    // type: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
                    // maxSize: '5m', // Например, 5 мегабайт
                    error: "Недопустимый файл изображения"
                 }))
            }),
            type: 'multipart/form-data' // Указываем, что ожидаем FormData
        }) // Конец POST /

        // --- Лайкнуть/Дизлайкнуть пост ---
        .post('/:postId/like', async (context) => {
            // ... (код POST /:postId/like остается пока без изменений - только инкремент)
            const { params, store, set } = context;
            const postId = params.postId;
            const userId = store.userId;
            console.log(colors.cyan(`--- [LIKE] Received request for Post ID: ${postId} by User ID: ${userId} ---`));
            try {
                const posts = await readPosts();
                const postIndex = posts.findIndex(p => p.id === postId);
                if (postIndex === -1) {
                    return context.error(404, 'Пост не найден');
                }
                const post = posts[postIndex];
                // !!! ЗДЕСЬ НУЖНА ЛОГИКА LIKE/UNLIKE С ПРОВЕРКОЙ likedBy !!!
                // Пока просто инкремент для совместимости с предыдущим кодом:
                post.likes = (post.likes ?? 0) + 1;
                post.likedBy = post.likedBy ?? []; // Убедимся что массив есть
                if (!post.likedBy.includes(userId)) { // Добавим в likedBy если еще нет
                    post.likedBy.push(userId);
                }
                console.log(colors.magenta(`[LIKE] Likes logic executed. New count: ${post.likes}, LikedBy: ${post.likedBy.length}`));
                // ---
                await writePosts(posts);
                set.status = 200;
                const responsePayload = { postId: post.id, likes: post.likes };
                console.log(colors.green('[LIKE] Sending success response:'), responsePayload);
                return responsePayload;
            } catch (err: unknown) {
                console.error(colors.red(`--- [LIKE] ERROR occurred for Post ID: ${postId} ---`), err);
                const errorMessage = err instanceof Error ? err.message : 'Failed to process like';
                return context.error(500, `Ошибка обработки лайка: ${errorMessage}`);
            }
        }, { // Валидация для POST /:postId/like
            params: t.Object({
                postId: t.String({ error: "Неверный ID поста в URL" })
            })
        }) // Конец POST /:postId/like


        // --- ДОБАВИТЬ КОММЕНТАРИЙ К ПОСТУ ---
        .post('/:postId/comments', async (context) => {
            const { params, body, store, set } = context as {
                params: { postId: string },
                body: { text: string }, // Ожидаем текст комментария в теле
                store: { userId: number }, // Получаем userId из checkAuth
                set: { status: number }
            };
            const postId = params.postId;
            const userId = store.userId;
            const commentText = body.text;

            console.log(colors.cyan(`--- [COMMENT] Received request for Post ID: ${postId} by User ID: ${userId} ---`));
            console.log(`[COMMENT] Comment text: "${commentText}"`);


            // Валидация текста комментария
            if (!commentText || !commentText.trim()) {
                 console.error(colors.red('[COMMENT] Error: Comment text is empty.'));
                 return context.error(400, 'Текст комментария не может быть пустым');
            }

            try {
                // Получаем имя пользователя из БД
                console.log(colors.yellow(`[COMMENT] Fetching user data for ID: ${userId}...`));
                const user = await prisma.users.findUnique({
                    where: { user_id: userId },
                    select: { username: true } // Выбираем только имя пользователя
                });

                if (!user || !user.username) {
                    console.error(colors.red(`[COMMENT] Error: User with ID ${userId} not found in database.`));
                    return context.error(404, 'Пользователь не найден');
                }
                console.log(colors.green(`[COMMENT] User found: ${user.username}`));

                // Читаем все посты
                console.log(colors.yellow('[COMMENT] Reading posts file...'));
                const posts = await readPosts();

                // Ищем пост по ID
                const postIndex = posts.findIndex(p => p.id === postId);
                if (postIndex === -1) {
                    console.error(colors.red(`[COMMENT] Error: Post with ID ${postId} not found.`));
                    return context.error(404, 'Пост не найден');
                }
                console.log(colors.green(`[COMMENT] Post found at index ${postIndex}.`));

                const post = posts[postIndex];

                // Создаем объект нового комментария
                const newComment: Comment = {
                    id: uuidv4(), // Генерируем уникальный ID для комментария
                    userId: userId,
                    authorUsername: user.username, // Используем имя из БД
                    text: commentText.trim(), // Обрезаем пробелы
                    createdAt: new Date().toISOString() // Текущее время
                };
                console.log('[COMMENT] New comment object created:', newComment);

                // Добавляем комментарий в массив комментариев поста
                // readPosts уже должен инициализировать post.comments как [], но проверим на всякий случай
                post.comments = post.comments ?? [];
                post.comments.push(newComment);
                console.log(colors.magenta(`[COMMENT] Comment added to post. Total comments: ${post.comments.length}`));


                // Записываем обновленный массив постов обратно в файл
                console.log(colors.yellow('[COMMENT] Preparing to write posts file...'));
                await writePosts(posts);

                // Отправляем успешный ответ
                set.status = 201; // 201 Created
                // Возвращаем обновленный пост целиком, чтобы фронтенд мог обновить свое состояние
                 const clientPostResponse: ClientPost = {
                    postId: post.id,
                    username: post.author,
                    content: post.text,
                    timestamp: post.createdAt,
                    imageUrl: getFullImageUrl(post.imageUrl),
                    likes: post.likes,
                    comments: post.comments // Возвращаем обновленный массив комментов
                };
                console.log(colors.green('[COMMENT] Sending success response with updated post.'));
                return clientPostResponse;


            } catch (err: unknown) {
                console.error(colors.red(`--- [COMMENT] ERROR occurred while adding comment to Post ID: ${postId} ---`));
                console.error(err);
                const errorMessage = err instanceof Error ? err.message : 'Failed to add comment';
                return context.error(500, `Ошибка добавления комментария: ${errorMessage}`);
            }
        }, { // Валидация для POST /:postId/comments
            params: t.Object({ // Убедимся, что postId ожидается
                postId: t.String()
            }),
            body: t.Object({ // Ожидаем объект с полем text
                text: t.String({
                    minLength: 1,
                    error: "Текст комментария не может быть пустым"
                })
            })
        }) // Конец POST /:postId/comments


    ) // Закрываем guard
; // Завершаем определение роутов

export default PostsRoute;