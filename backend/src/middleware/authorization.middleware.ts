import type {Context} from 'elysia';
import {UserProvider} from "../providers/user.provider.ts";

export const authorizationMiddleware = async (ctx: Context) => {
  let pathSplit = ctx.path.split("/");
  // Пропускаем, если это не запрос к API
  if (pathSplit.length >= 2 && pathSplit[1] !== "api") return true;

  // Пропускаем, если это вход/регистрация
  if (ctx.path === "/api/auth/login" || ctx.path === "/api/auth/register") return true;

  // Пропускаем, если это не запрос к Auth API/Profile API
  if (pathSplit.length >= 3 && pathSplit[2] !== "auth" && pathSplit[2] !== "profile") return true;

  // Проверяем хидер
  if (!ctx.headers["authorization"]) return false;

  // Имя профиля
  const {username} = await ctx.jwt.verify(ctx.headers["authorization"]);

  // Получаем профиль
  let userData = await UserProvider.getByUsername(username);
  if (userData) return true;

  // Если проверка не прошла
  return false;
}