// src/api/posts.ts


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
        console.log('Ответ от сервера (getPosts):', response.data); // Логируем ответ
        return response.data as Post[]; // Возвращает массив постов
    } catch (error) {
        console.error("Error fetching posts:", error);
        throw error;
    }
};

// Функция для создания нового поста
export const createPost = async (postData: CreatePostData): Promise<Post> => {
    try {
        // Отправляем POST запрос на /api/posts с данными поста
        const response = await axiosInstance.post('/posts', postData);
        console.log('Ответ от сервера (createPost):', response.data); // Логируем ответ

        // Проверяем, что ответ соответствует интерфейсу Post
        const newPost = response.data as Post;
        if (!newPost.postId || !newPost.content || !newPost.timestamp || !newPost.username) {
            console.error('Неполный ответ от сервера:', newPost);
            throw new Error('Сервер вернул неполный объект поста. Обратитесь к разработчику сервера.');
        }

        return newPost; // Возвращает созданный пост
    } catch (error: any) {
        console.error("Error creating post:", error);
        throw error;
    }
};