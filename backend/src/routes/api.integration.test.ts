import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../app.js";

describe("authenticated API", () => {
  it("returns 401 for invalid credentials", async () => {
    const response = await request(app).post("/api/auth/login").send({ email: "employee@demo.local", password: "wrong" });
    expect(response.status).toBe(401);
  });

  it("supports login, dynamic entities, optimization, and manual reassignment", async () => {
    const login = await request(app).post("/api/auth/login").send({ email: "employee@demo.local", password: "demo-kanban" });
    expect(login.status).toBe(200);
    const token = login.body.token as string;
    const auth = { Authorization: `Bearer ${token}` };

    const managers = await request(app).get("/api/managers").set(auth);
    expect(managers.status).toBe(200);
    const newManager = await request(app).post("/api/managers").set(auth).send({ name: "API менеджер", email: "api@example.com", dailyCapacity: 3 });
    expect(newManager.status).toBe(201);
    const newLead = await request(app).post("/api/leads").set(auth).send({ region: "Гродно", product: "Столы", source: "manual", potentialAmount: 1700 });
    expect(newLead.status).toBe(201);
    const run = await request(app).post("/api/optimization-runs").set(auth).send({});
    expect(run.status).toBe(201);
    expect(run.body.assignedCount).toBeGreaterThan(0);
    const lead = await request(app).get(`/api/leads/${newLead.body.id}`).set(auth);
    expect(lead.status).toBe(200);
    expect(lead.body.scores.length).toBeGreaterThan(0);
    expect(lead.body.assignment.recommendationSnapshot).toBeTruthy();
    const dayBoard = await request(app).get(`/api/dashboard/summary?plannedFor=${newLead.body.plannedFor}`).set(auth);
    expect(dayBoard.body.leads.some((item: { id: string }) => item.id === newLead.body.id)).toBe(true);
    const reassignment = await request(app).patch(`/api/leads/${newLead.body.id}/assignment`).set(auth).send({ managerId: newManager.body.id });
    expect(reassignment.status).toBe(200);
    expect(typeof reassignment.body.expectedGmDelta).toBe("number");
  });

  it("rejects protected access without a token", async () => {
    expect((await request(app).get("/api/managers")).status).toBe(401);
  });
});
