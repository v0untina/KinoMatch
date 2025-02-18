import { Elysia } from 'elysia';
import prisma from '../util/prisma';

const MoviesRoute = new Elysia({ prefix: '/movies', detail: { tags: ['Movies'] } });

MoviesRoute.get('/', async () => {
    try {
        const movies = await prisma.movies.findMany({
            select: {
                movie_id: true,
                title: true,
                poster_filename: true,
            },
        });
        return { movies };
    } catch (error) {
        console.error("Error fetching movies:", error);
        return new Response(JSON.stringify({ success: false, message: "Failed to fetch movies" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    } finally {
        await prisma.$disconnect(); // Важно закрывать соединение Prisma
    }
});

export default MoviesRoute;