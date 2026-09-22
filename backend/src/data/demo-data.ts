import { nextId } from "../domain/ids.js";
import { PRODUCTS, REGIONS, type Lead, type Manager, type NegotiationHistory } from "../domain/types.js";

const managerNames = ["Анна Петрова", "Илья Смирнов", "Мария Ковалёва", "Олег Морозов", "Елена Новикова"];
const now = Date.now();

export function createDemoData(): {
  managers: Manager[];
  leads: Lead[];
  history: NegotiationHistory[];
} {
  const managers = managerNames.map((name, index) => ({
    id: `manager-${index + 1}`,
    name,
    email: `manager${index + 1}@demo.local`,
    active: true,
    dailyCapacity: 10,
    createdAt: new Date(now - index * 86400000).toISOString(),
  }));

  const leads = Array.from({ length: 70 }, (_, index) => ({
    id: `lead-${String(index + 1).padStart(4, "0")}`,
    region: REGIONS[index % REGIONS.length],
    product: PRODUCTS[(index * 2) % PRODUCTS.length],
    source: index % 3 === 0 ? "website" : index % 3 === 1 ? "crm" : "partner",
    status: "new" as const,
    potentialAmount: 900 + ((index * 137) % 2600),
    createdAt: new Date(now - (index % 21) * 86400000).toISOString(),
    plannedFor: new Date(now + 86400000).toISOString().slice(0, 10),
  }));

  const history = Array.from({ length: 1350 }, (_, index) => {
    const managerIndex = index % managers.length;
    const manager = managers[managerIndex];
    const regionIndex = Math.floor(index / 5) % REGIONS.length;
    const productIndex = Math.floor(index / 25) % PRODUCTS.length;
    const observation = Math.floor(index / 75);
    const region = REGIONS[regionIndex];
    const product = PRODUCTS[productIndex];
    const specialty = (managerIndex + regionIndex + productIndex) % 5 === 0;
    const recent = observation < 5;
    const chance = specialty ? 0.7 : 0.22 + (managerIndex + productIndex) * 0.045;
    const sold = ((observation * 37 + managerIndex * 23 + regionIndex * 17 + productIndex * 11) % 100) < Math.round((recent && managerIndex === 3 ? chance * 0.6 : chance) * 100);
    const saleAmount = sold ? 1100 + ((index * 211) % 2800) : 0;
    return {
      id: nextId("history"),
      date: new Date(now - (recent ? 1 + observation * 2 : 18 + (observation - 5) * 11) * 86400000).toISOString(),
      managerId: manager.id,
      region,
      product,
      held: true,
      sold,
      saleAmount,
      grossMargin: sold ? Math.round(saleAmount * (0.16 + (specialty ? 0.07 : 0) - (recent && managerIndex === 3 ? 0.04 : 0))) : 0,
      discount: 0.04 + (recent && managerIndex === 3 ? 0.08 : 0) + (observation % 3) * 0.01,
    };
  });

  return { managers, leads, history };
}
