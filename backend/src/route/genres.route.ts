// backend/src/route/genres.route.ts
import { Elysia } from 'elysia';
import prisma from '../util/prisma';

const GenresRoute = new Elysia({ prefix: '/genres', detail: { tags: ['Genres'] } });

GenresRoute.get('/', async () => {
    try {
        const genres = await prisma.genres.findMany();
        return { genres };
    } catch (error) {
        console.error("Error fetching genres:", error);
        return new Response(JSON.stringify({ success: false, message: "Failed to fetch genres" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});

export default GenresRoute;