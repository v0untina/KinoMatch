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
        // Ошибка авторизации
        return { 401: { success: false, message: result.message } }; // Оставляем как было
    } else {
        // Успешная авторизация
        const token = await ctx.jwt.sign({ username: username, userId: result.data.user_id }); // !!! ВОЗВРАЩАЕМ JWT !!!

        // !!! ИЗМЕНЕНИЕ: Возвращаем объект с success и data на верхнем уровне !!!
        ctx.set.status = 200; // Устанавливаем статус явно
        return {
            success: true,
            data: {
                token: token, // !!! ВОЗВРАЩАЕМ TOKEN !!!
                user: result.data
            }
        };
    }
}, {
    body: LoginBodyDto,
    response: {
        200: t.Object({
            success: t.Boolean(), //  t.Boolean()
            data: t.Object({
                token: t.String(),
                user: t.Object({
                    user_id: t.Number(),
                    username: t.String(),
                    email: t.String()
                })
            })
        }),
        401: t.Object({
            success: t.Boolean(), //  t.Boolean()
            message: t.String()
        })
    }
});

// Endpoint для создания аккаунта (регистрация)
authRoutes.post('/register', async (ctx) => {
    const { username, email, password } = ctx.body;

    console.log("Register endpoint called with:", { username, email, password });

    const regResult = await AuthService.register(username, email, password);

    console.log("Register result from AuthService:", regResult);

    if (!regResult.success) {
        // Ошибка регистрации (например, пользователь уже существует)
        const errorResponse = {
            422: { // Используем 422 Unprocessable Entity
                success: false,
                message: {
                    message: regResult.message || "Ошибка регистрации",
                    text: regResult.message || "Ошибка регистрации"
                }
            }
        };
        console.log("Register API response (error):", errorResponse);
        return errorResponse;

    } else {
        // Успешная регистрация
        const loginResult = await AuthService.login(username, password);
        if (loginResult.success) {
            const token = await ctx.jwt.sign({ username: username, userId: loginResult.data.user_id });
            ctx.set.status = 201; // Устанавливаем статус 201 Created
            return { success: true, data: { token, user: loginResult.data } }; // Возвращаем данные
        } else {
			const serverErrorResponse = { 500: { success: false, message: { message: "Регистрация прошла успешно, но не удалось автоматически войти. Пожалуйста, попробуйте войти вручную.", text: "Регистрация прошла успешно, но не удалось автоматически войти. Пожалуйста, попробуйте войти вручную." } } };
            console.log("Register API response (server error):", serverErrorResponse);
            return serverErrorResponse;
        }
    }
}, {
    body: RegisterBodyDto,
    response: { // Явное описание структуры ответов для 201 и 422
        201: t.Object({
            success: t.Boolean(),
            data: t.Object({
                token: t.String(),
                user: t.Object({
                    user_id: t.Number(),
                    username: t.String(),
                    email: t.String()
                })
            })
        }),
        422: t.Object({
            success: t.Boolean(),
            message: t.Object({
                message: t.String(),
                text: t.String()
            })
        })
    }
});

// Endpoint для смены пароля
authRoutes.post('/changePassword', async (ctx) => {
    const authorizationHeader = ctx.headers.authorization;
    const verification = await ctx.jwt.verify(authorizationHeader);
    if (!verification) {
        return { 401: { success: false, message: 'Invalid token' } };
    }

    const { username } = verification as { username: string; userId: number };

    const changeResult = await AuthService.changePassword(username, ctx.body.oldPassword, ctx.body.newPassword);

    if (!changeResult.success) {
        return { 400: { success: false, message: changeResult.message } };
    } else {
        return { 200: { success: true, message: "Пароль успешно изменен" } };
    }
}, {
    body: ChangePasswordBodyDto,
    response: t.Object({
        success: t.Boolean(),
        message: t.Optional(t.String())
    }),
    beforeHandle: async (ctx) => {
        const authorizationHeader = ctx.headers.authorization;
        if (!authorizationHeader || !await ctx.jwt.verify(authorizationHeader)) {
            return { 401: { success: false, message: "Unauthorized" } };
        }
    }
});

export default authRoutes;