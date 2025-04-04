// backend/src/route/compilations.route.ts
import { Elysia, t } from 'elysia'; // Убедись, что t импортирован
import { getSystemCompilations, getCompilationDetails } from '../service/compilations.service'; // Импортируем новую функцию

const CompilationsRoute = new Elysia()
    // Маршрут для получения списка всех системных подборок
    .get('/compilations', async ({ set }) => {
        try {
            const compilations = await getSystemCompilations();
            set.status = 200;
            return compilations;
        } catch (error: any) {
            console.error("Failed to fetch compilations:", error);
            set.status = 500;
            return { message: error.message || "Failed to fetch compilations" };
        }
    })
    // НОВЫЙ МАРШРУТ: Получение деталей одной подборки по ID
    .get('/compilations/:id', async ({ params, set }) => {
        try {
            const id = params.id; // Получаем id из параметров
            const compilationDetails = await getCompilationDetails(id); // Вызываем сервис
            set.status = 200;
            return compilationDetails;
        } catch (error: any) {
            console.error(`Failed to fetch compilation details for ID ${params.id}:`, error);
            // Устанавливаем соответствующий статус в зависимости от ошибки
            if (error.message?.includes("not found")) { // Простой пример проверки на "не найдено"
                 set.status = 404;
            } else {
                 set.status = 500;
            }
            return { message: error.message || "Failed to fetch compilation details" };
        }
    }, { // Добавляем валидацию параметра id
        params: t.Object({
            id: t.Numeric() // Указываем, что id должен быть числом
        })
    });

export default CompilationsRoute;