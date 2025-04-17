// backend/src/route/compilations.route.ts
import { Elysia, t } from 'elysia';
import {
    getSystemCompilations,
    getCompilationDetails,
    createUserCompilation, // Функция для создания подборки
    getUserCompilations,   // Функция для получения подборок пользователя
    publishUserCompilation,   
    getPublishedCompilations
} from '../service/compilations.service'; // Путь к вашему сервисному файлу
import { OffsetLengthQueryDto } from "../dto/Response.dto.ts";
import { checkAuth } from '../middleware/authentication.middleware'; // Путь к вашему middleware

// Интерфейс для хранилища (чтобы TypeScript знал о userId)
interface AuthStore {
  userId?: number;
  [key: string]: any; // Для совместимости с другими возможными полями store
}

// --- Схемы для валидации ответов ---
// Автор (может быть null)
const AuthorSchema = t.Nullable(t.Object({
    id: t.Number(),
    username: t.String()
}));

// Базовая схема для сводки подборки
const BaseUserCompilationSummarySchema = t.Object({
    id: t.Number(),
    title: t.String(),
    movieCount: t.Number(),
    previewPosters: t.Array(t.String()),
});

// Схема для /published (добавляем автора)
const PublishedCompilationSummarySchema = t.Intersect([
    BaseUserCompilationSummarySchema,
    t.Object({ author: AuthorSchema }) // Ожидаем автора
]);

// --- ИСПРАВЛЕННАЯ СХЕМА для /my (БЕЗ автора, но с isPublished) ---
const MyCompilationSummarySchema = t.Intersect([
    BaseUserCompilationSummarySchema,
    t.Object({ isPublished: t.Boolean() }) // Ожидаем isPublished, НЕ ожидаем author
]);

