import { Elysia, t, error } from 'elysia'; // Импортируем error
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
// Импортируем сам хук проверки, а не плагин целиком
import { checkAuth } from '../middleware/authentication.middleware';

const prisma = new PrismaClient();
// Определяем путь относительно текущего файла (__dirname доступен в CommonJS,
// но в ESM с bun/node лучше использовать import.meta.url или process.cwd()
// Будем считать, что __dirname работает или настроен через tsconfig/compiler
// Альтернатива: path.resolve(process.cwd(), 'data/posts.json') если запускаем из корня проекта
const postsFilePath = path.join(__dirname, '../../data/posts.json'); // Путь к JSON файлу

// Интерфейс для объекта поста
interface Post {
    postId: string;
    userId: number;
    username: string;
    userAvatar?: string; // Аватар опционален
    content: string;
    imageUrl?: string; // URL картинки опционален
    timestamp: string; // ISO 8601 формат
    likes?: number;
    comments?: any[]; // Заглушка для комментариев
}

// --- Вспомогательная функция для чтения постов ---
const readPosts = async (): Promise<Post[]> => {
    try {
        // Пытаемся получить доступ к файлу. Если не существует, fs.readFile выбросит ошибку ENOENT
        const data = await fs.readFile(postsFilePath, 'utf-8');
        // Проверяем, что файл не пустой, иначе JSON.parse выдаст ошибку
        if (!data.trim()) {
             return [];
        }
        return JSON.parse(data) as Post[];
    } catch (error: any) {
        // Если файл не найден, создаем его с пустым массивом и возвращаем пустой массив
        if (error.code === 'ENOENT') {
            console.log('Posts file not found, creating with empty array.');
            await writePosts([]); // Создаем пустой файл
            return [];
        }
        // Если ошибка парсинга JSON (например, файл поврежден или пуст некорректно)
        if (error instanceof SyntaxError) {
            console.error('Error parsing posts.json, resetting to empty array.', error);
            await writePosts([]); // Сбрасываем до пустого массива
            return [];
        }
        console.error('Error reading posts file:', error);
        throw new Error('Could not read posts data.');
    }
};

// --- Вспомогательная функция для записи постов ---
const writePosts = async (posts: Post[]) => {
    try {
        // Убедимся, что директория существует
        await fs.mkdir(path.dirname(postsFilePath), { recursive: true });
        await fs.writeFile(postsFilePath, JSON.stringify(posts, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error writing posts file:', error);
        throw new Error('Could not save posts data.');
    }
};


// Убираем префикс отсюда, т.к. он задан в app.ts через .group('/api', ...)
const PostsRoute = new Elysia()

     // --- Получить все посты (не требует аутентификации) ---
    .get('/posts', async ({ set }) => { // Указываем полный путь '/posts' здесь
        try {
            const posts = await readPosts();
            // Сортируем посты по времени (новые вверху)
            posts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            set.status = 200;
            return posts;
        } catch (error: any) {
            console.error('Failed to get posts:', error);
            // Используем встроенный обработчик ошибок Elysia
            return error(500, { message: error.message || 'Failed to get posts' });
        }
    })

     // --- Создать новый пост ---
     // Используем .guard для применения хука и типизации
    .guard({
         beforeHandle: [checkAuth] // Применяем хук проверки аутентификации
    }, (app) => app.post('/posts', async ({ body, store, set }) => { // Указываем полный путь '/posts'
        try {
            // store теперь должен содержать userId напрямую (результат checkAuth)
            const userId = store.userId;

            // Дополнительная проверка, если вдруг checkAuth не отработал как надо
            if (typeof userId !== 'number') {
                 console.error("UserID missing or invalid in store after checkAuth. Store:", store);
                 return error(401, 'Authentication failed or UserID not found in token');
            }

             // Ищем пользователя в БД для получения username
             const user = await prisma.users.findUnique({
                 where: { user_id: userId },
                 select: { username: true /*, avatar_url: true */ }, // Можно добавить выбор аватара, если он есть в модели users
             });

             if (!user) {
                  // Эта ошибка маловероятна, если токен валиден, но лучше проверить
                 console.error(`User with ID ${userId} not found in database.`);
                 return error(404, 'User associated with token not found');
             }

             // Создаем объект нового поста
             const newPost: Post = {
                 postId: uuidv4(),
                 userId: userId,
                 username: user.username,
                  // userAvatar: user.avatar_url || '/interface/defaultAvatar.webp', // Пример получения аватара
                 content: body.content,
                 imageUrl: body.imageUrl || undefined,
                 timestamp: new Date().toISOString(),
                 likes: 0, // Инициализируем лайки
                 comments: [] // Инициализируем комментарии
             };

             // Читаем существующие посты
             const posts = await readPosts();

             // Добавляем новый пост в начало массива
             posts.unshift(newPost);

             // Записываем обновленный массив постов обратно в файл
             await writePosts(posts);

             set.status = 201; // Created
             return newPost; // Возвращаем созданный пост

        } catch (error: any) {
             console.error('Failed to create post:', error);
             // Используем встроенный обработчик ошибок Elysia
             return error(500, { message: error.message || 'Failed to create post' });
         }
     }, {
         // Валидация тела запроса остается здесь
         body: t.Object({
             content: t.String({ minLength: 1, error: "Текст поста не может быть пустым" }),
             imageUrl: t.Optional(t.String({
                 // Можно добавить более строгую валидацию URL, если нужно
                 // format: 'uri', // Встроенный format: 'uri' может быть слишком строгим
                 error: "Неверный формат URL изображения"
             }))
         })
     })
    ); // Конец .guard

export default PostsRoute;