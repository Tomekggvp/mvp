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

export interface Repository {
  listManagers(): Promise<Manager[]>;
  createManager(input: CreateManagerInput): Promise<Manager>;
  updateManager(id: string, input: UpdateManagerInput): Promise<Manager>;
  listLeads(): Promise<Lead[]>;
  updateLeadStatus(id: string, status: Lead["status"]): Promise<Lead>;
  createLead(input: CreateLeadInput): Promise<Lead>;
  listHistory(): Promise<NegotiationHistory[]>;
  getAssignments(): Promise<Assignment[]>;
  saveAssignment(assignment: Assignment): Promise<Assignment>;
  saveOptimizationRun(run: OptimizationRun): Promise<OptimizationRun>;
  listOptimizationRuns(): Promise<OptimizationRun[]>;
}
