import { PrismaClient, Prisma } from '@prisma/client'; // Импортируем Prisma

const prisma = new PrismaClient();

// --- Функция получения списка системных подборок (без изменений) ---
export const getSystemCompilations = async () => {
    try {
        const compilations = await prisma.user_movie_collections.findMany({
            where: {
                user_id: null,
            },
            select: {
                collection_id: true,
                title: true,
            },
        });
        return compilations;
    } catch (error) {
        console.error("Error fetching system compilations:", error);
        throw new Error("Failed to fetch system compilations");
    } finally {
        // Не отключаем здесь, если используется в cron
        // await prisma.$disconnect();
    }
};

// --- Функция получения деталей одной подборки (без изменений) ---
export const getCompilationDetails = async (id: number) => {
    try {
        const compilation = await prisma.user_movie_collections.findUnique({
            where: {
                collection_id: id,
                user_id: null, // Убедимся, что ищем системную подборку
            },
            include: {
                collection_movies: {
                    select: {
                        movies: {
                            select: {
                                movie_id: true,
                                title: true,
                                poster_filename: true,
                            }
                        }
                    }
                }
            }
        });

        if (!compilation) {
            throw new Error(`Compilation with ID ${id} not found`);
        }

        const movies = compilation.collection_movies.map(cm => cm.movies).filter(movie => movie !== null);

        return {
            collection_id: compilation.collection_id,
            title: compilation.title,
            movies: movies,
        };

    } catch (error) {
        console.error(`Error fetching compilation details for ID ${id}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             throw new Error(`Compilation with ID ${id} not found`);
        }
        throw error;
    } finally {
         // Не отключаем здесь, если используется в cron
         // await prisma.$disconnect();
    }
};


// --- Обновленная функция автоматического обновления подборок по сложным правилам ---
export const updateSystemCompilationsByGenre = async () => {
    let localPrisma: PrismaClient | null = null; // Локальный экземпляр Prisma для этой функции
    try {
        localPrisma = new PrismaClient(); // Создаем экземпляр
        console.log("Starting automatic update of system compilations by genre (complex rules)...");

        // 1. Получаем все системные подборки
        const systemCompilations = await localPrisma.user_movie_collections.findMany({
            where: {
                user_id: null,
            },
            select: {
                collection_id: true,
                title: true,
            },
        });

        // 2. Новая структура для правил подборок
        interface CompilationRule {
            requiredGenres?: string[];
            optionalOrGenres?: string[];
        }

        // Определяем правила для каждой подборки
        const compilationRules: { [title: string]: CompilationRule } = {
            "Жуткие фильмы": { optionalOrGenres: ["ужасы", "триллер"] },
            "Лучшие мультфильмы всех времен": {
                requiredGenres: ["мультфильм"],
                optionalOrGenres: ["семейный", "фэнтези"]
            },
            "Военные фильмы": {
                 requiredGenres: ["военный"],
                 optionalOrGenres: ["драма", "история"]
            },
            "Фильмы-мюзикл": { optionalOrGenres: ["мюзикл", "музыкальный"] },
            "Лучшие комедии": { optionalOrGenres: ["комедия"] },
            "Фильмы про супергероев": { optionalOrGenres: ["фантастика", "боевик", "приключения"] },
            "Фильмы про спорт": { optionalOrGenres: ["спорт"] },
            "Захватывающие детективы": {
                 requiredGenres: ["детектив"],
                 optionalOrGenres: ["триллер"]
            },
            "Криминальные драмы": {
                 requiredGenres: ["криминал", "драма"]
            },
            "Фантастические миры": { optionalOrGenres: ["фантастика", "фэнтези"] },
            "Дикий Запад": { optionalOrGenres: ["вестерн", "приключения"] },
            "Документальное кино": { optionalOrGenres: ["документальный", "история"] },
        };

        // 3. Итерация по подборкам и применение правил
        for (const compilation of systemCompilations) {
            const compilationTitle = compilation.title;
            const rule = compilationRules[compilationTitle];

            if (rule) {
                console.log(`Updating compilation "${compilationTitle}" with rule:`, rule);

                const allGenreNames = [
                    ...(rule.requiredGenres || []),
                    ...(rule.optionalOrGenres || []),
                ];

                if (allGenreNames.length === 0) {
                    console.log(`  No genres specified for compilation "${compilationTitle}". Skipping.`);
                    continue;
                }

                const genreIdsMap = new Map<string, number>();
                const genresFromDb = await localPrisma.genres.findMany({
                    where: { name: { in: allGenreNames } },
                    select: { genre_id: true, name: true },
                });
                genresFromDb.forEach(g => genreIdsMap.set(g.name, g.genre_id));

                const requiredGenreIds = (rule.requiredGenres || [])
                    .map(name => genreIdsMap.get(name))
                    .filter((id): id is number => id !== undefined);

                const optionalOrGenreIds = (rule.optionalOrGenres || [])
                    .map(name => genreIdsMap.get(name))
                    .filter((id): id is number => id !== undefined);

                const requiredGenresNotFound = (rule.requiredGenres || []).length !== requiredGenreIds.length;
                const optionalGenresNotFound = (rule.optionalOrGenres || []).length !== optionalOrGenreIds.length;

                if (requiredGenresNotFound || optionalGenresNotFound) {
                    console.warn(`  Could not find all specified genre IDs in DB for "${compilationTitle}". Check genre names. Skipping update for this compilation.`);
                    continue; // Пропускаем подборку, если не все жанры найдены
                }

                // 4. Получаем movie_ids фильмов по новым правилам
                let movieIdsValues: number[] = [];

                try {
                    const whereConditions: Prisma.moviesWhereInput[] = [];

                    if (requiredGenreIds.length > 0) {
                        whereConditions.push({
                            AND: requiredGenreIds.map(reqId => ({
                                movie_genres: { some: { genre_id: reqId } }
                            }))
                        });
                    }

                    if (optionalOrGenreIds.length > 0) {
                         whereConditions.push({
                            movie_genres: { some: { genre_id: { in: optionalOrGenreIds } } }
                         });
                    }

                    if (whereConditions.length > 0) {
                        const movies = await localPrisma.movies.findMany({
                            where: {
                               AND: whereConditions
                            },
                            select: {
                                movie_id: true,
                            }
                        });
                        movieIdsValues = movies.map(m => m.movie_id);
                        console.log(`  Found ${movieIdsValues.length} movies matching the rule for "${compilationTitle}".`);
                    } else {
                         console.log(`  No valid conditions to query movies for "${compilationTitle}".`);
                    }

                } catch (queryError) {
                     console.error(`  Error querying movies for "${compilationTitle}":`, queryError);
                     continue;
                }

                // 5. Обновляем collection_movies
                if (movieIdsValues.length > 0) {
                  // Очищаем СТАРЫЕ связи только для ТЕКУЩЕЙ подборки перед добавлением новых
                  await localPrisma.collection_movies.deleteMany({
                      where: {
                          collection_id: compilation.collection_id,
                      }
                  });
                  console.log(`  Cleared old movie links for compilation "${compilationTitle}".`);

                  // Добавляем новые связи
                  for (const movieId of movieIdsValues) {
                      // Проверка на существующую связь теперь не нужна, т.к. мы очистили
                      try {
                            await localPrisma.collection_movies.create({
                                data: {
                                    collection_id: compilation.collection_id,
                                    movie_id: movieId,
                                },
                            });
                            // console.log(`  Added movie ${movieId} to compilation "${compilationTitle}"`); // Можно сделать менее подробный лог
                      } catch (createError) {
                           console.error(`  Error adding movie ${movieId} to compilation "${compilationTitle}":`, createError);
                      }
                  }
                   console.log(`  Finished adding ${movieIdsValues.length} movies to compilation "${compilationTitle}".`);
                } else {
                    // Если не найдено фильмов по новым правилам, очищаем связи для этой подборки
                    await localPrisma.collection_movies.deleteMany({
                        where: {
                            collection_id: compilation.collection_id,
                        }
                    });
                    console.log(`  No movies found matching the rule for "${compilationTitle}". Cleared existing links.`);
                }

            } else {
                console.log(`No rule found for compilation "${compilationTitle}"`);
            }
        } // Конец цикла for

        console.log("Automatic update of system compilations by genre (complex rules) finished.");
    } catch (error) {
        console.error("Error updating system compilations by genre (complex rules):", error);
        // Не бросаем ошибку дальше, чтобы не остановить cron задачу
    } finally {
        if (localPrisma) {
            await localPrisma.$disconnect(); // Отключаем локальный экземпляр
            console.log("Disconnected local Prisma client for update job.");
        }
    }
};