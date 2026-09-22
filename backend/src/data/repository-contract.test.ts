import { describe, expect, it } from "vitest";
import { createRepository } from "./repository-factory.js";

describe("repository contract", () => {
  it("keeps demo mode configurable and writable", async () => {
    const repository = createRepository({ dataSource: "demo" });
    const manager = await repository.createManager({ name: "Contract", email: "contract@example.com", dailyCapacity: 4 });
    expect((await repository.listManagers()).some((item) => item.id === manager.id)).toBe(true);
  });
});
