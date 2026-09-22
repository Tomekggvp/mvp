import type { Lead, Manager } from "../domain/types.js";
import type { Score } from "./expected-gm.js";

export interface Candidate { lead: Lead; manager: Manager; score: Score }
export interface OptimizationResult {
  assigned: Array<{ leadId: string; managerId: string; score: Score }>;
  unassigned: string[];
  expectedTotalGm: number;
}
type Edge = { to: number; reverse: number; capacity: number; cost: number; candidate?: Candidate };

// Successive shortest augmenting paths solve the capacitated assignment exactly.
export function optimizeAssignments(leads: Lead[], managers: Manager[], scores: Candidate[], options: { globalLimit?: number }): OptimizationResult {
  const active = managers.filter((manager) => manager.active && manager.dailyCapacity > 0);
  const limit = Math.max(0, Math.min(leads.length, options.globalLimit ?? active.reduce((sum, manager) => sum + manager.dailyCapacity, 0)));
  const source = 0, leadStart = 1, managerStart = leadStart + leads.length, sink = managerStart + active.length;
  const graph: Edge[][] = Array.from({ length: sink + 1 }, () => []);
  const add = (from: number, to: number, capacity: number, cost: number, candidate?: Candidate) => {
    const forward: Edge = { to, reverse: graph[to].length, capacity, cost, candidate };
    const backward: Edge = { to: from, reverse: graph[from].length, capacity: 0, cost: -cost };
    graph[from].push(forward); graph[to].push(backward);
  };
  const leadIndex = new Map(leads.map((lead, index) => [lead.id, index]));
  const managerIndex = new Map(active.map((manager, index) => [manager.id, index]));
  leads.forEach((_, index) => add(source, leadStart + index, 1, 0));
  active.forEach((manager, index) => add(managerStart + index, sink, manager.dailyCapacity, 0));
  for (const candidate of scores) {
    const li = leadIndex.get(candidate.lead.id), mi = managerIndex.get(candidate.manager.id);
    if (li !== undefined && mi !== undefined && candidate.score.expectedGm > 0) add(leadStart + li, managerStart + mi, 1, -candidate.score.expectedGm, candidate);
  }
  for (let flow = 0; flow < limit; flow++) {
    const distance = Array(sink + 1).fill(Infinity) as number[];
    const previous = Array(sink + 1).fill(null) as Array<{ node: number; edge: number } | null>;
    const queue = [source], queued = Array(sink + 1).fill(false) as boolean[];
    distance[source] = 0; queued[source] = true;
    for (let head = 0; head < queue.length; head++) {
      const node = queue[head]; queued[node] = false;
      graph[node].forEach((edge, index) => {
        const next = distance[node] + edge.cost;
        if (edge.capacity > 0 && next < distance[edge.to] - 1e-9) {
          distance[edge.to] = next; previous[edge.to] = { node, edge: index };
          if (!queued[edge.to]) { queue.push(edge.to); queued[edge.to] = true; }
        }
      });
    }
    if (!previous[sink] || distance[sink] >= -1e-9) break;
    for (let node = sink; node !== source;) {
      const step = previous[node]!;
      const edge = graph[step.node][step.edge]; edge.capacity--;
      graph[node][edge.reverse].capacity++; node = step.node;
    }
  }
  const assigned = graph.slice(leadStart, managerStart).flatMap((edges) => edges.filter((edge) => edge.candidate && edge.capacity === 0).map((edge) => ({ leadId: edge.candidate!.lead.id, managerId: edge.candidate!.manager.id, score: edge.candidate!.score })));
  const assignedIds = new Set(assigned.map((item) => item.leadId));
  return { assigned, unassigned: leads.filter((lead) => !assignedIds.has(lead.id)).map((lead) => lead.id), expectedTotalGm: assigned.reduce((sum, item) => sum + item.score.expectedGm, 0) };
}
