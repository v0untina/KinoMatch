// Импортируем тип пользователя из Prisma
import type {IUser} from "../types/user.interface.ts";
import db from "../util/prisma.ts";
import {createHash} from 'node:crypto';

export class UserProvider {
  // Получить по ID
  static getByID = async (id: number) => {
    return await db.user.findUnique({where: {id}}) || false;
  }

  // Получить по username
  static getByUsername = async (user: string) => {
    return await db.user.findUnique({where: {username: user}}) || false;
  }

  // Получить по email
  static getByEmail = async (email: string) => {
    return await db.user.findUnique({where: {email}}) || false;
  }

  // Создать
  static create = async (username: string, email: string, password: string) => {
    let hashedPassword = createHash('sha512').update(password).digest('hex');
    return await db.user.create({
      data: {
        username,
        email,
        password: hashedPassword
      }
    }) || false;
  }

  // Обновить данные
  static update = async (id: number, data: Partial<IUser>) => {
    return await db.user.update({
      where: {id},
      data
    }) || false;
  }

  // Удалить
  static delete = async (id: number) => {
    return await db.user.delete({where: {id}}) || false;
  }
}