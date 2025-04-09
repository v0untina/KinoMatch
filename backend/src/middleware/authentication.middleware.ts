// backend/src/middleware/authentication.middleware.ts (ИСПРАВЛЕНО)
import { error } from 'elysia'; // Импортируем error
import jwt from 'jsonwebtoken'; // Используем стандартный jwt для верификации

// Интерфейс для Store
interface AuthStore {
    userId?: number; // userId будет добавляться сюда
    [key: string]: any; // Для других возможных полей (например, от Logestic)
}

// Исправленный checkAuth для beforeHandle
export const checkAuth = async ({ request, store }: { request: Request, store: AuthStore }) => {
    console.log("Running checkAuth middleware..."); // Лог для отладки
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
        console.log("checkAuth failed: Missing authorization header");
        return error(401, 'Отсутствует заголовок авторизации'); // Возвращаем ошибку
    }

    // Ожидаем формат "Bearer <token>" (хотя твой старый код этого не делал)
    // const parts = authHeader.split(' ');
    // if (parts.length !== 2 || parts[0] !== 'Bearer') {
    //     console.log("checkAuth failed: Invalid authorization header format");
    //     return error(401, 'Неверный формат заголовка авторизации (ожидается Bearer token)');
    // }
    // const token = parts[1];

    // Если ты передаешь просто токен без "Bearer "
    const token = authHeader;
     if (!token) {
         console.log("checkAuth failed: Token is empty");
         return error(401, 'Токен отсутствует');
     }


    try {
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
            console.error("FATAL ERROR in checkAuth: JWT_SECRET not configured!");
            return error(500, 'Сервер не настроен для аутентификации'); // Внутренняя ошибка
        }

        // Верифицируем токен
        const payload = jwt.verify(token, JWT_SECRET) as { userId: number; /* ... другие поля, если есть ... */ };

        if (!payload || typeof payload.userId !== 'number') {
            console.log("checkAuth failed: Invalid token payload - userId missing or not a number");
            return error(401, 'Недействительный токен: отсутствует идентификатор пользователя');
        }

        // !!! ГЛАВНОЕ ИЗМЕНЕНИЕ: МОДИФИЦИРУЕМ STORE !!!
        store.userId = payload.userId;
        console.log(`checkAuth successful: userId ${payload.userId} added to store`);

        // !!! НИЧЕГО НЕ ВОЗВРАЩАЕМ (неявно вернется undefined) !!!
        // Это сигнализирует guard, что проверка прошла и нужно идти дальше

    } catch (err: any) {
        console.error("Auth Error in checkAuth:", err.message);
        // Определяем тип ошибки JWT
        if (err.name === 'TokenExpiredError') {
            return error(401, 'Недействительный токен: срок действия истек');
        }
        if (err.name === 'JsonWebTokenError') {
            return error(401, 'Недействительный токен: ошибка подписи');
        }
        // Другие возможные ошибки
        return error(401, 'Недействительный или поврежденный токен');
    }
};

// Убираем ненужный плагин и isAuthenticated, т.к. checkAuth теперь правильный для beforeHandle
// export const authPlugin = ...
// export const isAuthenticated = ...