import { describe, expect, it } from "vitest";
import { optimizeAssignments } from "./optimizer.js";
import { scoreLeadForManager } from "./expected-gm.js";
import type { Lead, Manager } from "../domain/types.js";

const managers: Manager[] = [
  { id: "m1", name: "One", email: "1@example.com", active: true, dailyCapacity: 1, createdAt: "" },
  { id: "m2", name: "Two", email: "2@example.com", active: true, dailyCapacity: 1, createdAt: "" },
];
const leads: Lead[] = [
  { id: "l1", region: "Гродно", product: "Столы", source: "demo", status: "new", potentialAmount: 1000, createdAt: "" },
  { id: "l2", region: "Брест", product: "Шкафы", source: "demo", status: "new", potentialAmount: 1000, createdAt: "" },
  { id: "l3", region: "Гомель", product: "Кресла", source: "demo", status: "new", potentialAmount: 1000, createdAt: "" },
];

describe("assignment optimizer", () => {
  it("calculates Expected GM as probability times GM on sale", () => {
    const score = scoreLeadForManager(leads[0], {
      managerId: "m1",
      conversion: 0.4,
      expectedGrossMarginOnSale: 300,
      avgCheck: 1000,
      currentLoad: 0,
      observations: 10,
      recentConversion: 0.4,
      historicalConversion: 0.4,
      specialty: "Гродно + Столы",
    });

    expect(score.expectedGm).toBe(120);
  });

  it("respects per-manager capacity and global limit", () => {
    const scores = leads.flatMap((lead) => managers.map((manager) => ({ lead, manager, score: scoreLeadForManager(lead, {
      managerId: manager.id, conversion: manager.id === "m1" ? 0.9 : 0.4, expectedGrossMarginOnSale: 200, avgCheck: 1000, currentLoad: 0, observations: 10, recentConversion: 0.5, historicalConversion: 0.4, specialty: "Команда",
    }) })));
    const result = optimizeAssignments(leads, managers, scores, { globalLimit: 2 });

    expect(result.assigned).toHaveLength(2);
    expect(result.unassigned).toHaveLength(1);
    expect(new Set(result.assigned.map((item) => item.managerId)).size).toBe(2);
  });

  it("returns all leads unassigned when there are no active managers", () => {
    const result = optimizeAssignments(leads, [], [], { globalLimit: 50 });

    expect(result.assigned).toEqual([]);
    expect(result.unassigned).toEqual(leads.map((lead) => lead.id));
  });
  it("chooses the best whole plan instead of the highest pair first", () => {
    const values = [[100, 99], [98, 1]];
    const candidates = leads.slice(0, 2).flatMap((lead, li) => managers.map((manager, mi) => ({ lead, manager, score: { leadId: lead.id, managerId: manager.id, probability: 1, expectedSaleAmount: 1000, expectedGrossMarginOnSale: values[li][mi], averageDiscount: 0, expectedGm: values[li][mi], currentLoad: 0, explanation: "test" } })));
    const result = optimizeAssignments(leads.slice(0, 2), managers, candidates, { globalLimit: 2 });
    expect(result.expectedTotalGm).toBe(197);
    expect(result.assigned.find((item) => item.leadId === "l1")?.managerId).toBe("m2");
  });
});
