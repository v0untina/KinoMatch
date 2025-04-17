// frontend/src/api/profile.ts (или users.ts)
import api from '@/utils/axios'; // Твой настроенный инстанс axios

// Интерфейс для пользователя в рейтинге
export interface TopUser {
    user_id: number;
    username: string;
    rating: number;
    avatar_filename?: string | null; // Опционально, если добавил
}

interface TopRatedUsersResponse {
    success: boolean;
    data?: TopUser[];
    message?: string;
}

// Функция для получения топ пользователей
export const fetchTopRatedUsers = async (limit: number = 5): Promise<TopUser[]> => {
    try {
        const response = await api.get<TopRatedUsersResponse>('/profile/top-rated', { // <-- Укажи правильный путь
            params: { limit }
        });
        if (response.data.success && response.data.data) {
            return response.data.data;
        } else {
            console.error("API Error (fetchTopRatedUsers):", response.data.message);
            return []; // Возвращаем пустой массив при ошибке API
        }
    } catch (error) {
        console.error("Network Error (fetchTopRatedUsers):", error);
        // Здесь можно обработать ошибку сети, например, показать уведомление
        throw error; // Перебрасываем ошибку, чтобы компонент мог ее поймать
    }
};