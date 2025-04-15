// backend/src/route/compilations.route.ts
import { Elysia, t } from 'elysia';
import {
    getSystemCompilations,
    getCompilationDetails,
    createUserCompilation, // Функция для создания подборки
    getUserCompilations   // Функция для получения подборок пользователя
} from '../service/compilations.service'; // Путь к вашему сервисному файлу
import { checkAuth } from '../middleware/authentication.middleware'; // Путь к вашему middleware

// Интерфейс для хранилища (чтобы TypeScript знал о userId)
interface AuthStore {
  userId?: number;
  [key: string]: any; // Для совместимости с другими возможными полями store
}

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
    .get('/my', async ({ store, set }) => { // Путь '/my' относительно префикса '/compilations'
        const userId = (store as AuthStore).userId; // Получаем ID пользователя из хранилища

        // Проверка, что userId есть
        if (!userId) {
            console.error("Critical error: userId missing in store for GET /compilations/my!");
            set.status = 401; // Unauthorized
            return { success: false, message: "Пользователь не аутентифицирован." };
        }

        try {
            // Вызываем сервисную функцию для получения подборок пользователя
            const compilations = await getUserCompilations(userId);
            set.status = 200; // OK
            return compilations; // Возвращаем массив подборок (в формате UserCompilationSummary)
        } catch (error: any) {
            console.error("Failed to fetch user compilations via route:", error);
            set.status = 500; // Internal Server Error
            return { success: false, message: error.message || "Не удалось получить подборки пользователя." };
        }
    }, {
        // Применяем middleware: этот маршрут требует аутентификации
        beforeHandle: [checkAuth]
    });

// Экспортируем сконфигурированный роутер
export default CompilationsRoute;