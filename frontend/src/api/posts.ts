// src/api/posts.ts

import axiosInstance from '@/utils/axios'; // Ваш настроенный экземпляр Axios

// --- ИНТЕРФЕЙСЫ ---

// Интерфейс для комментария (должен совпадать с бэкендом)
export interface Comment {
    id: string;
    userId: number;
    authorUsername: string;
    text: string;
    createdAt: string;
    // userAvatar?: string; // Можно добавить
}

// Интерфейс для данных поста (обновляем тип comments)
export interface Post {
    postId: string;
    username: string;
    userAvatar?: string;
    content: string;
    imageUrl?: string;
    timestamp: string;
    likes?: number;
    comments?: Comment[]; // Используем конкретный тип Comment[]
}

// Интерфейс для данных, отправляемых при создании поста
interface CreatePostPayload {
    content: string;
    image?: File;
}

// Интерфейс для ответа при лайке
interface LikeResponse {
    postId: string;
    likes: number;
}

// --- API ФУНКЦИИ ---

/**
 * Получает список всех постов.
 */
export const getPosts = async (): Promise<Post[]> => {
    try {
        const response = await axiosInstance.get('/posts');
        console.log('Ответ от сервера (getPosts):', response.data);
        // Преобразуем к типу Post[] с массивом Comment[]
        return (response.data as Post[]).map(post => ({
            ...post,
            comments: post.comments || [], // Гарантируем, что comments всегда массив
        }));
    } catch (error) {
        console.error("Error fetching posts:", error);
        // Можно добавить более специфичную обработку ошибок или уведомления
        throw error; // Пробрасываем ошибку для обработки в компоненте
    }
};

/**
 * Создает новый пост.
 * @param payload - Данные для создания поста (текст и опциональное изображение).
 * @returns Созданный объект поста.
 */
export const createPost = async (payload: CreatePostPayload): Promise<Post> => {
    try {
        const formData = new FormData();
        formData.append('content', payload.content);
        if (payload.image) {
            formData.append('image', payload.image);
        }

        console.log('Отправляемые данные (createPost FormData):', {
             content: payload.content,
             imageName: payload.image?.name,
             imageSize: payload.image?.size
        });

        const response = await axiosInstance.post('/posts', formData); // Axios сам установит Content-Type
        console.log('Ответ от сервера (createPost):', response.data);

        // Проверяем базовую структуру ответа
        const newPost = response.data as Post;
        if (!newPost.postId || typeof newPost.content === 'undefined' || !newPost.timestamp || !newPost.username) {
            console.error('Неполный или некорректный ответ от сервера при создании поста:', newPost);
            throw new Error('Сервер вернул неполный или некорректный объект поста.');
        }
        // Гарантируем, что comments это массив
        newPost.comments = newPost.comments || [];
        return newPost;

    } catch (error: any) {
        console.error("Error creating post:", error);
        const backendMessage = error.response?.data?.message || error.response?.data;
        const errorMessage = typeof backendMessage === 'string' ? backendMessage : (error.message || "Неизвестная ошибка при создании поста");
        console.error("Parsed error for user (createPost):", errorMessage);
        throw new Error(errorMessage);
    }
};

/**
 * Отправляет запрос на лайк (или изменение состояния лайка) поста.
 * @param postId - ID поста, который нужно лайкнуть.
 * @returns Объект с обновленным количеством лайков.
 */
export const likePost = async (postId: string): Promise<LikeResponse> => {
    if (!postId) {
        console.error("likePost called with invalid postId");
        throw new Error("Невозможно лайкнуть пост: неверный ID.");
    }
    try {
        const response = await axiosInstance.post(`/posts/${postId}/like`);
        console.log(`Ответ от сервера (likePost ${postId}):`, response.data);

        const data = response.data as LikeResponse;
        // Улучшенная проверка ответа
        if (!data || typeof data.postId !== 'string' || typeof data.likes !== 'number') {
             console.error('Некорректный ответ от сервера (likePost):', data);
             throw new Error('Сервер вернул некорректные данные о лайках.');
        }
        return data;

    } catch (error: any) {
        console.error(`Error liking post ${postId}:`, error);
        const backendMessage = error.response?.data?.message || error.response?.data;
        const errorMessage = typeof backendMessage === 'string' ? backendMessage : (error.message || "Неизвестная ошибка при добавлении лайка");
        console.error("Parsed error for user (likePost):", errorMessage);
        throw new Error(errorMessage);
    }
};


// --- НОВАЯ ФУНКЦИЯ: Добавить комментарий ---
/**
 * Отправляет новый комментарий к посту на сервер.
 * @param postId - ID поста, к которому добавляется комментарий.
 * @param text - Текст комментария.
 * @returns Обновленный объект поста с добавленным комментарием.
 */
export const addComment = async (postId: string, text: string): Promise<Post> => {
    // Валидация входных данных
    if (!postId) {
        throw new Error('Не указан ID поста для добавления комментария.');
    }
    if (!text || !text.trim()) {
        throw new Error('Текст комментария не может быть пустым.');
    }

    try {
        console.log(`Отправка комментария к посту ${postId}: "${text.trim()}"`);
        // Отправляем POST запрос на /posts/{postId}/comments
        // В теле запроса передаем объект { text: "текст комментария" }
        const response = await axiosInstance.post(`/posts/${postId}/comments`, {
            text: text.trim() // Передаем очищенный текст
        });

        console.log(`Ответ от сервера (addComment ${postId}):`, response.data);

        // Проверяем ответ - ожидаем обновленный объект поста
        const updatedPost = response.data as Post;
        if (!updatedPost || typeof updatedPost.postId !== 'string' || !Array.isArray(updatedPost.comments)) {
             console.error('Некорректный ответ от сервера (addComment):', updatedPost);
             throw new Error('Сервер вернул некорректные данные после добавления комментария.');
        }
         // Гарантируем, что comments это массив Comment[] (хотя бэк и должен вернуть правильный тип)
         updatedPost.comments = (updatedPost.comments || []).map(comment => ({
             ...comment // Копируем свойства
         })) as Comment[];

        return updatedPost; // Возвращаем обновленный пост

    } catch (error: any) {
        console.error(`Error adding comment to post ${postId}:`, error);
        // Пытаемся извлечь сообщение об ошибке с бэкенда
        const backendMessage = error.response?.data?.message || error.response?.data;
        // Формируем понятное сообщение об ошибке
        const errorMessage = typeof backendMessage === 'string'
            ? backendMessage
            : (error.message || "Неизвестная ошибка при добавлении комментария");
        console.error("Parsed error for user (addComment):", errorMessage);
        // Пробрасываем ошибку дальше для обработки в UI
        throw new Error(errorMessage);
    }
};
// --- КОНЕЦ НОВОЙ ФУНКЦИИ ---