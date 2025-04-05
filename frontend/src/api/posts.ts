import axiosInstance from '@/utils/axios';

// Интерфейс для данных поста (согласуй с бэкендом)
export interface Post {
    postId: string;
    userId: number;
    username: string;
    userAvatar?: string;
    content: string;
    imageUrl?: string;
    timestamp: string; // Приходит как строка ISO
    likes?: number;
    comments?: any[];
}

// Интерфейс для данных, отправляемых при создании поста
interface CreatePostData {
    content: string;
    imageUrl?: string; // URL опционален
}

// Функция для получения списка постов
export const getPosts = async (): Promise<Post[]> => {
    try {
        const response = await axiosInstance.get('/posts'); // Запрос к GET /api/posts
        return response.data as Post[]; // Возвращает массив постов
    } catch (error) {
        console.error("Error fetching posts:", error);
        // Можно выбросить ошибку дальше или вернуть пустой массив
        throw error;
        // return [];
    }
};

// Функция для создания нового поста
export const createPost = async (postData: CreatePostData): Promise<Post> => {
    try {
        // Отправляем POST запрос на /api/posts с данными поста
        // axiosInstance автоматически добавит токен аутентификации из localStorage
        const response = await axiosInstance.post('/posts', postData);
        return response.data as Post; // Возвращает созданный пост
    } catch (error) {
        console.error("Error creating post:", error);
        // Выбрасываем ошибку для обработки в компоненте
        throw error;
    }
};