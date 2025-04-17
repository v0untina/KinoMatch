// frontend/src/types/user.interface.ts
// Аккаунт
export interface User {
  user_id: number;
  username: string;
  email: string;
  rating?: number | null; // <-- ДОБАВЬ ЭТУ СТРОКУ
}

// Интерфейс IUserFavorite остается как есть, пока не трогаем избранные подборки
export interface IUserFavorite {
  id: number;
  userId: number;
  competitionId: string;
  createdAt: Date;
}