// Создаем экземпляр Elysia с префиксом для всех маршрутов в этом файле
const CompilationsRoute = new Elysia({ prefix: '/compilations' })

    // Маршрут 1: Получение списка ВСЕХ СИСТЕМНЫХ подборок (тех, у кого user_id = null)
    .get('/', async ({ set }) => {
        try {
            // Вызываем сервисную функцию для получения системных подборок
            const compilations = await getSystemCompilations();
            set.status = 200; // OK
            return compilations;
        } catch (error: any) {
            console.error("Failed to fetch system compilations:", error);
            set.status = 500; // Internal Server Error
            return { success: false, message: error.message || "Failed to fetch system compilations" };
        }
    })

    // Маршрут 2: Получение ДЕТАЛЕЙ одной СИСТЕМНОЙ подборки по ID
    .get('/:id', async ({ params, set }) => {
        try {
            const id = params.id; // Получаем id из параметров URL
            // Вызываем сервисную функцию для получения деталей подборки
            const compilationDetails = await getCompilationDetails(id);
            set.status = 200; // OK
            return compilationDetails;
        } catch (error: any) {
            console.error(`Failed to fetch compilation details for ID ${params.id}:`, error);
            // Устанавливаем статус в зависимости от типа ошибки
            if (error.message?.includes("not found")) {
                 set.status = 404; // Not Found
            } else {
                 set.status = 500; // Internal Server Error
            }
            return { success: false, message: error.message || "Failed to fetch compilation details" };
        }
    }, {
        // Валидация: параметр id должен быть числом
        params: t.Object({
            id: t.Numeric({ error: "ID подборки должен быть числом." })
        })
    })

    // Маршрут 3: Создание НОВОЙ ПОЛЬЗОВАТЕЛЬСКОЙ подборки
    .post('/', async ({ body, store, set }) => {
        const { title, movieIds } = body; // Получаем данные из тела запроса
        const userId = (store as AuthStore).userId; // Получаем ID пользователя из хранилища (добавленного checkAuth)

        // Проверка, что userId действительно есть (middleware должен был это обеспечить)
        if (!userId) {
            console.error("Critical error: userId missing in store after checkAuth for POST /compilations!");
            set.status = 401; // Unauthorized (или 500, если считать это внутренней ошибкой)
            return { success: false, message: "Пользователь не аутентифицирован." };
        }

        try {
            // Вызываем сервисную функцию для создания подборки
            const newCompilation = await createUserCompilation(userId, title, movieIds);
            set.status = 201; // Created
            // Возвращаем успех и данные созданной подборки
            return { success: true, compilation: newCompilation };
        } catch (error: any) {
            console.error("Failed to create user compilation via route:", error);
            // Определяем статус ошибки для ответа клиенту
            if (error.message?.includes("Invalid input")) {
                set.status = 400; // Bad Request
            } else if (error.message?.includes("movie IDs may not exist")) {
                 set.status = 400; // Bad Request
            } else {
                set.status = 500; // Internal Server Error
            }
            return { success: false, message: error.message || "Не удалось создать подборку." };
        }
    }, {
        // Валидация тела запроса (body)
        body: t.Object({
            title: t.String({ minLength: 1, error: "Название подборки не может быть пустым." }),
            movieIds: t.Array(
                t.Numeric({ minimum: 1, error: "ID фильма должен быть положительным числом." }),
                { minItems: 1, error: "Нужно добавить хотя бы один фильм в подборку." }
            )
        }),
        // Применяем middleware: этот маршрут требует аутентификации
        beforeHandle: [checkAuth]
    })

    // Маршрут 4: Получение СПИСКА ПОДБОРОК ТЕКУЩЕГО АУТЕНТИФИЦИРОВАННОГО пользователя
    // GET /my: Получение подборок ТЕКУЩЕГО пользователя
    .get('/my', async ({ store, set }) => {
        const userId = (store as AuthStore).userId;
        if (!userId) { set.status = 401; return { success: false, message: "Пользователь не аутентифицирован." }; }
        try {
            // Функция getUserCompilations теперь возвращает и isPublished
            const compilations = await getUserCompilations(userId);
            set.status = 200;
            return compilations; // Возвращаем массив объектов UserCompilationSummaryWithStatus
        } catch (error: any) {
            console.error("Failed to fetch user compilations via route:", error);
            set.status = 500;
            return { success: false, message: error.message || "Не удалось получить подборки пользователя." };
        }
    }, {
        beforeHandle: [checkAuth],
        response: {
             // !!! ИСПОЛЬЗУЕМ ИСПРАВЛЕННУЮ СХЕМУ !!!
             200: t.Array(MyCompilationSummarySchema),
             401: t.Object({ success: t.Boolean(), message: t.String() }),
             500: t.Object({ success: t.Boolean(), message: t.String() })
        }
    })

    // НОВЫЙ GET /published: Получение опубликованных подборок
    .get('/published', async ({ query, set }) => {
        try {
            const limit = parseInt(query.length || "20");
            const offset = parseInt(query.offset || "0");
            const result = await getPublishedCompilations(limit, offset);
            set.status = 200;
            return { success: true, ...result };
        } catch (error: any) {
            console.error("Failed to fetch published compilations via route:", error);
            set.status = 500;
            return { success: false, message: error.message || "Не удалось получить опубликованные подборки." };
        }
    }, {
        query: OffsetLengthQueryDto,
        response: {
            200: t.Object({
                success: t.Boolean(),
                data: t.Array(PublishedCompilationSummarySchema),
                pagination: t.Object({ total: t.Number(), limit: t.Number(), offset: t.Number() })
            }),
            500: t.Object({ success: t.Boolean(), message: t.String() })
        }
        // Не требует checkAuth
    })

    // НОВЫЙ PATCH /:id/publish: Публикация подборки
    .patch('/:id/publish', async ({ params, store, set }) => {
        const userId = (store as AuthStore).userId;
        const collectionId = params.id;
        if (!userId) { set.status = 401; return { success: false, message: "Пользователь не аутентифицирован." }; }
        try {
            const result = await publishUserCompilation(userId, collectionId);
            set.status = 200;
            return result;
        } catch (error: any) {
             console.error(`Failed to publish compilation ${collectionId} via route:`, error);
             if (error.message?.includes("не найдена")) { set.status = 404; }
             else if (error.message?.includes("не можете опубликовать")) { set.status = 403; }
             else { set.status = 500; }
             return { success: false, message: error.message || "Не удалось опубликовать подборку." };
        }
    }, {
        params: t.Object({ id: t.Numeric({ error: "ID подборки должен быть числом." }) }),
        beforeHandle: [checkAuth], // Требует аутентификации
        response: {
            200: t.Object({ success: t.Boolean(), message: t.String() }), // Успех
            401: t.Object({ success: t.Boolean(), message: t.String() }), // Не авторизован
            403: t.Object({ success: t.Boolean(), message: t.String() }), // Не владелец
            404: t.Object({ success: t.Boolean(), message: t.String() }), // Не найдено
            500: t.Object({ success: t.Boolean(), message: t.String() })  // Ошибка сервера
        }
    });

export default CompilationsRoute;