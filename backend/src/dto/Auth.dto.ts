//Auth.dto.ts
import {t} from "elysia";

// Body для /api/auth/login
export const LoginBodyDto = t.Object(
    {
        username: t.String({
            minLength: 3,
            maxLength: 50 // Исправлено: maxLength 50, как в модели users
        }),
        password: t.String({
            minLength: 6,
            maxLength: 255 // Исправлено: maxLength 255, как в модели users
        })
    }
)

// Ответ от /api/auth/login
export const LoginResponseDto = t.Object(
    {
        success: t.Boolean(),
        data: t.Optional(t.Object({
            token: t.String(),
            user: t.Object({ // Добавлено описание типа для user
                user_id: t.Number(),
                username: t.String(),
                email: t.String()
            })
        }))
    }
)

// Ответ от /api/auth/profile
export const ProfileResponseDto = t.Object(
    {
        success: t.Boolean(),
        data: t.Optional(t.Any()) // TODO: Заменить t.Any на конкретный тип профиля
    }
)

// Body для /api/auth/register
export const RegisterBodyDto = t.Object(
    {
        username: t.String({
            minLength: 3,
            maxLength: 50 // Исправлено: maxLength 50, как в модели users
        }),
        password: t.String({
            minLength: 6,
            maxLength: 255 // Исправлено: maxLength 255, как в модели users
        }),
        email: t.String({format: "email", maxLength: 255}) // Исправлено: maxLength 255, как в модели users
    }
)

// Params для /api/auth/profile - УДАЛЕНО, т.к. не используется и не относится к Auth
// export const ProfileParamsBodyDto = t.Object(
//   {
//     competitionId: t.String() // УДАЛЕНО
//   }
// )

// Body для /api/auth/changePassword
export const ChangePasswordBodyDto = t.Object(
    {
        oldPassword: t.String({
            minLength: 6,
            maxLength: 255 // Исправлено: maxLength 255, как в модели users
        }),
        newPassword: t.String({
            minLength: 6,
            maxLength: 255 // Исправлено: maxLength 255, как в модели users
        })
    }
)