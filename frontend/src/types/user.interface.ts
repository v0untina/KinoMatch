// frontend/src/types/user.interface.ts
// Аккаунт
export interface User { // Переименовано в User (без I) для соответствия React conventions
  user_id: number; // Исправлено: user_id вместо id, чтобы соответствовать backend
  username: string;
  email: string;
  // password: string; // !!! УДАЛЕНО: Пароль не должен быть на frontend !!!
  // createdAt: Date; // Убрано, если не используется на frontend
}

export interface IUserFavorite { // Оставлено IUserFavorite, т.к. пока не меняем favorites
  id: number;
  userId: number;
  competitionId: string; // TODO: Уточнить, что такое competitionId и нужно ли оно здесь
  createdAt: Date;
}