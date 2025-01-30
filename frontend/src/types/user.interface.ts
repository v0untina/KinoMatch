// Аккаунт
export interface IUser {
  id: number;
  username: string;
  password: string;
  email: string;
  createdAt: Date;
}

export interface IUserFavorite {
  id: number;
  userId: number;
  competitionId: string;
  createdAt: Date;
}