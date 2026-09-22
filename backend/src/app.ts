import cors from "cors";
import express from "express";
import { healthRouter } from "./routes/health.js";
import { createRepository } from "./data/repository-factory.js";
import { ManagerService } from "./services/manager-service.js";
import { LeadService } from "./services/lead-service.js";
import { OptimizationService } from "./services/optimization-service.js";
import { authRouter } from "./routes/auth.js";
import { createManagersRouter } from "./routes/managers.js";
import { createLeadsRouter } from "./routes/leads.js";
import { createOptimizationRouter } from "./routes/optimization.js";
import { createDashboardRouter } from "./routes/dashboard.js";
import { requireEmployee } from "./auth/auth.middleware.js";
import { errorHandler } from "./http/errors.js";

export const app = express();

app.use(cors());
app.use(express.json());
// serverless-http exposes the request body as a Buffer. Normalize it so the
// same Express routes work locally and inside a Netlify Function.
app.use((request, _response, next) => {
  if (Buffer.isBuffer(request.body)) {
    try {
      request.body = JSON.parse(request.body.toString("utf8"));
    } catch {
      request.body = {};
    }
  }
  next();
});
app.use("/health", healthRouter);

const repository = createRepository();
const managerService = new ManagerService(repository);
const leadService = new LeadService(repository);
const optimizationService = new OptimizationService(repository);
app.use("/api/auth", authRouter);
app.use("/api/managers", createManagersRouter(managerService));
app.use("/api/leads", createLeadsRouter(repository, leadService));
app.use("/api/optimization-runs", createOptimizationRouter(optimizationService));
app.use("/api/dashboard", createDashboardRouter(repository));
app.get("/api/me", requireEmployee, (request, response) => response.json({ user: request.user }));
app.use(errorHandler);
