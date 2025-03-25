// backend/src/route/directors.route.ts
import { Elysia } from 'elysia';
import prisma from '../util/prisma';

const DirectorsRoute = new Elysia({ prefix: '/directors', detail: { tags: ['Directors'] } });

DirectorsRoute.get('/', async () => {
    try {
        const directors = await prisma.directors.findMany();
        return { directors };
    } catch (error) {
        console.error("Error fetching directors:", error);
        return new Response(JSON.stringify({ success: false, message: "Failed to fetch directors" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});

export default DirectorsRoute;