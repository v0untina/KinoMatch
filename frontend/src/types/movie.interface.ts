// frontend/src/types/movie.interface.ts
export interface Movie {
    movie_id: number;
    title: string;
    original_title?: string | null;
    year?: number | null;
    description?: string | null;
    kinomatch_rating?: number | null;
    imdb_rating?: number | null;
    poster_url?: string | null;
    trailer_url?: string | null;
    country_id?: number | null;
}