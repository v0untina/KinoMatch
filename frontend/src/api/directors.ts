// frontend/src/api/directors.ts
export const getDirectors = async () => {
    try {
        const response = await fetch("http://localhost:8000/api/directors");
        if (!response.ok) {
            throw new Error(`Failed to fetch directors: ${response.statusText}`);
        }
        const data = await response.json();
        return data.directors;
    } catch (error) {
        console.error("Error fetching directors:", error);
        throw error;
    }
};