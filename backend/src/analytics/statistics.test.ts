import { describe, expect, it } from "vitest";
import { calculateManagerStats, calculateManagerStatForLead } from "./statistics.js";
import type { Manager, NegotiationHistory } from "../domain/types.js";

const manager: Manager = {
  id: "m1",
  name: "Анна",
  email: "a@example.com",
  active: true,
  dailyCapacity: 2,
  createdAt: new Date().toISOString(),
};

const history: NegotiationHistory[] = [
  { id: "h1", date: new Date().toISOString(), managerId: "m1", region: "Гродно", product: "Столы", held: true, sold: true, saleAmount: 1000, grossMargin: 200, discount: 0.1 },
  { id: "h2", date: new Date(Date.now() - 90 * 86400000).toISOString(), managerId: "m1", region: "Гродно", product: "Столы", held: true, sold: false, saleAmount: 0, grossMargin: 0, discount: 0.05 },
];

describe("manager statistics", () => {
  it("uses recent and historical periods with a 60/40 default weight", () => {
    const [stat] = calculateManagerStats(history, [manager], { recentWeight: 0.6, recentDays: 14 });

    expect(stat.recentConversion).toBe(1);
    expect(stat.historicalConversion).toBe(0);
    expect(stat.conversion).toBeCloseTo(0.6);
    expect(Number.isFinite(stat.expectedGrossMarginOnSale)).toBe(true);
  });

  it("falls back to finite team values for sparse combinations", () => {
    const [stat] = calculateManagerStats([], [manager], { recentWeight: 0.6, recentDays: 14 });

    expect(stat.conversion).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(stat.expectedGrossMarginOnSale)).toBe(true);
  });
  it("does not turn two sales into a certain forecast", () => {
    const twoSales = [history[0], { ...history[0], id: "h3" }];
    const peerManager = { ...manager, id: "m2" };
    const peerHistory = Array.from({ length: 10 }, (_, index) => ({ ...history[1], id: `peer-${index}`, managerId: peerManager.id, date: new Date().toISOString() }));
    const lead = { id: "lead", region: "Гродно" as const, product: "Столы" as const, source: "demo", status: "new" as const, potentialAmount: 1000, createdAt: new Date().toISOString() };
    const result = calculateManagerStatForLead([...twoSales, ...peerHistory], manager, lead);
    expect(result.observations).toBe(2);
    expect(result.conversion).toBeLessThan(1);
    expect(result.smoothingWeight).toBeCloseTo(0.2);
  });
});
