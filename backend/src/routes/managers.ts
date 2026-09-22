import { Router } from "express";
import { requireEmployee } from "../auth/auth.middleware.js";
import { managerSchema, managerUpdateSchema } from "../http/validation.js";
import { ManagerService } from "../services/manager-service.js";

export function createManagersRouter(service: ManagerService) {
  const router = Router();
  router.use(requireEmployee);
  router.get("/", async (_request, response) => response.json({ managers: await service.list() }));
  router.post("/", async (request, response, next) => { try { response.status(201).json(await service.create(managerSchema.parse(request.body))); } catch (error) { next(error); } });
  router.patch("/:id", async (request, response, next) => { try { response.json(await service.update(request.params.id, managerUpdateSchema.parse(request.body))); } catch (error) { next(error); } });
  return router;
}
