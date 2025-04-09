// backend/src/route/posts.route.ts 
import Elysia, { t, error } from 'elysia'; // Добавили error обратно
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { checkAuth } from '../middleware/authentication.middleware';
import colors from 'colors';

// --- Интерфейсы ---
interface Store {
    userId: number; // Теперь он точно должен быть тут
    [key: string]: any;
}
// Интерфейс для объекта поста (как он хранится в JSON)
interface Post {
    id: string;
    author: string;
    text: string;
    createdAt: string;
    imageUrl?: string; // URL изображения (опционально)
    likes?: number;
    comments?: any[]; // Структура комментов не определена
}
// Интерфейс для ответа клиенту
interface ClientPost {
    postId: string;
    username: string;
    content: string;
    timestamp: string; // ISO строка
    imageUrl?: string;
    likes?: number;
    comments?: any[];
}

// --- Инициализация Prisma и пути к файлу ---
const prisma = new PrismaClient();
const postsFilePath = path.join(__dirname, '../../data/posts.json'); // Путь к файлу с постами
console.log(colors.yellow('--- Loading posts.route.ts (Step 4: Restoring Main Logic) ---'));
console.log('Posts file path:', postsFilePath);

// --- Вспомогательная функция для чтения постов из JSON ---
const readPosts = async (): Promise<Post[]> => {
    console.log(`Attempting to read posts from: ${postsFilePath}`);
    try {
        // Проверяем существование файла перед чтением
        try {
            await fs.access(postsFilePath);
        } catch (accessError) {
             console.log('Posts file not found, creating with empty array.');
             await fs.mkdir(path.dirname(postsFilePath), { recursive: true }); // Убедимся, что директория есть
             await fs.writeFile(postsFilePath, '[]', 'utf-8'); // Создаем пустой массив
             return [];
        }

        // Читаем файл
        const data = await fs.readFile(postsFilePath, 'utf-8');
        if (!data.trim()) {
            console.warn('Posts file is empty, returning empty array.');
            return [];
        }
        const posts = JSON.parse(data) as Post[];
        console.log(`Successfully read ${posts.length} posts.`);
        return posts;
    } catch (error: unknown) {
        if (error instanceof SyntaxError) {
            console.error(colors.red('Error parsing posts.json, resetting to empty array:'), error);
            // Попытка записать пустой массив, чтобы исправить файл
            try {
                await fs.writeFile(postsFilePath, '[]', 'utf-8');
            } catch (writeError) {
                 console.error(colors.red('Failed to reset corrupted posts.json file:'), writeError);
            }
            return []; // Возвращаем пустой массив в случае ошибки парсинга
        }
        console.error(colors.red('Error reading posts file:'), error);
        // В случае других ошибок чтения, выбрасываем исключение, чтобы его поймал обработчик роута
        throw new Error(`Could not read posts data.`);
    }
};

