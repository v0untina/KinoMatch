//Response.dto.ts
import {t} from "elysia";

// Body обычного ответа сервера
export const DefaultResponseDto = t.Object(
  {
    success: t.Boolean(),
    data: t.Optional(t.Any()),
    message: t.Optional(t.Object({
      code: t.Optional(t.String()),
      message: t.String(),
      text: t.String()
    })),
    pagination: t.Optional(t.Object({
      length: t.Numeric(),
      offset: t.Numeric()
    }))
  }
)

// Query с offset и length
export const OffsetLengthQueryDto = t.Object(
  {
    offset: t.Optional(t.String()),
    length: t.Optional(t.String())
  }
)