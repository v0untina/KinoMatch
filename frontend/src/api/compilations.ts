// frontend/src/api/compilations.ts
import axiosInstance from '@/utils/axios';

// Интерфейс Compilation остается как есть

// Интерфейс для данных фильма (повторно, можно вынести в отдельный файл типов)
interface Movie {
    movie_id: number;
    title: string;
    poster_filename?: string;
}

// Интерфейс для деталей подборки
interface CompilationDetails {
    collection_id: number;
    title: string;
    movies: Movie[];
}


// Функция для получения списка подборок (остается без изменений)
export const getCompilations = async () => {
  try {
    const response = await axiosInstance.get('/compilations');
    return response.data as Compilation[]; // Возвращает массив простых Compilation
  } catch (error) {
    console.error("Error fetching compilations:", error);
    throw error;
  }
};

// НОВАЯ ФУНКЦИЯ: Получение деталей одной подборки по ID
export const getCompilationById = async (id: number): Promise<CompilationDetails> => {
  try {
    const response = await axiosInstance.get(`/compilations/${id}`); // Запрос к /compilations/:id
    // Предполагаем, что бэкенд возвращает объект CompilationDetails
    return response.data as CompilationDetails;
  } catch (error) {
    console.error(`Error fetching compilation with ID ${id}:`, error);
    throw error;
  }
};