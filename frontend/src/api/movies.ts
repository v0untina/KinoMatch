// frontend/src/api/movies.ts
export const getMovies = async () => {
    try {
        const response = await fetch("http://localhost:8000/api/movies");
        if (!response.ok) {
            throw new Error(`Failed to fetch movies: ${response.statusText}`);
        }
        const data = await response.json();
        return data.movies;
    } catch (error) {
        console.error("Error fetching movies:", error);
        throw error;
    }
};