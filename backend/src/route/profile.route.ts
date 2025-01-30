import {Elysia} from 'elysia';
import {ProfileParamsBodyDto, ProfileResponseDto} from "../dto/Auth.dto";
import {DefaultResponseDto, OffsetLengthQueryDto} from "../dto/Response.dto.ts";
import {UserProvider} from "../providers/user.provider.ts";
import prisma from "../util/prisma.ts";

const profileRoutes = new Elysia({prefix: "/profile", detail: {tags: ["Profile"]}});

// Endpoint для получения своего профиля
profileRoutes.get('/', async (ctx) => {
  const {username} = await ctx.jwt.verify(ctx.headers["authorization"]);

  // Получаем профиль
  let userData = await UserProvider.getByUsername(username);
  if (!userData) return {success: false};

  // Возвращаем
  return {success: true, data: userData};
}, {response: ProfileResponseDto});

// Endpoint для получения списка избранного
profileRoutes.get('/favorites', async (ctx) => {
  const {username} = await ctx.jwt.verify(ctx.headers["authorization"]);

  try {
    // Получаем профиль
    let userData = await UserProvider.getByUsername(username);
    if (!userData) return {success: false};

    let length = parseInt(ctx.query.length || "20");
    let offset = parseInt(ctx.query.offset || "0");

    // Получаем фаворитки
    let eventsData = await prisma.userFavorites.findMany({
      where: {
        userId: userData.id
      },
      include: {
        competition: {
          include: {
            Genders: true
          }
        }
      },
      take: length,
      skip: offset
    })
    if (!eventsData) return {success: false};

    return {
      success: true,
      pagination: {
        length: length,
        offset: offset
      },
      data: eventsData
    }
  } catch (e) {
    console.error(e);
    return {success: false};
  }
}, {query: OffsetLengthQueryDto, response: DefaultResponseDto});

// Endpoint для добавления в избранное
profileRoutes.post('/favorites/:competitionId', async (ctx) => {
  const {username} = await ctx.jwt.verify(ctx.headers["authorization"]);

  // Получаем профиль
  let userData = await UserProvider.getByUsername(username);
  if (!userData) return {success: false};

  // Добавляем эвент
  try {
    await prisma.userFavorites.create({
      data: {
        userId: userData.id,
        competitionId: ctx.params.competitionId
      }
    })
    return {success: true};
  } catch (e) {
    console.error(e);
    return {success: false};
  }
}, {params: ProfileParamsBodyDto, response: ProfileResponseDto});

// Endpoint для удаления из избранных
profileRoutes.delete('/favorites/:competitionId', async (ctx) => {
  const {username} = await ctx.jwt.verify(ctx.headers["authorization"]);

  // Получаем профиль
  let userData = await UserProvider.getByUsername(username);
  if (!userData) return {success: false};

  // Обновляем профиль
  try {
    await prisma.userFavorites.delete({
      where: {
        user_competition_unique: {
          userId: userData.id,
          competitionId: ctx.params.competitionId
        }
      }
    })
    return {success: true};
  } catch (e) {
    console.error(e);
    return {success: false};
  }
}, {params: ProfileParamsBodyDto, response: ProfileResponseDto});

// Экспорт маршрутов
export default profileRoutes;