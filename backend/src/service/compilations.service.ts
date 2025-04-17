// backend/src/service/compilations.service.ts
import { PrismaClient, Prisma } from '@prisma/client'; // Импортируем Prisma

const prisma = new PrismaClient(); // Инициализируем Prisma Client

// --- 1. Функция получения списка СИСТЕМНЫХ подборок ---
export const getSystemCompilations = async () => {
    try {
        const compilations = await prisma.user_movie_collections.findMany({
            where: {
                user_id: null, // Только системные
            },
            select: {
                collection_id: true,
                title: true,
            },
            orderBy: {
                 collection_id: 'asc' // Для консистентного порядка
            }
        });
        return compilations;
    } catch (error) {
        console.error("Error fetching system compilations:", error);
        throw new Error("Не удалось получить системные подборки");
    }
    // Не отключаем prisma здесь, если он используется в других запросах
};

// --- 2. Функция получения деталей ОДНОЙ подборки (ЛЮБОЙ - системной или пользовательской) ---
export const getCompilationDetails = async (id: number) => {
    try {
        const compilation = await prisma.user_movie_collections.findUnique({
            where: {
                collection_id: id,
                // БЕЗ фильтра по user_id: null - ищем любую по ID
            },
            include: { // Включаем связанные данные
                collection_movies: {
                    select: {
                        movies: { // Выбираем данные из связанной таблицы movies
                            select: {
                                movie_id: true,
                                title: true,
                                original_title: true,
                                year: true,
                                poster_filename: true,
                                kinomatch_rating: true,
                                imdb_rating: true,
                                // Добавьте другие поля фильма, если нужно на странице деталей
                            }
                        }
                    },
                    orderBy: { // Для консистентного порядка фильмов
                        collection_movie_id: 'asc'
                    }
                },
                users: { // Включаем данные пользователя, если это не системная подборка
                    select: {
                        user_id: true,
                        username: true
                    }
                }
            }
        });

        // Если подборка с таким ID вообще не найдена
        if (!compilation) {
            throw new Error(`Подборка с ID ${id} не найдена`);
        }

        // Формируем ответ: извлекаем фильмы и добавляем информацию о создателе
        const movies = compilation.collection_movies
                                .map(cm => cm.movies) // Берем объект фильма
                                .filter(movie => movie !== null); // Убираем возможные null

        return {
            collection_id: compilation.collection_id,
            title: compilation.title,
            // Добавляем информацию о пользователе, если она есть
            user: compilation.users ? { id: compilation.users.user_id, username: compilation.users.username } : null,
            // Фильмы в подборке
            movies: movies,
        };

    } catch (error: any) {
        console.error(`Error fetching compilation details for ID ${id}:`, error);
        // Перебрасываем ошибку с понятным сообщением
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             throw new Error(`Подборка с ID ${id} не найдена`); // Конкретизируем Prisma-ошибку
         } else if (error.message.includes("not found")) { // Если уже бросили кастомную
             throw error;
         }
        // Общая ошибка
        throw new Error(`Не удалось получить детали подборки: ${error.message}`);
    }
};


// --- 3. Функция создания ПОЛЬЗОВАТЕЛЬСКОЙ подборки ---
export const createUserCompilation = async (userId: number, title: string, movieIds: number[]) => {
    // Проверка входных данных
    if (!userId || !title || !Array.isArray(movieIds) || movieIds.length === 0) {
        throw new Error("Некорректные входные данные: требуются userId, title и непустой массив movieIds.");
    }

    try {
        // Используем транзакцию для атомарности операций
        const newCompilation = await prisma.$transaction(async (tx) => {
            // 1. Создаем подборку
            const collection = await tx.user_movie_collections.create({
                data: {
                    user_id: userId,
                    title: title,
                    likes: 0, // Начальные лайки
                },
            });

            // 2. Подготавливаем данные для связей
            const moviesToLink = movieIds.map((movieId) => ({
                collection_id: collection.collection_id,
                movie_id: movieId,
            }));

            // 3. Создаем связи
            await tx.collection_movies.createMany({
                data: moviesToLink,
                skipDuplicates: true,
            });

            return collection; // Возвращаем созданную коллекцию
        });

        console.log(`User compilation "${title}" (ID: ${newCompilation.collection_id}) created for user ${userId}`);
        return newCompilation; // Возвращаем данные созданной подборки клиенту

    } catch (error: any) {
        console.error(`Error creating user compilation for user ${userId}:`, error);
        // Обработка специфичных ошибок Prisma
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2003' || error.code === 'P2025') {
                throw new Error("Не удалось связать фильмы: один или несколько ID фильмов не существуют.");
            }
        }
        // Общая ошибка
        throw new Error(`Не удалось создать пользовательскую подборку: ${error.message}`);
    }
};

