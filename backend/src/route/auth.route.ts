// backend/src/route/auth.route.ts
import { Elysia, t } from 'elysia';
import { ChangePasswordBodyDto, LoginBodyDto, LoginResponseDto, RegisterBodyDto } from "../dto/Auth.dto";
import { AuthService } from "../service/auth.service.ts";
import { DefaultResponseDto } from "../dto/Response.dto.ts";

const authRoutes = new Elysia({ prefix: "/auth", detail: { tags: ["Auth"] } });

// Вспомогательная функция для создания ответов с ошибками
const createErrorResponse = (message: string, status: number = 500) => {
    return new Response(JSON.stringify({ success: false, message }), {
        status: status,
        headers: { 'Content-Type': 'application/json' }
    });
};

// Endpoint для входа в аккаунт (логин)
authRoutes.post('/login', async (ctx) => {
    let userData = await AuthService.login(ctx.body.username, ctx.body.password);
    if (!userData) {
        return createErrorResponse("Unauthorized", 401); // Возвращаем ошибку 401
    }

    // Подписываем JWT-токен.  ВКЛЮЧАЕМ userId!
    let token = await ctx.jwt.sign({ username: ctx.body.username, userId: userData.id });

    // Возвращаем токен
    return { success: true, data: { token } };
}, {
    body: LoginBodyDto, // DTO для тела запроса
    response: LoginResponseDto // DTO для ответа
});

// Endpoint для создания аккаунта (регистрация)
authRoutes.post('/register', async (ctx) => {
    let regResult = await AuthService.register(ctx.body.username, ctx.body.email, ctx.body.password);
    if (!regResult) {
        return createErrorResponse('Registration failed', 400); // Возвращаем ошибку 400
    }

    return { success: true };
}, {
    body: RegisterBodyDto, // DTO для тела запроса
    response: DefaultResponseDto // DTO для ответа
});

// Endpoint для смены пароля
authRoutes.post('/changePassword', async (ctx) => {
    // Проверяем JWT токен.  Если токена нет или он невалидный, ctx.jwt.verify вернет false.
    const verification = await ctx.jwt.verify(ctx.headers.authorization);
    if (!verification) {
        return createErrorResponse('Invalid token', 401); // Возвращаем ошибку 401
    }

    // Извлекаем username из токена.
    // Используем type assertion, чтобы указать TypeScript, что verification - это объект с полем username.
    const { username } = verification as { username: string };

    // Меняем пароль
    let changeResult = await AuthService.changePassword(username, ctx.body.oldPassword, ctx.body.newPassword);
    if (!changeResult) {
        return createErrorResponse('Password change failed', 400); // Возвращаем ошибку 400
    }

    return { success: true };
}, {
    body: ChangePasswordBodyDto, // DTO для тела запроса
    response: DefaultResponseDto, // DTO для ответа

    // Добавляем beforeHandle для проверки JWT перед выполнением основного обработчика
    beforeHandle: async (ctx) => {
        if (!await ctx.jwt.verify(ctx.headers.authorization)) {
            return createErrorResponse("Unauthorized", 401); // Возвращаем ошибку 401
        }
    }
});

export default authRoutes;