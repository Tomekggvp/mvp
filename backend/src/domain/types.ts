export const REGIONS = ["Витебск", "Могилёв", "Гомель", "Гродно", "Брест"] as const;
export const PRODUCTS = ["Кресла", "Столы", "Шкафы"] as const;

export type Region = (typeof REGIONS)[number];
export type Product = (typeof PRODUCTS)[number];
export type LeadStatus = "new" | "assigned" | "in_progress" | "unassigned" | "completed";
export type AssignmentSource = "optimization" | "manual";

export interface Manager {
  id: string;
  name: string;
  email: string;
  active: boolean;
  dailyCapacity: number;
  createdAt: string;
}

export interface Lead {
  id: string;
  region: Region;
  product: Product;
  source: string;
  status: LeadStatus;
  potentialAmount: number;
  createdAt: string;
  plannedFor?: string;
}

export interface NegotiationHistory {
  id: string;
  date: string;
  managerId: string;
  region: Region;
  product: Product;
  held: boolean;
  sold: boolean;
  saleAmount: number;
  grossMargin: number;
  discount: number;
}

export interface Assignment {
  leadId: string;
  managerId: string | null;
  expectedProbability: number;
  expectedGm: number;
  recommendedManagerId: string | null;
  source: AssignmentSource;
  assignedAt: string;
  recommendationSnapshot?: {
    probability: number;
    expectedSaleAmount: number;
    expectedGrossMarginOnSale: number;
    expectedGm: number;
    explanation: string;
    calculatedAt: string;
  } | null;
}

export interface OptimizationRun {
  id: string;
  createdAt: string;
  leadsCount: number;
  assignedCount: number;
  expectedTotalGm: number;
}

export interface CreateManagerInput {
  name: string;
  email: string;
  dailyCapacity: number;
  active?: boolean;
}

export interface UpdateManagerInput {
  name?: string;
  email?: string;
  dailyCapacity?: number;
  active?: boolean;
}

export interface CreateLeadInput {
  region: Region;
  product: Product;
  source: string;
  status?: LeadStatus;
  potentialAmount: number;
  createdAt?: string;
  plannedFor?: string;
}
