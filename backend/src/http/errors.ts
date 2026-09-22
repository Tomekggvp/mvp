import type { ErrorRequestHandler } from "express";

export class HttpError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string, public readonly details?: unknown) { super(message); }
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof HttpError) return response.status(error.status).json({ error: { code: error.code, message: error.message, details: error.details } });
  console.error(error);
  return response.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Внутренняя ошибка сервера" } });
};
