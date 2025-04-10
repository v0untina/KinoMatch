// backend/src/route/posts.route.ts
import Elysia, { t, error } from 'elysia';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { checkAuth } from '../middleware/authentication.middleware'; // Убедись, что путь верный
import colors from 'colors';

// --- Интерфейсы ---
interface Store {
    userId: number; // Должен быть добавлен middleware 'checkAuth'
    [key: string]: any;
}
// Интерфейс для объекта поста (как он хранится в JSON)
interface Post {
    id: string;
    author: string; // Имя пользователя
    text: string;
    createdAt: string; // ISO строка
    imageUrl?: string; // ОТНОСИТЕЛЬНЫЙ URL изображения (e.g., /public/images/posts/uuid.jpg)
    likes: number; // Теперь это обязательное поле
    comments: any[]; // Структура комментов не определена
    // Можно добавить массив ID пользователей, лайкнувших пост, для более сложной логики
    likedBy?: number[];
}
// Интерфейс для ответа клиенту (для GET запросов)
interface ClientPost {
    postId: string;
    username: string;
    content: string;
    timestamp: string;
    imageUrl?: string; // ПОЛНЫЙ URL изображения (e.g., http://localhost:8000/public/...)
    likes: number;
    comments: any[];
    // Можно добавить: isLikedByCurrentUser?: boolean;
}

// --- Инициализация Prisma и пути ---
const prisma = new PrismaClient();
const postsFilePath = path.join(__dirname, '../../data/posts.json'); // Путь к файлу с постами
const imagesDir = path.join(__dirname, '../../data/images/posts'); // Путь к папке для картинок постов
const publicImagePathPrefix = '/public/images/posts'; // URL префикс для картинок (относительно корня сервера)

console.log(colors.yellow('--- Loading posts.route.ts ---'));
console.log('Posts file path:', postsFilePath);
console.log('Post images directory:', imagesDir);
console.log('Public image URL prefix:', publicImagePathPrefix);

