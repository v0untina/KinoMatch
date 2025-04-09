//authorization.middleware.ts
import type { Context } from 'elysia';

// Определяем интерфейс для store
interface Store {
    userId: number;
}

export const checkAuth = async (ctx: Context & { jwt: any, store: Store, request: Request }) => {
    const authorizationHeader = ctx.request.headers.get('authorization');
    console.log('Authorization header:', authorizationHeader); // Логируем заголовок
    if (!authorizationHeader) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const verification = await ctx.jwt.verify(authorizationHeader);
        console.log('JWT verification result:', verification); // Логируем результат верификации
        if (!verification) {
            return new Response("Unauthorized", { status: 401 });
        }

        const userId = verification.userId;
        if (!userId || typeof userId !== 'number') {
            return new Response("Invalid token: userId not found", { status: 401 });
        }

        ctx.store.userId = userId;
        console.log('Установлен userId в store:', userId);
    } catch (error) {
        console.error("JWT Verification Error:", error);
        return new Response("Unauthorized", { status: 401 });
    }
};
