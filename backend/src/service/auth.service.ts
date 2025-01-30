import {createHash} from "node:crypto";
import {UserProvider} from "../providers/user.provider.ts";
import prisma from "../util/prisma.ts";

export class AuthService {
  // Авторизация
  static login = async (username: string, password: string) => {
    let hashedInput = createHash('sha512').update(password).digest('hex');
    let userData = await UserProvider.getByUsername(username);
    if (!userData) return false;

    // Сверяем пароль
    if (hashedInput !== userData.password) return false;

    // Авторизация успешна
    return userData;
  }

  // Регистрация
  static register = async (username: string, email: string, password: string) => {
    try {
      let uData = await prisma.user.findFirst({
        where: {
          OR: [
            {username}, {email}
          ]
        }
      })
      // Такой пользователь уже существует
      if (uData) return false;
    } catch (e) {
      console.error(e);
      return false;
    }

    return await UserProvider.create(username, email, password);
  }

  // Смена пароля
  static changePassword = async (username: string, oldPassword: string, newPassword: string) => {
    // Хэш старого пароля
    let oldPasswordHashed = createHash('sha512').update(oldPassword).digest('hex');
    // Хэш нового пароля
    let newPasswordHashed = createHash('sha512').update(newPassword).digest('hex');

    // Получаем данные
    let userData = await UserProvider.getByUsername(username);
    if (!userData) return false;

    // Сверяем пароль
    if (oldPasswordHashed !== userData.password) return false;

    // Меняем пароль
    let updateResult = await UserProvider.update(userData.id, {
      password: newPasswordHashed
    })
    return !!updateResult;
  }
}