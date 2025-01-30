// Импорт библиотек
import Elysia, {type Context} from 'elysia';
import {swagger} from '@elysiajs/swagger';
import {cors} from '@elysiajs/cors';
import jwt from "@elysiajs/jwt";
import 'dotenv/config';

import colors from "colors";
import packageJSON from "./../package.json";
import {Logestic} from 'logestic';

// Импорт роутов
import AuthRoute from "./route/auth.route.ts";
import ProfileRoute from "./route/profile.route.ts";

import {authorizationMiddleware} from "./middleware/authorization.middleware.ts";

// Создаём Elysia
const app = new Elysia();

async function bootstrap() {
  // Middleware для логирования
  app.use(Logestic.preset('fancy'));

  // JWT
  app.use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || ""
    })
  );

  // Подключение Swagger (доступен по /swagger)
  app.use(swagger(
    {
      documentation: {
        info: {
          title: 'Docs',
          version: '1.0.0'
        }
      }
    }
  ));

  // Preflight fix
  app.options("*", (ctx) => {
    ctx.set.status = 204;
    return '204 No Content';
  });

  // Middleware для защиты
  app.onBeforeHandle(async (ctx: Context) => {
    // Проверка авторизации
    let chk = await authorizationMiddleware(ctx);
    if (!chk) return ctx.error(401, "Unauthorized");
  })

  // Настройка CORS
  app.use(cors({
    credentials: true,
    origin: 'http://localhost:3000',
    allowedHeaders: "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  }));

  // Подключение роутов
  app.group("/api", (app) =>
    app
      .use(AuthRoute)
      .use(ProfileRoute)
  );

  // Едем
  app.listen(8000, () => {
    console.log(`Server started on http://localhost:8000`);
  });
}

bootstrap();