// --- Вспомогательная функция для записи постов в JSON ---
const writePosts = async (posts: Post[]) => {
    console.log(`Attempting to write ${posts.length} posts to: ${postsFilePath}`);
    try {
        // Убедимся, что директория существует
        await fs.mkdir(path.dirname(postsFilePath), { recursive: true });
        // Записываем данные с форматированием
        await fs.writeFile(postsFilePath, JSON.stringify(posts, null, 2), 'utf-8');
        console.log(colors.green('Posts successfully written to file.'));
    } catch (error: unknown) {
        console.error(colors.red('Error writing posts file:'), error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        // Выбрасываем исключение, чтобы его поймал обработчик роута
        throw new Error(`Could not save posts data: ${errorMessage}`);
    }
};

// --- Роуты для постов ---
const PostsRoute = new Elysia()
    // --- Получить все посты ---
    .get('/posts', async ({ set }) => {
        console.log(colors.cyan('--- GET /api/posts Request Received ---'));
        try {
            const posts = await readPosts();
            // Преобразуем в формат для клиента
            const clientPosts: ClientPost[] = posts.map(post => ({
                postId: post.id,
                username: post.author,
                content: post.text,
                timestamp: post.createdAt,
                imageUrl: post.imageUrl,
                likes: post.likes ?? 0, // Фоллбэк на 0
                comments: post.comments ?? [] // Фоллбэк на пустой массив
            }));
            // Сортировка по дате (новые сверху)
            clientPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            set.status = 200;
            console.log(colors.green(`--- GET /api/posts Responding with ${clientPosts.length} posts ---`));
            return clientPosts;
        } catch (err: unknown) {
            console.error(colors.red('--- ERROR in GET /api/posts ---'));
            console.error(err);
            const message = err instanceof Error ? err.message : 'Failed to get posts';
            // Используем встроенный error
            return error(500, { message });
        }
    })
    // --- Создать новый пост ---
    .guard({
        beforeHandle: [checkAuth] // Используем исправленный checkAuth
    }, (app) => app.post('/posts', async (context) => { // Используем context
        console.log(colors.bgMagenta.white('--- FULL POST /api/posts HANDLER STARTED ---'));

        // Деструктурируем из context
        const { body, store, set } = context as {
            body: { content: string; imageUrl?: string }, // Тело валидировано схемой
            store: Store, // store содержит userId
            set: { status: number }
        };

        console.log('Store in full handler:', store);
        console.log('Body in full handler:', body);

        try {
            const userId = store.userId;
            console.log('Извлечен userId:', userId);

            // Получаем имя пользователя из БД
            const user = await prisma.users.findUnique({
                where: { user_id: userId },
                select: { username: true },
            });
            console.log('Найден пользователь в БД:', user);

            if (!user || !user.username) {
                console.error(`User with ID ${userId} not found or has no username.`);
                return context.error(404, { message: 'Пользователь не найден или не имеет имени пользователя' });
            }

            // Создаем новый объект поста для JSON
            const newPost: Post = {
                id: uuidv4(), // Генерируем уникальный ID
                author: user.username, // Имя пользователя из БД
                text: body.content, // Текст из запроса
                createdAt: new Date().toISOString(), // Текущее время в ISO
                imageUrl: body.imageUrl || undefined, // URL картинки из запроса (или undefined)
                likes: 0, // Начальное количество лайков
                comments: [] // Начальный пустой массив комментов
            };
            console.log('Созданный пост для записи в JSON:', newPost);

            // Читаем текущие посты
            const posts = await readPosts();
            console.log(`Прочитано ${posts.length} существующих постов.`);

            // Добавляем новый пост в начало массива
            posts.unshift(newPost);
            console.log(`Новый пост добавлен. Всего постов: ${posts.length}.`);

            // Записываем обновленный массив обратно в файл
            await writePosts(posts);
            console.log('Обновленный список постов успешно записан в файл.');

            // Формируем ответ для клиента (формат ClientPost)
            const clientPost: ClientPost = {
                postId: newPost.id,
                username: newPost.author,
                content: newPost.text,
                timestamp: newPost.createdAt,
                imageUrl: newPost.imageUrl,
                likes: newPost.likes,
                comments: newPost.comments
            };

            set.status = 201; // Статус Created
            console.log(colors.green('--- FULL POST /api/posts Responding to client ---'), clientPost);
            return clientPost; // Возвращаем созданный пост клиенту

        } catch (err: unknown) {
            console.error(colors.red('--- ERROR in FULL POST /api/posts HANDLER ---'));
            console.error(err); // Логируем полную ошибку
            const errorMessage = err instanceof Error ? err.message : 'Failed to create post';
            // Возвращаем ошибку 500
            return context.error(500, { message: `Ошибка при создании поста: ${errorMessage}` });
        }
    }, { // Схема валидации тела запроса
        body: t.Object({
            content: t.String({ minLength: 1, error: "Текст поста не может быть пустым" }),
            imageUrl: t.Optional(t.String({ error: "Неверный формат URL изображения" }))
            // Если нужно строже проверять URL:
            // imageUrl: t.Optional(t.String({ format: 'url', error: "Неверный формат URL изображения" }))
        })
    })
);

export default PostsRoute;