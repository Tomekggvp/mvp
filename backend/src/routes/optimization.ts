import { Router } from "express";
import { requireEmployee } from "../auth/auth.middleware.js";
import { OptimizationService } from "../services/optimization-service.js";

export function createOptimizationRouter(service: OptimizationService) {
  const router = Router();
  router.use(requireEmployee);
  router.post("/", async (request, response, next) => { try { response.status(201).json(await service.run(typeof request.body.globalLimit === "number" ? request.body.globalLimit : undefined, typeof request.body.plannedFor === "string" ? request.body.plannedFor : undefined)); } catch (error) { next(error); } });
  return router;
}
