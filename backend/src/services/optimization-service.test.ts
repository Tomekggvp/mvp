import { describe, expect, it } from "vitest";
import { createDemoRepository } from "../data/demo-repository.js";
import { OptimizationService } from "./optimization-service.js";

describe("OptimizationService", () => {
  it("persists a capacity-safe optimization run", async () => {
    const repository = createDemoRepository();
    const service = new OptimizationService(repository);
    const result = await service.run();
    const managers = await repository.listManagers();

    expect(result.assignedCount).toBe(50);
    expect(result.expectedTotalGm).toBeGreaterThan(0);
    expect((await repository.listOptimizationRuns()).length).toBe(1);
    for (const manager of managers) {
      const load = (await repository.getAssignments()).filter((item) => item.managerId === manager.id).length;
      expect(load).toBeLessThanOrEqual(manager.dailyCapacity);
    }
  });
  it("preserves a manual decision across recalculation", async () => {
    const repository = createDemoRepository();
    const service = new OptimizationService(repository);
    await service.run();
    const lead = (await repository.listLeads())[0];
    const manager = (await repository.listManagers())[0];
    await repository.saveAssignment({ leadId: lead.id, managerId: manager.id, expectedProbability: 0.5, expectedGm: 100, recommendedManagerId: null, source: "manual", assignedAt: new Date().toISOString() });
    await service.run();
    const saved = (await repository.getAssignments()).find((item) => item.leadId === lead.id);
    expect(saved?.source).toBe("manual");
    expect(saved?.managerId).toBe(manager.id);
  });
  it("reconsiders a removed recommendation on the next calculation", async () => {
    const repository = createDemoRepository();
    const service = new OptimizationService(repository);
    await service.run();
    const before = await repository.getAssignments();
    const removed = before.find((item) => item.managerId && item.source === "optimization")!;
    await repository.saveAssignment({ ...removed, managerId: null, source: "manual", assignedAt: new Date().toISOString() });
    const result = await service.run();
    const after = (await repository.getAssignments()).find((item) => item.leadId === removed.leadId);
    expect(result.assignedCount).toBe(50);
    expect(after?.source).toBe("optimization");
    expect(after?.managerId).toBe(removed.managerId);
  });
});
