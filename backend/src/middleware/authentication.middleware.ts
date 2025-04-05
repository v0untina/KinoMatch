import { Elysia, error } from 'elysia'; // <-- Импортируй 'error'
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret';

// Переписываем isAuthenticated как плагин или guard для правильной работы с типами
// Вариант с guard (проще для beforeHandle)
export const checkAuth = async ({ request, store }: { request: Request, store: any }) => {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
        return error(401, 'Missing authorization header');
    }

    const token = authHeader; 

    if (!token) {
        return error(401, 'Missing token');
    }

    try {
        const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret'; // Получаем секрет
        if (!JWT_SECRET) throw new Error("JWT_SECRET not configured!"); // Проверка

        const payload = jwt.verify(token, JWT_SECRET) as { userId: number; };
        // ВАЖНО: Возвращаем объект, который `.guard` добавит в store
        return { userId: payload.userId };
    } catch (err) {
        console.error("Auth Error in checkAuth:", err);
        return error(401, 'Invalid or expired token');
    }
};

// Создаем плагин, который добавляет user в store
export const authPlugin = new Elysia({ name: 'auth-plugin' })
    .derive(checkAuth); // derive попытается добавить результат checkAuth в store

// Теперь isAuthenticated - это просто ссылка на плагин для использования в .guard или .use
export const isAuthenticated = authPlugin;

// Важно: теперь в роуте PostsRoute используй .guard({ beforeHandle: [checkAuth] })
// ИЛИ подключи плагин через .use(isAuthenticated) ПЕРЕД роутом