import { Router } from "express";
import { requireEmployee } from "../auth/auth.middleware.js";
import { assignmentSchema, leadSchema } from "../http/validation.js";
import { scoreLeadForManager } from "../analytics/expected-gm.js";
import { calculateManagerStatForLead } from "../analytics/statistics.js";
import type { Repository } from "../data/repository.js";
import { LeadService } from "../services/lead-service.js";

export function createLeadsRouter(repository: Repository, service: LeadService) {
  const router = Router();
  router.use(requireEmployee);
  router.get("/", async (_request, response) => response.json({ leads: await service.list(), assignments: await repository.getAssignments() }));
  router.post("/", async (request, response, next) => { try { response.status(201).json(await service.create(leadSchema.parse(request.body))); } catch (error) { next(error); } });
  router.patch("/:id/status", async (request, response, next) => { try { const status = request.body?.status; if (status !== "in_progress" && status !== "assigned") return response.status(400).json({ error: { code: "INVALID_STATUS", message: "Недопустимый статус" } }); const assignment = (await repository.getAssignments()).find((item) => item.leadId === request.params.id); if (!assignment?.managerId) return response.status(409).json({ error: { code: "NOT_ASSIGNED", message: "Сначала назначьте менеджера" } }); return response.json(await repository.updateLeadStatus(request.params.id as string, status)); } catch (error) { return next(error); } });
  router.get("/:id", async (request, response, next) => {
    try {
      const leads = await repository.listLeads();
      const lead = leads.find((item) => item.id === request.params.id);
      if (!lead) return response.status(404).json({ error: { code: "NOT_FOUND", message: "Заявка не найдена" } });
      const managers = await repository.listManagers();
      const history = await repository.listHistory();
      const dayLeadIds = new Set(leads.filter((item) => item.plannedFor === lead.plannedFor).map((item) => item.id));
      const allAssignments = (await repository.getAssignments()).filter((item) => dayLeadIds.has(item.leadId));
      const assignment = allAssignments.find((item) => item.leadId === lead.id) ?? null;
      const scores = managers.filter((manager) => manager.active).map((manager) => {
        const stat = calculateManagerStatForLead(history, manager, lead);
        const score = scoreLeadForManager(lead, stat);
        const currentLoad = allAssignments.filter((item) => item.managerId === manager.id).length;
        return { ...score, managerName: manager.name, dailyCapacity: manager.dailyCapacity, currentLoad, recentConversion: stat.recentConversion, historicalConversion: stat.historicalConversion, observations: stat.observations, observations60: stat.observations60 ?? 0, observations180: stat.observations180 ?? 0, recentObservations: stat.recentObservations ?? 0, sales: stat.sales ?? 0, smoothingWeight: stat.smoothingWeight ?? 0, priorConversion: stat.priorConversion ?? 0, averageCheck: stat.avgCheck, averageDiscount: stat.avgDiscount ?? 0, formula: `${Math.round(score.probability * 100)}% × ${Math.round(score.expectedGrossMarginOnSale)} BYN = ${Math.round(score.expectedGm)} BYN` };
      });
      const recommendedManager = assignment?.recommendedManagerId ? managers.find((item) => item.id === assignment.recommendedManagerId) : null;
      const currentLoad = recommendedManager ? allAssignments.filter((item) => item.managerId === recommendedManager.id).length : 0;
      return response.json({ lead, assignment: assignment ? { ...assignment, recommendedManagerName: recommendedManager?.name ?? null, recommendedManagerCapacity: recommendedManager?.dailyCapacity, currentLoad } : null, scores });
    } catch (error) { return next(error); }
  });
  router.patch("/:id/assignment", async (request, response, next) => {
    try {
      const { managerId } = assignmentSchema.parse(request.body);
      const leads = await repository.listLeads();
      if (!leads.some((lead) => lead.id === request.params.id)) return response.status(404).json({ error: { code: "NOT_FOUND", message: "Заявка не найдена" } });
      const managers = await repository.listManagers();
      const target = managerId ? managers.find((manager) => manager.id === managerId && manager.active) : null;
      if (managerId && !target) return response.status(404).json({ error: { code: "NOT_FOUND", message: "Менеджер не найден" } });
      const lead = leads.find((item) => item.id === request.params.id)!;
      const dayLeadIds = new Set(leads.filter((item) => item.plannedFor === lead.plannedFor).map((item) => item.id));
      const allAssignments = (await repository.getAssignments()).filter((item) => dayLeadIds.has(item.leadId));
      const previous = allAssignments.find((item) => item.leadId === request.params.id);
      if (target && allAssignments.filter((item) => item.managerId === target.id && item.leadId !== request.params.id).length >= target.dailyCapacity) return response.status(409).json({ error: { code: "CAPACITY_REACHED", message: "У менеджера нет свободных мест" } });
      const history = await repository.listHistory();
      const targetScore = target ? scoreLeadForManager(lead, calculateManagerStatForLead(history, target, lead)) : null;
      const previousManager = previous?.managerId ? managers.find((manager) => manager.id === previous.managerId) : null;
      const previousScore = previousManager ? scoreLeadForManager(lead, calculateManagerStatForLead(history, previousManager, lead)) : null;
      const assignment = await repository.saveAssignment({ leadId: lead.id, managerId, expectedProbability: targetScore?.probability ?? 0, expectedGm: targetScore?.expectedGm ?? 0, recommendedManagerId: previous?.recommendedManagerId ?? null, source: "manual", assignedAt: new Date().toISOString(), recommendationSnapshot: previous?.recommendationSnapshot ?? null });
      await repository.updateLeadStatus(lead.id, managerId ? "assigned" : "new");
      return response.json({ ...assignment, expectedGmDelta: (targetScore?.expectedGm ?? 0) - (previousScore?.expectedGm ?? previous?.expectedGm ?? 0) });
    } catch (error) { return next(error); }
  });
  return router;
}
