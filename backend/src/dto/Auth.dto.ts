import {t} from "elysia";

// Body для /api/auth/login
export const LoginBodyDto = t.Object(
  {
    username: t.String({
      minLength: 3,
      maxLength: 32
    }),
    password: t.String({
      minLength: 6,
      maxLength: 64
    })
  }
)

// Ответ от /api/auth/login
export const LoginResponseDto = t.Object(
  {
    success: t.Boolean(),
    data: t.Optional(t.Object({
      token: t.String()
    }))
  }
)

// Ответ от /api/auth/profile
export const ProfileResponseDto = t.Object(
  {
    success: t.Boolean(),
    data: t.Optional(t.Any())
  }
)

// Body для /api/auth/register
export const RegisterBodyDto = t.Object(
  {
    username: t.String({
      minLength: 3,
      maxLength: 32
    }),
    password: t.String({
      minLength: 6,
      maxLength: 64
    }),
    email: t.String({format: "email"})
  }
)

// Params для /api/auth/profile
export const ProfileParamsBodyDto = t.Object(
  {
    competitionId: t.String()
  }
)

// Body для /api/auth/changePassword
export const ChangePasswordBodyDto = t.Object(
  {
    oldPassword: t.String({
      minLength: 3,
      maxLength: 32
    }),
    newPassword: t.String({
      minLength: 6,
      maxLength: 64
    })
  }
)