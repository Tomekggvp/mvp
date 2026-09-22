import { describe, expect, it } from "vitest";
import { createDemoRepository } from "./demo-repository.js";

describe("DemoRepository", () => {
  it("loads a varied seed without fixed production limits", async () => {
    const repository = createDemoRepository();

    expect((await repository.listManagers()).length).toBe(5);
    expect((await repository.listLeads()).length).toBe(70);
    expect((await repository.listHistory()).length).toBeGreaterThan(100);
  });

  it("accepts a new manager, a new lead, and a persisted assignment", async () => {
    const repository = createDemoRepository();
    const manager = await repository.createManager({
      name: "Новый менеджер",
      email: "new@example.com",
      dailyCapacity: 8,
    });
    const lead = await repository.createLead({
      region: "Гродно",
      product: "Столы",
      source: "manual",
      status: "new",
      potentialAmount: 1800,
    });

    await repository.saveAssignment({
      leadId: lead.id,
      managerId: manager.id,
      expectedProbability: 0.4,
      expectedGm: 120,
      recommendedManagerId: manager.id,
      source: "manual",
      assignedAt: new Date().toISOString(),
    });

    expect((await repository.listManagers()).some((item) => item.id === manager.id)).toBe(true);
    expect((await repository.listLeads()).some((item) => item.id === lead.id)).toBe(true);
    expect((await repository.getAssignments()).find((item) => item.leadId === lead.id)?.managerId).toBe(manager.id);
  });
});
