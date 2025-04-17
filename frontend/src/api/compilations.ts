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

export interface CompilationDetails { 
  collection_id: number; title: string; 
  movies: Movie[]; 
  user: { id: number; 
    username: string; } | null; }

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



// Интерфейс для ПОДБОРКИ ПОЛЬЗОВАТЕЛЯ (для /my)
// Добавляем isPublished
export interface UserCompilationSummary {
  id: number;
  title: string;
  movieCount: number;
  previewPosters: string[]; // Уже отфильтрованы от null на бэке
  isPublished: boolean; // <-- Добавлено
  author?: AuthorInfo | null; // Автор может быть добавлен для /published
}

// Интерфейс для ответа от /published
interface PublishedCompilationsResponse {
  success: boolean;
  data: UserCompilationSummary[]; // Массив подборок (без isPublished, но с author)
  pagination: {
      total: number;
      limit: number;
      offset: number;
  };
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


// --- Функция получения ПОДБОРОК ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ ---
// Теперь возвращает UserCompilationSummary[], включая isPublished
export const getMyCompilations = async (): Promise<UserCompilationSummary[]> => {
  try {
    const response = await axiosInstance.get<UserCompilationSummary[]>('/compilations/my');
    return response.data; // Возвращаем массив подборок пользователя
  } catch (error: any) {
    console.error("Error fetching user compilations:", error);
    throw error;
  }
};

// --- НОВАЯ ФУНКЦИЯ: Получение ОПУБЛИКОВАННЫХ подборок ---
export const getPublishedCompilations = async (limit: number = 20, offset: number = 0): Promise<PublishedCompilationsResponse> => {
    try {
        const response = await axiosInstance.get<PublishedCompilationsResponse>('/compilations/published', {
            params: { length: limit, offset }
        });
        return response.data; // Возвращаем объект { success, data, pagination }
    } catch (error: any) {
        console.error("Error fetching published compilations:", error);
        throw error;
    }
};

// --- НОВАЯ ФУНКЦИЯ: Публикация подборки ---
export const publishCompilation = async (collectionId: number): Promise<PublishedCompilationsResponse> => {
    if (!collectionId) throw new Error("Collection ID is required to publish.");
    try {
        // Отправляем PATCH запрос (или POST, если предпочитаешь)
        const response = await axiosInstance.patch<PublishedCompilationsResponse>(`/compilations/${collectionId}/publish`);
        return response.data; // Возвращаем { success, message }
    } catch (error: any) {
        console.error(`Error publishing compilation ${collectionId}:`, error);
        throw error;
    }
};