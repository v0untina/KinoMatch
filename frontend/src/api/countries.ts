// frontend/src/api/countries.ts
export const getCountries = async () => {
    try {
        const response = await fetch("http://localhost:8000/api/countries");
        if (!response.ok) {
            throw new Error(`Failed to fetch countries: ${response.statusText}`);
        }
        const data = await response.json();
        return data.countries;
    } catch (error) {
        console.error("Error fetching countries:", error);
        throw error;
    }
};