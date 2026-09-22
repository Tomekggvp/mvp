import { nextId } from "../domain/ids.js";
import type {
  Assignment,
  CreateLeadInput,
  CreateManagerInput,
  Lead,
  Manager,
  NegotiationHistory,
  OptimizationRun,
  UpdateManagerInput,
} from "../domain/types.js";
import { createDemoData } from "./demo-data.js";
import type { Repository } from "./repository.js";

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function createDemoRepository(): Repository {
  const seed = createDemoData();
  const managers = [...seed.managers];
  const leads = [...seed.leads];
  const history = [...seed.history];
  const assignments: Assignment[] = [];
  const runs: OptimizationRun[] = [];

  return {
    async listManagers() {
      return clone(managers);
    },
    async createManager(input) {
      if (input.dailyCapacity < 0 || !input.name.trim()) throw new Error("Invalid manager");
      const manager: Manager = {
        id: nextId("manager"),
        name: input.name.trim(),
        email: input.email.trim(),
        dailyCapacity: input.dailyCapacity,
        active: input.active ?? true,
        createdAt: new Date().toISOString(),
      };
      managers.push(manager);
      return clone(manager);
    },
    async updateManager(id, input) {
      const manager = managers.find((item) => item.id === id);
      if (!manager) throw new Error("Manager not found");
      Object.assign(manager, input);
      return clone(manager);
    },
    async listLeads() {
      return clone(leads);
    },
    async updateLeadStatus(id, status) {
      const lead = leads.find((item) => item.id === id);
      if (!lead) throw new Error("Lead not found");
      lead.status = status;
      return clone(lead);
    },
    async createLead(input) {
      const lead: Lead = {
        id: nextId("lead"),
        region: input.region,
        product: input.product,
        source: input.source,
        status: input.status ?? "new",
        potentialAmount: input.potentialAmount,
        createdAt: input.createdAt ?? new Date().toISOString(),
        plannedFor: input.plannedFor ?? new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      };
      leads.push(lead);
      return clone(lead);
    },
    async listHistory() {
      return clone(history);
    },
    async getAssignments() {
      return clone(assignments);
    },
    async saveAssignment(assignment) {
      if (!leads.some((lead) => lead.id === assignment.leadId)) throw new Error("Lead not found");
      if (assignment.managerId && !managers.some((manager) => manager.id === assignment.managerId)) {
        throw new Error("Manager not found");
      }
      const index = assignments.findIndex((item) => item.leadId === assignment.leadId);
      if (index >= 0) assignments[index] = clone(assignment);
      else assignments.push(clone(assignment));
      return clone(assignment);
    },
    async saveOptimizationRun(run) {
      runs.push(clone(run));
      return clone(run);
    },
    async listOptimizationRuns() {
      return clone(runs);
    },
  };
}
