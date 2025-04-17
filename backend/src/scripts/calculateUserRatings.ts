// backend/src/scripts/calculateUserRatings.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- Настройте веса здесь ---
const POINTS_PER_POST_LIKE = 1;        // Баллов за лайк поста
const POINTS_PER_COMPILATION_FAVORITE = 5; // Баллов за добавление подборки в избранное
// ---------------------------

async function calculateAndStoreRatings() {
    console.log(`[RatingCalculator] Starting user rating calculation... (Post Like: ${POINTS_PER_POST_LIKE}pts, Compilation Favorite: ${POINTS_PER_COMPILATION_FAVORITE}pts)`);
    let updatedUsersCount = 0;
    let errorCount = 0;

    try {
        // Получаем ID всех пользователей
        // Для больших баз данных можно реализовать пагинацию (skip/take)
        const users = await prisma.users.findMany({
            select: { user_id: true },
        });

        console.log(`[RatingCalculator] Found ${users.length} users to process.`);

        for (const user of users) {
            try {
                // 1. Считаем лайки на постах пользователя
                // Используем aggregate для суммирования поля 'likes'
                const postsAggregation = await prisma.posts.aggregate({
                    _sum: {
                        likes: true, // Суммируем поле likes
                    },
                    where: {
                        userId: user.user_id, // Посты этого пользователя
                        // Убедитесь, что поле называется userId в вашей модели Post Prisma
                        // Если оно называется authorId или иначе, замените здесь
                    },
                });
                const totalPostLikes = postsAggregation._sum.likes ?? 0;

                // 2. Считаем добавления подборок пользователя в избранное ДРУГИМИ пользователями
                const compilationFavoriteCount = await prisma.user_collection_favorites.count({
                    where: {
                        // Ищем записи, где подборка принадлежит текущему пользователю
                        user_movie_collections: {
                            user_id: user.user_id,
                        },
                        // Исключаем случаи, когда пользователь добавил свою же подборку в избранное
                        user_id: {
                            not: user.user_id,
                        },
                    },
                });
                const totalCompilationFavorites = compilationFavoriteCount;

                // 3. Рассчитываем итоговый рейтинг
                const calculatedRating = (totalPostLikes * POINTS_PER_POST_LIKE) + (totalCompilationFavorites * POINTS_PER_COMPILATION_FAVORITE);

                // 4. Обновляем рейтинг пользователя в БД
                await prisma.users.update({
                    where: { user_id: user.user_id },
                    data: { rating: calculatedRating }, // Обновляем поле rating
                });

                // console.log(`[RatingCalculator] User ${user.user_id}: ${totalPostLikes} post likes, ${totalCompilationFavorites} compilation favorites. Rating updated to ${calculatedRating}`);
                updatedUsersCount++;

            } catch (userError) {
                console.error(`[RatingCalculator] Error processing user ${user.user_id}:`, userError);
                errorCount++;
            }
        } // End for loop

        console.log(`[RatingCalculator] Finished calculation. Users updated: ${updatedUsersCount}. Errors: ${errorCount}.`);

    } catch (error) {
        console.error('[RatingCalculator] Fatal error during rating calculation process:', error);
        errorCount++; // Считаем как ошибку
    } finally {
        await prisma.$disconnect();
        console.log('[RatingCalculator] Prisma client disconnected.');
    }
}

// Запускаем расчет при выполнении скрипта
calculateAndStoreRatings();