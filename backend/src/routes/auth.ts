import { Router } from "express";
import { loginSchema } from "../http/validation.js";
import { auth } from "../auth/auth.middleware.js";
import { HttpError } from "../http/errors.js";

export const authRouter = Router();
authRouter.post("/login", (request, response, next) => {
  try {
    const input = loginSchema.parse(request.body);
    response.json(auth.login(input.email, input.password));
  } catch (error) {
    next(error instanceof Error && error.message === "Invalid credentials" ? new HttpError(401, "INVALID_CREDENTIALS", "Неверный email или пароль") : error);
  }
});
authRouter.get("/me", (request, response) => response.json({ user: request.user }));
