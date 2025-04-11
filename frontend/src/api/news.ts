import axios from '@/utils/axios'; // Ваш настроенный axios instance

// Определяем интерфейс для новости на фронтенде
export interface NewsItem {
    id: string;
    title: string;
    link: string | null;
    category: string | null;
    date: string | null;
    author: string | null;
    views: string | null;
    text: string | null;
    images: string[];
}

export const getNews = async (): Promise<NewsItem[]> => {
    try {
        // Указываем тип ожидаемого ответа для лучшей типизации
        const response = await axios.get<NewsItem[]>('/news');
        return response.data;
    } catch (error: any) {
        console.error("Failed to fetch news:", error);
        // Можно пробросить ошибку дальше или вернуть пустой массив
        throw new Error(error.response?.data?.message || error.message || 'Не удалось загрузить новости');
    }
};