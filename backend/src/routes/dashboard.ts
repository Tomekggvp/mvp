import { Router } from "express";
import { requireEmployee } from "../auth/auth.middleware.js";
import type { Repository } from "../data/repository.js";

export function createDashboardRouter(repository: Repository) {
  const router = Router();
  router.use(requireEmployee);
  router.get("/summary", async (request, response) => {
    const [managers, allLeads, allAssignments, runs] = await Promise.all([repository.listManagers(), repository.listLeads(), repository.getAssignments(), repository.listOptimizationRuns()]);
    const day = typeof request.query.plannedFor === "string" ? request.query.plannedFor : null;
    const leads = day ? allLeads.filter((lead) => lead.plannedFor === day) : allLeads;
    const leadIds = new Set(leads.map((lead) => lead.id));
    const assignments = allAssignments.filter((item) => leadIds.has(item.leadId));
    const assigned = assignments.filter((item) => item.managerId);
    response.json({ managers: managers.map((manager) => ({ ...manager, load: assigned.filter((item) => item.managerId === manager.id).length })), leads, assignments: assignments.map((assignment) => { const recommended = assignment.recommendedManagerId ? managers.find((manager) => manager.id === assignment.recommendedManagerId) : null; const current = assignment.managerId ? managers.find((manager) => manager.id === assignment.managerId) : null; return { ...assignment, recommendedManagerName: recommended?.name ?? null, recommendedManagerCapacity: recommended?.dailyCapacity, currentManagerName: current?.name ?? null, currentLoad: recommended ? assigned.filter((item) => item.managerId === recommended.id).length : 0 }; }), kpis: { incoming: leads.length, assigned: assigned.length, unassigned: leads.length - assigned.length, expectedTotalGm: assigned.reduce((sum, item) => sum + item.expectedGm, 0) }, lastRun: runs.at(-1) ?? null });
  });
  return router;
}
