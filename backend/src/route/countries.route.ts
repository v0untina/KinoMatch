// backend/src/route/countries.route.ts
import { Elysia } from 'elysia';
import prisma from '../util/prisma';

const CountriesRoute = new Elysia({ prefix: '/countries', detail: { tags: ['Countries'] } });

CountriesRoute.get('/', async () => {
    try {
        const countries = await prisma.countries.findMany();
        return { countries };
    } catch (error) {
        console.error("Error fetching countries:", error);
        return new Response(JSON.stringify({ success: false, message: "Failed to fetch countries" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});

export default CountriesRoute;