// --- 4. Функция получения подборок КОНКРЕТНОГО пользователя (ИСПРАВЛЕНО) ---
export const getUserCompilations = async (userId: number) => {
    if (!userId) {
        throw new Error("Требуется ID пользователя для получения его подборок.");
    }
    try {
        const compilations = await prisma.user_movie_collections.findMany({
            where: {
                user_id: userId,
            },
            select: {
                collection_id: true,
                title: true,
                is_published: true, // <-- УБЕДИСЬ, ЧТО ЭТО ПОЛЕ ВЫБИРАЕТСЯ!
                collection_movies: {
                    select: { movies: { select: { poster_filename: true }}},
                    orderBy: { collection_movie_id: 'asc' },
                    take: 4,
                },
                _count: { select: { collection_movies: true } }
            },
            orderBy: {
                collection_id: 'desc',
            },
        });

        // Форматируем результат, ВКЛЮЧАЯ isPublished
        const formattedCompilations = compilations.map(comp => ({
            id: comp.collection_id,
            title: comp.title,
            movieCount: comp._count.collection_movies,
            previewPosters: comp.collection_movies
                                .map(cm => cm.movies?.poster_filename)
                                .filter((p): p is string => p !== null && p !== undefined),
            isPublished: comp.is_published // <-- ДОБАВЛЯЕМ isPublished В ВОЗВРАЩАЕМЫЙ ОБЪЕКТ!
        }));

        return formattedCompilations; // Теперь объекты содержат isPublished

    } catch (error: any) {
        console.error(`Error fetching compilations for user ${userId}:`, error);
        throw new Error(`Не удалось получить подборки пользователя: ${error.message}`);
    }
};


// --- 5. Функция автоматического обновления СИСТЕМНЫХ подборок (сложные правила) ---
// (Эта функция предоставлена вами ранее, включаю ее для полноты файла)
export const updateSystemCompilationsByGenre = async () => {
    let localPrisma: PrismaClient | null = null; // Локальный экземпляр Prisma
    try {
        localPrisma = new PrismaClient();
        console.log("Starting automatic update of system compilations by genre (complex rules)...");

        const systemCompilations = await localPrisma.user_movie_collections.findMany({
            where: { user_id: null },
            select: { collection_id: true, title: true },
        });

        interface CompilationRule { requiredGenres?: string[]; optionalOrGenres?: string[]; }
        const compilationRules: { [title: string]: CompilationRule } = {
             "Жуткие фильмы": { optionalOrGenres: ["ужасы", "триллер"] },
             "Лучшие мультфильмы всех времен": { requiredGenres: ["мультфильм"], optionalOrGenres: ["семейный", "фэнтези"] },
             "Военные фильмы": { requiredGenres: ["военный"], optionalOrGenres: ["драма", "история"] },
             "Фильмы-мюзикл": { optionalOrGenres: ["мюзикл", "музыкальный"] },
             "Лучшие комедии": { optionalOrGenres: ["комедия"] },
             "Фильмы про супергероев": { optionalOrGenres: ["фантастика", "боевик", "приключения"] },
             "Фильмы про спорт": { optionalOrGenres: ["спорт"] },
             "Захватывающие детективы": { requiredGenres: ["детектив"], optionalOrGenres: ["триллер"] },
             "Криминальные драмы": { requiredGenres: ["криминал", "драма"] },
             "Фантастические миры": { optionalOrGenres: ["фантастика", "фэнтези"] },
             "Дикий Запад": { optionalOrGenres: ["вестерн", "приключения"] },
             "Документальное кино": { optionalOrGenres: ["документальный", "история"] },
        };

        for (const compilation of systemCompilations) {
            const compilationTitle = compilation.title;
            const rule = compilationRules[compilationTitle];
            if (!rule) { console.log(`No rule found for compilation "${compilationTitle}"`); continue; }

            console.log(`Updating compilation "${compilationTitle}" with rule:`, rule);
            const allGenreNames = [...(rule.requiredGenres || []), ...(rule.optionalOrGenres || [])];
            if (allGenreNames.length === 0) { console.log(`  No genres specified for "${compilationTitle}". Skipping.`); continue; }

            const genreIdsMap = new Map<string, number>();
            const genresFromDb = await localPrisma.genres.findMany({ where: { name: { in: allGenreNames } }, select: { genre_id: true, name: true } });
            genresFromDb.forEach(g => genreIdsMap.set(g.name, g.genre_id));

            const requiredGenreIds = (rule.requiredGenres || []).map(name => genreIdsMap.get(name)).filter((id): id is number => id !== undefined);
            const optionalOrGenreIds = (rule.optionalOrGenres || []).map(name => genreIdsMap.get(name)).filter((id): id is number => id !== undefined);

            if ((rule.requiredGenres || []).length !== requiredGenreIds.length || (rule.optionalOrGenres || []).length !== optionalOrGenreIds.length) {
                console.warn(`  Could not find all specified genre IDs in DB for "${compilationTitle}". Skipping update.`); continue;
            }

            let movieIdsValues: number[] = [];
            try {
                const whereConditions: Prisma.moviesWhereInput[] = [];
                if (requiredGenreIds.length > 0) { whereConditions.push({ AND: requiredGenreIds.map(reqId => ({ movie_genres: { some: { genre_id: reqId } } })) }); }
                if (optionalOrGenreIds.length > 0) { whereConditions.push({ movie_genres: { some: { genre_id: { in: optionalOrGenreIds } } } }); }

                if (whereConditions.length > 0) {
                    const movies = await localPrisma.movies.findMany({ where: { AND: whereConditions }, select: { movie_id: true } });
                    movieIdsValues = movies.map(m => m.movie_id);
                    console.log(`  Found ${movieIdsValues.length} movies matching rule for "${compilationTitle}".`);
                } else { console.log(`  No valid conditions for "${compilationTitle}".`); }
            } catch (queryError) { console.error(`  Error querying movies for "${compilationTitle}":`, queryError); continue; }

            await localPrisma.collection_movies.deleteMany({ where: { collection_id: compilation.collection_id } });
            console.log(`  Cleared old movie links for "${compilationTitle}".`);

            if (movieIdsValues.length > 0) {
                try {
                    await localPrisma.collection_movies.createMany({
                        data: movieIdsValues.map(movieId => ({ collection_id: compilation.collection_id, movie_id: movieId })),
                        skipDuplicates: true
                    });
                     console.log(`  Finished adding ${movieIdsValues.length} movies to "${compilationTitle}".`);
                } catch (createError) { console.error(`  Error bulk adding movies to "${compilationTitle}":`, createError); }
            } else { console.log(`  No movies found for "${compilationTitle}". Links remain cleared.`); }
        } // Конец for

        console.log("Automatic update of system compilations by genre (complex rules) finished.");
    } catch (error) {
        console.error("Error updating system compilations by genre (complex rules):", error);
    } finally {
        if (localPrisma) {
            await localPrisma.$disconnect();
            console.log("Disconnected local Prisma client for update job.");
        }
    }
};


