// user.provider.ts
import type {IUser} from "../types/user.interface.ts";
import db from "../util/prisma.ts";
import {createHash} from 'node:crypto';

export class UserProvider {
    // Получить по ID
    static getByID = async (id: number) => {
        try {
            const user = await db.users.findUnique({where: {user_id: id}});
            return user || null; // Возвращаем null, если не найден
        } catch (error) {
            console.error(`Error getting user by ID ${id}:`, error);
            throw new Error("Database error while fetching user by ID"); // Выбрасываем исключение
        }
    }

    // Получить по username
    static getByUsername = async (username: string) => {
        try {
            const user = await db.users.findUnique({where: {username}});
            return user || null; // Возвращаем null, если не найден
        } catch (error) {
            console.error(`Error getting user by username ${username}:`, error);
            throw new Error("Database error while fetching user by username"); // Выбрасываем исключение
        }
    }

    // Получить по email
    static getByEmail = async (email: string) => {
        try {
            const user = await db.users.findUnique({where: {email}});
            return user || null; // Возвращаем null, если не найден
        } catch (error) {
            console.error(`Error getting user by email ${email}:`, error);
            throw new Error("Database error while fetching user by email"); // Выбрасываем исключение
        }
    }

    // Получить по username или email (новый метод)
    static getByUsernameOrEmail = async (username: string, email: string) => {
        try {
            const user = await db.users.findFirst({
                where: {
                    OR: [
                        { username: username },
                        { email: email }
                    ]
                }
            });
            return user || null; // Возвращаем null, если не найден
        } catch (error) {
            console.error(`Error getting user by username or email (${username}, ${email}):`, error);
            throw new Error("Database error while fetching user by username or email"); // Выбрасываем исключение
        }
    }


    // Создать
    static create = async (username: string, email: string, password: string) => {
        let hashedPassword = createHash('sha512').update(password).digest('hex');
        try {
            return await db.users.create({
                data: {
                    username,
                    email,
                    password_hash: hashedPassword, // Исправлено: password_hash
                }
            });
        } catch (error) {
            console.error("Error creating user:", error);
            throw new Error("Database error while creating user"); // Выбрасываем исключение
        }
    }

    // Обновить данные
    static update = async (id: number, data: Partial<IUser>) => {
        try {
            return await db.users.update({
                where: { user_id: id }, // Исправлено: user_id
                data
            });
        } catch (error) {
            console.error(`Error updating user with id ${id}:`, error);
            throw new Error("Database error while updating user"); // Выбрасываем исключение
        }
    }

    // Удалить
    static delete = async (id: number) => {
        try {
            return await db.users.delete({where: {user_id: id}}); // Исправлено: user_id
        } catch (error) {
            console.error(`Error deleting user with id ${id}:`, error);
            throw new Error("Database error while deleting user"); // Выбрасываем исключение
        }
    }
}