// src/api/posts.ts

import axiosInstance from '@/utils/axios';

// Интерфейс для данных поста (остается как есть, т.к. бэк отдает полный URL)
export interface Post {
    postId: string;
    // userId?: number; // На клиенте userId обычно не нужен напрямую в посте
    username: string;
    userAvatar?: string; // Предполагаем, что это поле может быть добавлено позже или на клиенте
    content: string;
    imageUrl?: string; // Полный URL, который приходит с бэка
    timestamp: string;
    likes?: number;
    comments?: any[];
}

// --- ИЗМЕНЕНИЕ: Интерфейс для данных, отправляемых при создании поста ---
interface CreatePostPayload {
    content: string;
    image?: File; // Теперь это File, а не string URL
}

// Функция для получения списка постов (без изменений)
export const getPosts = async (): Promise<Post[]> => {
    try {
        const response = await axiosInstance.get('/posts');
        console.log('Ответ от сервера (getPosts):', response.data);
        // Тут можно добавить дефолтный аватар, если бэк его не присылает
        // return response.data.map((post: any) => ({
        //     ...post,
        //     userAvatar: post.userAvatar || '/interface/defaultAvatar.webp'
        // })) as Post[];
        return response.data as Post[];
    } catch (error) {
        console.error("Error fetching posts:", error);
        throw error; // Пробрасываем ошибку дальше
    }
};

// --- ИЗМЕНЕНИЕ: Функция для создания нового поста ---
export const createPost = async (payload: CreatePostPayload): Promise<Post> => {
    try {
        // Создаем объект FormData
        const formData = new FormData();
        formData.append('content', payload.content); // Добавляем текст

        // Если есть файл изображения, добавляем его
        if (payload.image) {
            // 'image' - это имя поля, которое ожидает бэкенд (в схеме body)
            formData.append('image', payload.image);
        }

        console.log('Отправляемые данные (createPost FormData):', {
             content: payload.content,
             imageName: payload.image?.name,
             imageSize: payload.image?.size
        });


        // Отправляем POST запрос с FormData
        // Axios автоматически установит 'Content-Type': 'multipart/form-data'
        const response = await axiosInstance.post('/posts', formData); // Убрали явный Content-Type

        console.log('Ответ от сервера (createPost):', response.data);

        // Проверяем, что ответ соответствует интерфейсу Post
        const newPost = response.data as Post;
        if (!newPost.postId || typeof newPost.content === 'undefined' || !newPost.timestamp || !newPost.username) {
            console.error('Неполный или некорректный ответ от сервера:', newPost);
            throw new Error('Сервер вернул неполный или некорректный объект поста.');
        }

        // Можно добавить дефолтный аватар и здесь, если нужно
        // newPost.userAvatar = newPost.userAvatar || '/interface/defaultAvatar.webp';

        return newPost; // Возвращает созданный пост (уже с полным imageUrl от бэка)

    } catch (error: any) {
        console.error("Error creating post:", error);
         // Попытка извлечь сообщение об ошибке из ответа сервера
         const backendMessage = error.response?.data?.message;
         // Если есть сообщение от бэкенда, используем его, иначе стандартное сообщение axios или общее
         const errorMessage = backendMessage || error.message || "Неизвестная ошибка при создании поста";
         console.error("Parsed error for user:", errorMessage);
         // Пробрасываем ошибку с понятным сообщением
         throw new Error(errorMessage);
    }
};

// --- НОВАЯ ФУНКЦИЯ: Лайкнуть пост ---
interface LikeResponse {
    postId: string;
    likes: number;
    // isLikedByCurrentUser?: boolean; // На будущее
}

export const likePost = async (postId: string): Promise<LikeResponse> => {
    if (!postId) {
        console.error("likePost called with invalid postId");
        throw new Error("Невозможно лайкнуть пост: неверный ID.");
    }
    try {
        // Отправляем POST запрос на /api/posts/{postId}/like
        // Тело запроса не нужно, ID передается в URL
        const response = await axiosInstance.post(`/posts/${postId}/like`);
        console.log(`Ответ от сервера (likePost ${postId}):`, response.data);

        // Проверяем ответ
        const data = response.data as LikeResponse;
        if (typeof data?.likes !== 'number') {
             console.error('Некорректный ответ от сервера (likePost):', data);
             throw new Error('Сервер вернул некорректные данные о лайках.');
        }

        return data; // Возвращает объект { postId, likes }

    } catch (error: any) {
        console.error(`Error liking post ${postId}:`, error);
        const backendMessage = error.response?.data?.message || error.response?.data;
        const errorMessage = typeof backendMessage === 'string' ? backendMessage : (error.message || "Неизвестная ошибка при добавлении лайка");
        console.error("Parsed error for user (likePost):", errorMessage);
        throw new Error(errorMessage);
    }
};
// --- КОНЕЦ НОВОЙ ФУНКЦИИ ---