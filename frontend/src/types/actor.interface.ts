// frontend/src/types/actor.interface.ts
export interface Actor {
    actor_id: number;
    name: string;
    bio?: string | null;
    photo_url?: string | null;
    country_id?: number | null;
}