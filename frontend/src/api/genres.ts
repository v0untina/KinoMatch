// frontend/src/api/genres.ts
export const getGenres = async () => {
    try {
        const response = await fetch("http://localhost:8000/api/genres");
        if (!response.ok) {
            throw new Error(`Failed to fetch genres: ${response.statusText}`);
        }
        const data = await response.json();
        return data.genres;
    } catch (error) {
        console.error("Error fetching genres:", error);
        throw error;
    }
};