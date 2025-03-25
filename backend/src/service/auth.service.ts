//auth.service.ts
import {createHash} from "node:crypto";
import {UserProvider} from "../providers/user.provider.ts";
import prisma from "../util/prisma.ts";

export class AuthService {
    // Авторизация
    static login = async (username: string, password: string) => {
      try {
          let hashedInput = createHash('sha512').update(password).digest('hex');
          const userData = await UserProvider.getByUsername(username);
          if (!userData) {
              return { success: false, message: "Неверный логин или пароль" };
          }
  
          if (hashedInput !== userData.password_hash) {
              return { success: false, message: "Неверный логин или пароль" };
          }
  
          return { success: true, data: { user_id: userData.user_id, username: userData.username, email: userData.email } };
      } catch (error) {
          console.error("Error during login:", error);
          return { success: false, message: "Ошибка при входе в систему" };
      }
  }

    // Регистрация
    static register = async (username: string, email: string, password: string) => {
      try {
          console.log("AuthService.register called with:", { username, email, password }); // ЛОГИРУЕМ ВХОДЯЩИЕ ДАННЫЕ

          const existingUser = await UserProvider.getByUsernameOrEmail(username, email);
          if (existingUser) {
              console.log("AuthService.register: User already exists"); // ЛОГИРУЕМ, ЕСЛИ ПОЛЬЗОВАТЕЛЬ УЖЕ СУЩЕСТВУЕТ
              return { success: false, message: "Пользователь с таким логином или почтой уже существует" };
          }

          const userData = await UserProvider.create(username, email, password);

          console.log("AuthService.register: User created:", userData); // ЛОГИРУЕМ ДАННЫЕ СОЗДАННОГО ПОЛЬЗОВАТЕЛЯ

          return { success: true, data: userData };
      } catch (error) {
          console.error("Error during registration:", error);
          return { success: false, message: "Ошибка при регистрации пользователя" };
      }
  }

    // Смена пароля
    static changePassword = async (username: string, oldPassword: string, newPassword: string) => {
        try {
            let oldPasswordHashed = createHash('sha512').update(oldPassword).digest('hex');
            let newPasswordHashed = createHash('sha512').update(newPassword).digest('hex');

            const userData = await UserProvider.getByUsername(username);
            if (!userData) {
                return { success: false, message: "Пользователь не найден" }; // Информативное сообщение об ошибке
            }

            if (oldPasswordHashed !== userData.password_hash) { // Исправлено: password_hash
                return { success: false, message: "Неверный старый пароль" }; // Информативное сообщение об ошибке
            }

            await UserProvider.update(userData.user_id, { password_hash: newPasswordHashed }); // Исправлено: password_hash
            return { success: true, message: "Пароль успешно изменен" }; // Сообщение об успехе
        } catch (error) {
            console.error("Error during password change:", error);
            return { success: false, message: "Ошибка при смене пароля" }; // Общая ошибка для безопасности
        }
    }
}