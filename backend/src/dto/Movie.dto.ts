// backend/src/dto/Movie.dto.ts
import { t } from 'elysia';

export const MovieIdParamsDto = t.Object({
    movieId: t.String(), // movieId как строка (потом преобразуем в число)
});