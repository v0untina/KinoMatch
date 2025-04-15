// frontend/src/api/favorites.ts
import axiosInstance from '@/utils/axios'; // Ваш настроенный инстанс Axios

// Интерфейс для фильма (можно вынести в общий файл типов)
interface Movie {
  movie_id: number;
  title: string;
  original_title?: string | null;
  year?: number | null;
  poster_filename?: string | null;
  // Добавьте другие поля, если они возвращаются бэкендом
}

// Интерфейс для записи из user_movie_favorites, как она приходит от бэкенда
interface FavoriteMovieRecord {
  user_id: number;
  movie_id: number;
  added_at?: string; // Дата может приходить как строка
  movies: Movie; // Включенные данные о фильме
}

// Интерфейс для ответа от GET /profile/favorites
interface FavoritesApiResponse {
  success: boolean;
  pagination: {
    length: number;
    offset: number;
  };
  data: FavoriteMovieRecord[]; // Массив записей из БД
}

// Интерфейс для ответа от POST и DELETE
interface FavoriteActionResponse {
  success: boolean;
  message?: string; // Опциональное сообщение
}

/**
 * Получает список избранных фильмов текущего пользователя.
 */
export const getFavoriteMovies = async (): Promise<FavoriteMovieRecord[]> => {
  try {
    // Параметры пагинации (можно сделать их опциональными аргументами функции)
    const params = { length: 1000, offset: 0 }; // Запрашиваем много, чтобы получить все
    const response = await axiosInstance.get<FavoritesApiResponse>('/profile/favorites', { params });
    // Возвращаем только массив данных (записей FavoriteMovieRecord)
    return response.data.data || [];
  } catch (error: any) {
    console.error("Error fetching favorite movies:", error);
    // Пробрасываем ошибку для обработки в компоненте
    throw error;
  }
};

/**
 * Добавляет фильм в избранное.
 * @param movieId ID фильма для добавления.
 */
export const addFavoriteMovie = async (movieId: number): Promise<FavoriteActionResponse> => {
  if (!movieId) throw new Error("Movie ID is required to add to favorites.");
  try {
    const response = await axiosInstance.post<FavoriteActionResponse>(`/profile/favorites/${movieId}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error adding movie ${movieId} to favorites:`, error);
    throw error;
  }
};

/**
 * Удаляет фильм из избранного.
 * @param movieId ID фильма для удаления.
 */
export const removeFavoriteMovie = async (movieId: number): Promise<FavoriteActionResponse> => {
  if (!movieId) throw new Error("Movie ID is required to remove from favorites.");
  try {
    const response = await axiosInstance.delete<FavoriteActionResponse>(`/profile/favorites/${movieId}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error removing movie ${movieId} from favorites:`, error);
    throw error;
  }
};

// Опционально: Проверка статуса одного фильма (если нужно часто проверять)
// export const checkIsFavorite = async (movieId: number): Promise<boolean> => {
//   try {
//     // Этот эндпоинт нужно будет создать на бэкенде, если решите использовать
//     const response = await axiosInstance.get<{ isFavorite: boolean }>(`/profile/favorites/check/${movieId}`);
//     return response.data.isFavorite;
//   } catch (error) {
//     console.error(`Error checking favorite status for movie ${movieId}:`, error);
//     // В случае ошибки лучше считать, что не в избранном, или пробросить ошибку
//     // throw error;
//     return false;
//   }
// }