// frontend/src/api/movies.ts
import api from '@/utils/axios'; // Предполагается, что у тебя настроен инстанс axios

// Тип для результата поиска, должен совпадать с бэкендом
export interface MovieSuggestion {
    movie_id: number;
    title: string;
    year: number | null;
}

// Функция для поиска фильмов
export const searchMovies = async (query: string): Promise<MovieSuggestion[]> => {
    if (!query.trim()) {
        return []; // Не делаем запрос, если строка пустая
    }
    try {
        const response = await api.get<MovieSuggestion[]>('/movies/search', {
            params: { q: query }, // Передаем поисковый запрос как параметр 'q'
        });
        return response.data;
    } catch (error) {
        console.error("Ошибка при поиске фильмов:", error);
        // Можно обработать ошибку более специфично, например, показать уведомление
        return []; // Возвращаем пустой массив в случае ошибки
    }
};

// Можешь оставить здесь и другие функции API для фильмов, если они есть
// export const getMovieDetails = async (id: number) => { ... };