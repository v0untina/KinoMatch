// backend/src/types/context.d.ts
import { Elysia } from 'elysia';

declare module 'elysia' {
    interface Context {
        jwt: any; // ВАЖНО: Замените 'any' на более конкретный тип, если это возможно!
    }
}