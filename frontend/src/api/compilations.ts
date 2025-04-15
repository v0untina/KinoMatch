// frontend/src/api/compilations.ts
import axiosInstance from '@/utils/axios';

// Интерфейс Compilation остается как есть

// --- Существующие интерфейсы ---
export interface Compilation { // Добавляем export, если его не было
  collection_id: number;
  title: string;
}

export interface Movie { // Добавляем export
    movie_id: number;
    title: string;
    poster_filename?: string;
}

export interface CompilationDetails { // Добавляем export
    collection_id: number;
    title: string;
    movies: Movie[];
}

export interface CreateCompilationData { // Добавляем export
  title: string;
  movieIds: number[];
}

export interface CreateCompilationResponse { // Добавляем export
  success: boolean;
  compilation: {
    collection_id: number;
    user_id: number;
    title: string;
    likes: number | null;
  };
}

// --- НОВЫЙ ИНТЕРФЕЙС: Краткая информация о подборке пользователя ---
// Этот тип должен соответствовать тому, что будет возвращать бэкенд
export interface UserCompilationSummary {
  id: number;             // collection_id
  title: string;
  movieCount: number;     // Количество фильмов в подборке
  previewPosters: (string | null)[]; // Массив имен файлов постеров (до 4-х)
  // Добавьте другие поля, если нужно (например, likes)
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


// --- НОВАЯ ФУНКЦИЯ: Создание пользовательской подборки ---
export const createUserCompilation = async (data: CreateCompilationData): Promise<CreateCompilationResponse> => {
  try {
    // Отправляем POST запрос на эндпоинт /compilations (созданный на шаге 1)
    // AxiosInstance должен автоматически подставить токен авторизации
    const response = await axiosInstance.post<CreateCompilationResponse>('/compilations', data);
    return response.data; // Возвращаем данные ответа (включая созданную подборку)
  } catch (error: any) {
    console.error("Error creating user compilation:", error);
    // Пробрасываем ошибку дальше, чтобы компонент мог ее обработать
    // Можно добавить более детальную обработку ошибок axios здесь, если нужно
    throw error;
  }
};


// --- НОВАЯ ЭКСПОРТИРУЕМАЯ ФУНКЦИЯ: Получение подборок текущего пользователя ---
export const getMyCompilations = async (): Promise<UserCompilationSummary[]> => {
  try {
    // Отправляем GET запрос на эндпоинт /compilations/my (который мы создадим на бэкенде)
    // AxiosInstance должен автоматически подставить токен авторизации
    const response = await axiosInstance.get<UserCompilationSummary[]>('/compilations/my');
    return response.data; // Возвращаем массив подборок пользователя
  } catch (error: any) {
    console.error("Error fetching user compilations:", error);
    // Пробрасываем ошибку дальше, чтобы компонент мог ее обработать
    throw error;
  }
};