// --- Вспомогательная функция для чтения постов из JSON ---
const readPosts = async (): Promise<Post[]> => {
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
        // Парсим и проверяем/дополняем структуру каждого поста
        const posts = (JSON.parse(data) as any[]).map((post): Post => ({
            id: post.id || uuidv4(), // Генерируем ID, если нет
            author: post.author || 'Unknown',
            text: post.text || '',
            createdAt: post.createdAt || new Date().toISOString(),
            imageUrl: post.imageUrl, // Оставляем как есть (undefined или строка)
            likes: post.likes ?? 0, // Устанавливаем 0, если нет
            comments: post.comments ?? [], // Устанавливаем [], если нет
            likedBy: post.likedBy ?? [], // Инициализируем для лайков
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
    console.log(`Attempting to write ${posts.length} posts to: ${postsFilePath}`);
    try {
        await fs.mkdir(path.dirname(postsFilePath), { recursive: true });
        await fs.writeFile(postsFilePath, JSON.stringify(posts, null, 2), 'utf-8');
        // Добавляем явный лог успеха записи
        console.log(colors.green('Posts successfully written to file.'));
    } catch (error: unknown) {
        console.error(colors.red('Error writing posts file:'), error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Could not save posts data: ${errorMessage}`);
    }
};

// --- Формирование полного URL изображения ---
const getFullImageUrl = (relativeUrl?: string): string | undefined => {
    if (!relativeUrl) return undefined;
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    return `${baseUrl.replace(/\/$/, '')}${relativeUrl.startsWith('/') ? '' : '/'}${relativeUrl}`;
};

// --- Роуты для постов ---
const PostsRoute = new Elysia({ prefix: '/posts' }) // Префикс /api/posts

    // --- Получить все посты ---
    .get('/', async ({ set }) => { // Путь: GET /api/posts
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
                comments: post.comments,
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

    // --- Создать новый пост ---
    .guard({
        beforeHandle: [checkAuth]
    }, (app) => app.post('/', async (context) => { // Путь: POST /api/posts
        console.log(colors.bgMagenta.white('--- POST /api/posts HANDLER STARTED ---'));

        const { body, store, set } = context as {
            body: { content: string; image?: File },
            store: Store,
            set: { status: number }
        };
        console.log('Store:', store);
        console.log('Body content:', body.content);
        console.log('Image present:', !!body.image);

        try {
            const userId = store.userId;
            const user = await prisma.users.findUnique({ where: { user_id: userId }, select: { username: true } });

            if (!user || !user.username) {
                return context.error(404, 'Пользователь не найден');
            }

            let relativeImageUrl: string | undefined = undefined;
            let publicImageUrl: string | undefined = undefined;

            // Обработка изображения
            if (body.image && body.image.size > 0) {
                if (!body.image.type.startsWith('image/')) {
                     return context.error(400, 'Недопустимый тип файла.');
                }
                const fileExtension = path.extname(body.image.name) || '.jpg';
                const uniqueFilename = `${uuidv4()}${fileExtension}`;
                const savePath = path.join(imagesDir, uniqueFilename);
                try {
                    await fs.mkdir(imagesDir, { recursive: true });
                    await fs.writeFile(savePath, Buffer.from(await body.image.arrayBuffer()));
                    relativeImageUrl = `${publicImagePathPrefix}/${uniqueFilename}`;
                    publicImageUrl = getFullImageUrl(relativeImageUrl);
                    console.log(colors.green(`Image saved: ${savePath}`));
                    console.log(`Relative URL: ${relativeImageUrl}, Public URL: ${publicImageUrl}`);
                } catch (fileError: any) {
                    console.error(colors.red('Error saving image:'), fileError);
                    return context.error(500, 'Ошибка сохранения изображения.');
                }
            }

            // Создание поста
            const newPost: Post = {
                id: uuidv4(),
                author: user.username,
                text: body.content,
                createdAt: new Date().toISOString(),
                imageUrl: relativeImageUrl,
                likes: 0,
                comments: [],
                likedBy: [], // Инициализируем
            };

            const posts = await readPosts();
            posts.unshift(newPost);
            await writePosts(posts);

            const clientPost: ClientPost = {
                postId: newPost.id,
                username: newPost.author,
                content: newPost.text,
                timestamp: newPost.createdAt,
                imageUrl: publicImageUrl,
                likes: newPost.likes,
                comments: newPost.comments
            };
            set.status = 201;
            console.log(colors.green('--- POST /api/posts Responding ---'), clientPost);
            return clientPost;

        } catch (err: unknown) {
            console.error(colors.red('--- ERROR in POST /api/posts ---'));
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to create post';
            return context.error(500, `Ошибка создания поста: ${errorMessage}`);
        }
    }, {
        body: t.Object({
            content: t.String({ minLength: 1, error: "Текст поста не может быть пустым" }),
            image: t.Optional(t.File({
                 validator: (file) => { /* ... валидация размера и типа ... */ return true; },
                 error: "Ошибка загрузки файла изображения"
            }))
        }),
        type: 'multipart/form-data'
    })
    ) // Закрываем guard для POST /

    // --- Лайкнуть/Дизлайкнуть пост ---
    .guard({
        beforeHandle: [checkAuth]
    }, (app) => app.post('/:postId/like', async (context) => { // Путь: POST /api/posts/:postId/like
        const { params, store, set } = context;
        const postId = params.postId;
        const userId = store.userId;

        console.log(colors.cyan(`--- [LIKE] Received request for Post ID: ${postId} by User ID: ${userId} ---`));

        try {
            console.log(colors.yellow('[LIKE] Reading posts file...'));
            const posts = await readPosts();
            console.log(colors.yellow(`[LIKE] Read ${posts.length} posts. Searching for ID: ${postId}`));

            const postIndex = posts.findIndex(p => p.id === postId);

            if (postIndex === -1) {
                console.error(colors.red(`[LIKE] Post with ID ${postId} not found.`));
                return context.error(404, 'Пост не найден');
            }

            console.log(colors.green(`[LIKE] Post found at index ${postIndex}.`));
            const post = posts[postIndex];
            const oldLikes = post.likes ?? 0;

            // --- ПРОСТАЯ ЛОГИКА: Просто увеличиваем счетчик ---
            post.likes = oldLikes + 1;
            console.log(colors.magenta(`[LIKE] Likes incremented. Old: ${oldLikes}, New: ${post.likes}`));
            // ---

            console.log(colors.yellow('[LIKE] Preparing to write posts file...'));
            console.log('[LIKE] Post object before write:', JSON.stringify(posts[postIndex], null, 2));

            await writePosts(posts); // <--- Запись изменений

            // Явный лог после успешной записи (из writePosts) должен появиться в консоли
            console.log(colors.green('[LIKE] Write operation SHOULD be complete (check logs from writePosts).'));

            set.status = 200;
            const responsePayload = {
                postId: post.id,
                likes: post.likes
            };
            console.log(colors.green('[LIKE] Sending success response:'), responsePayload);
            return responsePayload;

        } catch (err: unknown) {
            console.error(colors.red(`--- [LIKE] ERROR occurred for Post ID: ${postId} ---`));
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to process like';
            // Убедимся, что возвращаем ошибку через context.error
            return context.error(500, `Ошибка обработки лайка: ${errorMessage}`);
        }
    }, {
        params: t.Object({
            postId: t.String({ error: "Неверный ID поста в URL" })
        })
    })
    ) // Закрываем guard для POST /:postId/like
; // Завершаем определение роутов

export default PostsRoute;