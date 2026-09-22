import { z } from "zod";
import { PRODUCTS, REGIONS } from "../domain/types.js";

export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
export const managerSchema = z.object({ name: z.string().trim().min(2), email: z.string().email(), dailyCapacity: z.number().int().min(0).max(1000), active: z.boolean().optional() });
export const managerUpdateSchema = managerSchema.partial();
export const leadSchema = z.object({ region: z.enum(REGIONS), product: z.enum(PRODUCTS), source: z.string().min(1), status: z.enum(["new", "assigned", "in_progress", "unassigned", "completed"]).optional(), potentialAmount: z.number().nonnegative(), createdAt: z.string().optional(), plannedFor: z.iso.date().optional() });
export const assignmentSchema = z.object({ managerId: z.string().nullable() });