// --- 6. НОВАЯ ФУНКЦИЯ: Публикация подборки пользователем ---
export const publishUserCompilation = async (userId: number, collectionId: number) => {
    if (!userId || !collectionId) { throw new Error("Требуются ID пользователя и ID подборки."); }
    try {
        const updateResult = await prisma.user_movie_collections.updateMany({
            where: { collection_id: collectionId, user_id: userId }, // Проверяем владение
            data: { is_published: true }, // Публикуем
        });
        if (updateResult.count === 0) {
             const exists = await prisma.user_movie_collections.findFirst({ where: { collection_id: collectionId } });
             if (!exists) throw new Error(`Подборка с ID ${collectionId} не найдена.`);
             else throw new Error(`Вы не можете опубликовать эту подборку.`);
        }
        console.log(`Compilation ID ${collectionId} published by user ${userId}`);
        return { success: true, message: "Подборка успешно опубликована." };
    } catch (error: any) {
         console.error(`Error publishing compilation ${collectionId} by user ${userId}:`, error);
         throw new Error(`Не удалось опубликовать подборку: ${error.message}`);
    }
};

// --- 7. НОВАЯ ФУНКЦИЯ: Получение ВСЕХ опубликованных подборок (для GeneralPage) ---
export const getPublishedCompilations = async (limit: number = 20, offset: number = 0) => {
    try {
        const compilations = await prisma.user_movie_collections.findMany({
            where: { is_published: true, user_id: { not: null } }, // Только опубликованные пользовательские
            select: {
                collection_id: true, title: true,
                collection_movies: { select: { movies: { select: { poster_filename: true }}}, orderBy: { collection_movie_id: 'asc' }, take: 4 },
                _count: { select: { collection_movies: true } },
                users: { select: { user_id: true, username: true } } // Информация об авторе
            },
            orderBy: { collection_id: 'desc' }, // Сначала новые
            take: limit,
            skip: offset,
        });
        // Форматируем результат (включая автора)
        const formattedCompilations = compilations.map(comp => ({
            id: comp.collection_id,
            title: comp.title,
            movieCount: comp._count.collection_movies,
            previewPosters: comp.collection_movies.map(cm => cm.movies?.poster_filename).filter((p): p is string => p !== null && p !== undefined),
            author: comp.users ? { id: comp.users.user_id, username: comp.users.username } : null
        }));
        const totalCount = await prisma.user_movie_collections.count({ where: { is_published: true, user_id: { not: null } } });
        return { data: formattedCompilations, pagination: { total: totalCount, limit: limit, offset: offset }};
    } catch (error: any) {
        console.error("Error fetching published compilations:", error);
        throw new Error(`Не удалось получить опубликованные подборки: ${error.message}`);
    }
};