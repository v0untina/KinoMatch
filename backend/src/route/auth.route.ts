// backend/src/route/auth.route.ts
import { Elysia, t } from 'elysia';
import { ChangePasswordBodyDto, LoginBodyDto, LoginResponseDto, RegisterBodyDto } from "../dto/Auth.dto";
import { AuthService } from "../service/auth.service.ts";
import { DefaultResponseDto } from "../dto/Response.dto.ts";

const authRoutes = new Elysia({ prefix: "/auth", detail: { tags: ["Auth"] } });

// Endpoint для входа в аккаунт (логин)
authRoutes.post('/login', async (ctx) => {
    const { username, password } = ctx.body;
    const result = await AuthService.login(username, password);

    if (!result.success) {
        // Возвращаем ошибку 401, если аутентификация не удалась.
        // Используем объект с числовым кодом состояния, как требует Elysia.
        return { 401: { success: false, message: result.message } };
    } else { // Явно используем 'else' для четкого разделения путей возврата.
        // Подписываем JWT-токен, ВКЛЮЧАЯ userId.
        const token = await ctx.jwt.sign({ username: username, userId: result.data.id });

        // Возвращаем токен в случае успеха.
        // Используем объект с числовым кодом состояния (200 OK).
        return { 200: { success: true, data: { token } } };
    }
}, {
    body: LoginBodyDto,  // DTO для тела запроса
    response: t.Object({ // ЯВНО указываем схему ответа.  Это КЛЮЧЕВОЙ момент для Elysia.
        success: t.Boolean(),
        data: t.Optional(t.Object({
            token: t.String()
        }))
    })
});

// Endpoint для создания аккаунта (регистрация)
authRoutes.post('/register', async (ctx) => {
    const { username, email, password } = ctx.body;
    const regResult = await AuthService.register(username, email, password);

    if (!regResult.success) {
        // Возвращаем ошибку 400, если регистрация не удалась.
        return { 400: { success: false, message: regResult.message } };
    } else { // Явно используем 'else'.
        return { 200: { success: true } };
    }
}, {
    body: RegisterBodyDto, // DTO для тела запроса
    response: DefaultResponseDto // DTO для ответа (убедитесь, что DefaultResponseDto тоже использует числовые коды!)
});

// Endpoint для смены пароля
authRoutes.post('/changePassword', async (ctx) => {
    // Проверяем JWT токен.
    const verification = await ctx.jwt.verify(ctx.headers.authorization);
    if (!verification) {
        // Возвращаем ошибку 401, если токен недействителен.
        return { 401: { success: false, message: 'Invalid token' } };
    }

    // Извлекаем username и userId из токена.
    // Используем type assertion, чтобы указать TypeScript, что verification - объект.
    const { username, userId } = verification as { username: string; userId: number };

    // Меняем пароль
    const changeResult = await AuthService.changePassword(username, ctx.body.oldPassword, ctx.body.newPassword);

    if (!changeResult.success) {
        // Возвращаем ошибку 400, если смена пароля не удалась.
        return { 400: { success: false, message: changeResult.message } };
    } else { // Явно используем 'else'.
        return { 200: { success: true } };
    }
}, {
    body: ChangePasswordBodyDto, // DTO для тела запроса
    response: DefaultResponseDto, // DTO для ответа
    beforeHandle: async (ctx) => { // beforeHandle в Elysia НЕ ДОЛЖЕН возвращать значение (кроме ошибки).
        if (!await ctx.jwt.verify(ctx.headers.authorization)) {
            // Возвращаем 401 ошибку, если JWT не прошел проверку
            return { 401: { success: false, message: "Unauthorized" } };
        }
        // Если JWT валиден, beforeHandle не должен ничего возвращать (или возвращать undefined).
    }
});

export default authRoutes;