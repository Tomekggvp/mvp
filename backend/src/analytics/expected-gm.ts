import type { Lead } from "../domain/types.js";
import type { ManagerStat } from "./statistics.js";

export interface Score {
  leadId: string;
  managerId: string;
  probability: number;
  expectedSaleAmount: number;
  expectedGrossMarginOnSale: number;
  averageDiscount: number;
  expectedGm: number;
  currentLoad: number;
  explanation: string;
}

export function scoreLeadForManager(lead: Lead, stat: ManagerStat): Score {
  const expectedSaleAmount = lead.potentialAmount || stat.avgCheck;
  const expectedGrossMarginOnSale = stat.avgCheck > 0 ? expectedSaleAmount * stat.expectedGrossMarginOnSale / stat.avgCheck : stat.expectedGrossMarginOnSale;
  const expectedGm = stat.conversion * expectedGrossMarginOnSale;
  return {
    leadId: lead.id,
    managerId: stat.managerId,
    probability: stat.conversion,
    expectedSaleAmount,
    expectedGrossMarginOnSale,
    averageDiscount: stat.avgDiscount ?? 0,
    expectedGm,
    currentLoad: stat.currentLoad,
    explanation: `${stat.specialty}; форма 14 дней: ${Math.round(stat.recentConversion * 100)}%`,
  };
}
