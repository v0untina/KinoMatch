import {Elysia} from 'elysia';
import {ChangePasswordBodyDto, LoginBodyDto, LoginResponseDto, RegisterBodyDto} from "../dto/Auth.dto";
import {AuthService} from "../service/auth.service.ts";
import {DefaultResponseDto} from "../dto/Response.dto.ts";

const authRoutes = new Elysia({prefix: "/auth", detail: {tags: ["Auth"]}});

// Endpoint для входа в аккаунт
authRoutes.post('/login', async (ctx) => {
  let userData = await AuthService.login(ctx.body.username, ctx.body.password);
  if (!userData) return ctx.error(401, "Unauthorized");

  // Подписываем JWT-токен
  let token = await ctx.jwt.sign({username: ctx.body.username});

  // Возвращаем токен
  return {success: true, data: {token}};
}, {body: LoginBodyDto, response: LoginResponseDto});

// Endpoint для создания аккаунта
authRoutes.post('/register', async (ctx) => {
  let regResult = await AuthService.register(ctx.body.username, ctx.body.email, ctx.body.password);
  if (!regResult) return {success: false};

  // Регистрация прошла успешно
  return {success: true};
}, {body: RegisterBodyDto, response: DefaultResponseDto});

// Endpoint для смены пароля
authRoutes.post('/changePassword', async (ctx) => {
  const {username} = await ctx.jwt.verify(ctx.headers["authorization"]);

  // Меняем пароль
  let changeResult = await AuthService.changePassword(username, ctx.body.oldPassword, ctx.body.newPassword);
  if (!changeResult) return {success: false};

  // Регистрация прошла успешно
  return {success: true};
}, {body: ChangePasswordBodyDto, response: DefaultResponseDto});

// Экспорт маршрутов
export default authRoutes;