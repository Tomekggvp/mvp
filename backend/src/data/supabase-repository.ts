import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { nextId } from "../domain/ids.js";
import type { Assignment, CreateLeadInput, CreateManagerInput, Lead, Manager, NegotiationHistory, OptimizationRun, UpdateManagerInput } from "../domain/types.js";
import type { Repository } from "./repository.js";

const unwrap = <T>(result: { data: T | null; error: { message: string } | null }) => { if (result.error) throw new Error(result.error.message); return result.data ?? []; };
const managerFromRow = (row: any): Manager => ({ id: row.id, name: row.name, email: row.email, active: row.active, dailyCapacity: row.daily_capacity, createdAt: row.created_at });
const leadFromRow = (row: any): Lead => ({ id: row.id, region: row.region, product: row.product, source: row.source, status: row.status, potentialAmount: Number(row.potential_amount), createdAt: row.created_at, plannedFor: row.planned_for });
const historyFromRow = (row: any): NegotiationHistory => ({ id: row.id, date: row.date, managerId: row.manager_id, region: row.region, product: row.product, held: row.held, sold: row.sold, saleAmount: Number(row.sale_amount), grossMargin: Number(row.gross_margin), discount: Number(row.discount) });
const assignmentFromRow = (row: any): Assignment => ({ leadId: row.lead_id, managerId: row.manager_id, expectedProbability: Number(row.expected_probability), expectedGm: Number(row.expected_gm), recommendedManagerId: row.recommended_manager_id, source: row.source, assignedAt: row.assigned_at, recommendationSnapshot: row.recommendation_snapshot });
const runFromRow = (row: any): OptimizationRun => ({ id: row.id, createdAt: row.created_at, leadsCount: row.leads_count, assignedCount: row.assigned_count, expectedTotalGm: Number(row.expected_total_gm) });
const managerToRow = (input: CreateManagerInput | UpdateManagerInput) => ({ ...(input.name === undefined ? {} : { name: input.name }), ...(input.email === undefined ? {} : { email: input.email }), ...(input.active === undefined ? {} : { active: input.active }), ...(input.dailyCapacity === undefined ? {} : { daily_capacity: input.dailyCapacity }) });
const leadToRow = (input: CreateLeadInput) => ({ region: input.region, product: input.product, source: input.source, status: input.status ?? "new", potential_amount: input.potentialAmount, ...(input.createdAt ? { created_at: input.createdAt } : {}), ...(input.plannedFor ? { planned_for: input.plannedFor } : {}) });
const assignmentToRow = (input: Assignment) => ({ lead_id: input.leadId, manager_id: input.managerId, expected_probability: input.expectedProbability, expected_gm: input.expectedGm, recommended_manager_id: input.recommendedManagerId, source: input.source, assigned_at: input.assignedAt, recommendation_snapshot: input.recommendationSnapshot ?? null });
const runToRow = (input: OptimizationRun) => ({ id: input.id, created_at: input.createdAt, leads_count: input.leadsCount, assigned_count: input.assignedCount, expected_total_gm: input.expectedTotalGm });

export class SupabaseRepository implements Repository {
  constructor(private readonly client: SupabaseClient) {}
  async listManagers() { return (unwrap(await this.client.from("managers").select("*")) as any[]).map(managerFromRow); }
  async createManager(input: CreateManagerInput) { return managerFromRow(unwrap(await this.client.from("managers").insert(managerToRow(input)).select("*").single()) as any); }
  async updateManager(id: string, input: UpdateManagerInput) { return managerFromRow(unwrap(await this.client.from("managers").update(managerToRow(input)).eq("id", id).select("*").single()) as any); }
  async listLeads() { return (unwrap(await this.client.from("leads").select("*")) as any[]).map(leadFromRow); }
  async updateLeadStatus(id: string, status: Lead["status"]) { return leadFromRow(unwrap(await this.client.from("leads").update({ status }).eq("id", id).select("*").single()) as any); }
  async createLead(input: CreateLeadInput) { return leadFromRow(unwrap(await this.client.from("leads").insert(leadToRow(input)).select("*").single()) as any); }
  async listHistory() { return (unwrap(await this.client.from("negotiation_history").select("*")) as any[]).map(historyFromRow); }
  async getAssignments() { return (unwrap(await this.client.from("lead_assignments").select("*")) as any[]).map(assignmentFromRow); }
  async saveAssignment(assignment: Assignment) { return assignmentFromRow(unwrap(await this.client.from("lead_assignments").upsert(assignmentToRow(assignment), { onConflict: "lead_id" }).select("*").single()) as any); }
  async saveOptimizationRun(run: OptimizationRun) { return runFromRow(unwrap(await this.client.from("optimization_runs").insert(runToRow(run)).select("*").single()) as any); }
  async listOptimizationRuns() { return (unwrap(await this.client.from("optimization_runs").select("*")) as any[]).map(runFromRow); }
}

export function createSupabaseRepository(url: string, key: string): Repository {
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for Supabase mode");
  return new SupabaseRepository(createClient(url, key));
}
