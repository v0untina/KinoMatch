import type {Context} from 'elysia';

export const authorizationMiddleware = async (ctx: Context) => {
    const authorizationHeader = ctx.headers.authorization;
    if (!authorizationHeader) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const verification = await ctx.jwt.verify(authorizationHeader);
        if (!verification) {
            return new Response("Unauthorized", { status: 401 });
        }
        // Можно добавить логику проверки ролей/прав доступа здесь, если нужно
    } catch (error) {
        console.error("JWT Verification Error:", error); // Логируем ошибки верификации JWT
        return new Response("Unauthorized", { status: 401 }); // Возвращаем 401 в случае ошибки верификации
    }
    // Если JWT валиден, авторизация пройдена - middleware ничего не возвращает, обработка запроса продолжается
};