// frontend/src/types/director.interface.ts
export interface Director {
    director_id: number;
    name: string;
    bio?: string | null;
    photo_url?: string | null;
    country_id?: number | null;
}