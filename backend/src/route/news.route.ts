import { Elysia, t } from 'elysia';
import fs from 'fs/promises'; // Используем промисы для асинхронного чтения
import path from 'path';

// Определяем путь к файлу JSON относительно текущей директории бэкенда
const NEWS_JSON_PATH = path.join(__dirname, '..', '..', 'data', 'news.json');

// Определяем интерфейс/схему для новости (опционально, но хорошо для типизации)
const NewsItemSchema = t.Object({
    id: t.String(),
    title: t.String(),
    link: t.Nullable(t.String()),
    category: t.Nullable(t.String()),
    date: t.Nullable(t.String()),
    author: t.Nullable(t.String()),
    views: t.Nullable(t.String()),
    text: t.Nullable(t.String()),
    images: t.Array(t.String())
});

export const newsRoute = new Elysia({ prefix: '/news' })
    .get('/', async ({ set }) => {
        try {
            // Асинхронно читаем файл
            const fileContent = await fs.readFile(NEWS_JSON_PATH, 'utf-8');
            // Парсим JSON
            const newsData = JSON.parse(fileContent);

            // Проверяем, что это массив (базовая валидация)
            if (!Array.isArray(newsData)) {
                throw new Error('Invalid data format in news.json');
            }

            return newsData; // Отправляем данные клиенту

        } catch (error: any) {
            console.error("Error reading or parsing news.json:", error);

            // Если файл не найден, возвращаем пустой массив
            if (error.code === 'ENOENT') {
                set.status = 404; // Или можно вернуть 200 с пустым массивом
                return [];
            }

            // Другие ошибки (невалидный JSON, проблемы с чтением)
            set.status = 500;
            return { message: 'Failed to load news data.', error: error.message };
        }
    }, {
        // Описываем ответ для документации/валидации (опционально)
        response: t.Union([
            t.Array(NewsItemSchema),
            t.Object({ message: t.String(), error: t.Optional(t.String()) })
        ]),
        detail: {
            summary: 'Get latest news',
            description: 'Retrieves news items parsed from an external source, stored in news.json.',
            tags: ['News']
        }
    });