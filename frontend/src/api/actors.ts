// frontend/src/api/actors.ts
export const getActors = async () => {
  try {
      const response = await fetch("http://localhost:8000/api/actors");
      if (!response.ok) {
          throw new Error(`Failed to fetch actors: ${response.statusText}`);
      }
      const data = await response.json();
      return data.actors;
  } catch (error) {
      console.error("Error fetching actors:", error);
      throw error; //  Чтобы ошибка была видна в вызывающем коде
  }
};