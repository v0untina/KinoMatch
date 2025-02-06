// backend/src/route/actors.route.ts
import { Elysia } from 'elysia';
import prisma from '../util/prisma';

const ActorsRoute = new Elysia({ prefix: '/actors', detail: { tags: ['Actors'] } });

ActorsRoute.get('/', async () => {
    try {
        const actors = await prisma.actors.findMany();
        return { actors };
    } catch (error) {
        console.error("Error fetching actors:", error);
        return new Response(JSON.stringify({ success: false, message: "Failed to fetch actors" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});

export default ActorsRoute;