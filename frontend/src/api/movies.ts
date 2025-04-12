// frontend/src/api/movies.ts
import api from '@/utils/axios'; // Ваш инстанс axios

// Тип для результата поиска/случайных фильмов
export interface MovieSuggestion {
    movie_id: number;
    title: string;
    year: number | null;
    poster_filename: string | null;
}

// Тип для ответа API случайных фильмов
interface RandomMoviesApiResponse {
    success: boolean;
    movies?: MovieSuggestion[];
    error?: string;
}

// Функция для поиска фильмов
export const searchMovies = async (query: string): Promise<MovieSuggestion[]> => {
    if (!query.trim()) {
        return []; // Не делаем запрос, если строка пустая
    }
    try {
        // Убедись, что тип <MovieSuggestion[]> используется правильно
        const response = await api.get<MovieSuggestion[]>('/movies/search', {
            params: { q: query }, // Передаем поисковый запрос как параметр 'q'
        });
        // Проверяем, что response.data действительно массив (на случай неожиданного ответа)
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error("Ошибка при поиске фильмов:", error);
        // Можно обработать ошибку более специфично, например, показать уведомление
        return []; // Возвращаем пустой массив в случае ошибки
    }
};

// --- НОВАЯ ФУНКЦИЯ для получения случайных фильмов ---
export const getRandomMovies = async (count: number): Promise<MovieSuggestion[]> => {
    if (count <= 0) {
        console.warn("Запрошено некорректное количество случайных фильмов:", count);
        return [];
    }
    try {
        // Убедимся, что тип ответа соответствует RandomMoviesApiResponse
        const response = await api.get<RandomMoviesApiResponse>('/movies/random', {
            params: { count: count }, // Передаем количество как параметр 'count'
        });

        if (response.data.success && response.data.movies) {
            // Убедимся, что movies это массив перед возвратом
            return Array.isArray(response.data.movies) ? response.data.movies : [];
        } else {
            // Логируем ошибку, которую вернул бэкенд
            console.error("Ошибка API при получении случайных фильмов:", response.data.error || 'Неизвестная ошибка');
            return []; // Возвращаем пустой массив в случае ошибки бэкенда
        }
    } catch (error) {
        // Логируем ошибку сети/запроса
        console.error("Ошибка сети/запроса при получении случайных фильмов:", error);
         // Дополнительная информация об ошибке axios
        if (axios.isAxiosError(error)) {
             console.error('Axios error details:', error.response?.data || error.message);
         }
        return []; // Возвращаем пустой массив в случае ошибки сети/запроса
    }
};

