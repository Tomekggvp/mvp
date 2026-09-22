import { nextId } from "../domain/ids.js";
import type { Repository } from "../data/repository.js";
import { scoreLeadForManager } from "../analytics/expected-gm.js";
import { optimizeAssignments } from "../analytics/optimizer.js";
import { calculateManagerStatForLead } from "../analytics/statistics.js";

export class OptimizationService {
  constructor(private readonly repository: Repository) {}

  async run(globalLimit?: number, plannedFor?: string) {
    const [allLeads, managers, history] = await Promise.all([
      this.repository.listLeads(),
      this.repository.listManagers(),
      this.repository.listHistory(),
    ]);
    const leads = plannedFor ? allLeads.filter((lead) => lead.plannedFor === plannedFor) : allLeads;
    const leadIds = new Set(leads.map((lead) => lead.id));
    const existing = (await this.repository.getAssignments()).filter((item) => leadIds.has(item.leadId));
    const fixed = existing.filter((item) => (item.source === "manual" && item.managerId !== null) || leads.find((lead) => lead.id === item.leadId)?.status === "in_progress");
    const fixedIds = new Set(fixed.map((item) => item.leadId));
    const eligibleLeads = leads.filter((lead) => !fixedIds.has(lead.id));
    const remainingManagers = managers.map((manager) => ({ ...manager, dailyCapacity: Math.max(0, manager.dailyCapacity - fixed.filter((item) => item.managerId === manager.id).length) }));
    const remainingLimit = Math.max(0, (globalLimit ?? managers.filter((manager) => manager.active).reduce((sum, manager) => sum + manager.dailyCapacity, 0)) - fixed.filter((item) => item.managerId).length);
    const candidates = eligibleLeads.flatMap((lead) => remainingManagers.filter((manager) => manager.active).map((manager) => {
      const stat = calculateManagerStatForLead(history, manager, lead);
      return { lead, manager, score: scoreLeadForManager(lead, stat) };
    }));
    const result = optimizeAssignments(eligibleLeads, remainingManagers, candidates, { globalLimit: remainingLimit });
    for (const item of result.assigned) {
      await this.repository.saveAssignment({
        leadId: item.leadId,
        managerId: item.managerId,
        expectedProbability: item.score.probability,
        expectedGm: item.score.expectedGm,
        recommendedManagerId: item.managerId,
        source: "optimization",
        assignedAt: new Date().toISOString(),
        recommendationSnapshot: { probability: item.score.probability, expectedSaleAmount: item.score.expectedSaleAmount, expectedGrossMarginOnSale: item.score.expectedGrossMarginOnSale, expectedGm: item.score.expectedGm, explanation: item.score.explanation, calculatedAt: new Date().toISOString() },
      });
    }
    for (const leadId of result.unassigned) {
      const bestAlternative = candidates.filter((item) => item.lead.id === leadId).sort((a, b) => b.score.expectedGm - a.score.expectedGm)[0];
      await this.repository.saveAssignment({ leadId, managerId: null, expectedProbability: bestAlternative?.score.probability ?? 0, expectedGm: bestAlternative?.score.expectedGm ?? 0, recommendedManagerId: bestAlternative?.manager.id ?? null, source: "optimization", assignedAt: new Date().toISOString(), recommendationSnapshot: bestAlternative ? { probability: bestAlternative.score.probability, expectedSaleAmount: bestAlternative.score.expectedSaleAmount, expectedGrossMarginOnSale: bestAlternative.score.expectedGrossMarginOnSale, expectedGm: bestAlternative.score.expectedGm, explanation: bestAlternative.score.explanation, calculatedAt: new Date().toISOString() } : null });
    }
    const fixedAssigned = fixed.filter((item) => item.managerId);
    const expectedTotalGm = result.expectedTotalGm + fixedAssigned.reduce((sum, item) => sum + item.expectedGm, 0);
    const assignedCount = result.assigned.length + fixedAssigned.length;
    const run = await this.repository.saveOptimizationRun({ id: nextId("run"), createdAt: new Date().toISOString(), leadsCount: leads.length, assignedCount, expectedTotalGm });
    return { ...result, run, assignedCount, expectedTotalGm };
  }
}
