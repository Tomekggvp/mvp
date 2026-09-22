import type { Lead, Manager, NegotiationHistory } from "../domain/types.js";

export interface ManagerStat {
  managerId: string;
  conversion: number;
  expectedGrossMarginOnSale: number;
  avgCheck: number;
  avgDiscount?: number;
  currentLoad: number;
  observations: number;
  recentConversion: number;
  historicalConversion: number;
  specialty: string;
  sales?: number;
  recentObservations?: number;
  priorObservations?: number;
  observations60?: number;
  observations180?: number;
  priorConversion?: number;
  smoothingWeight?: number;
}

export interface StatisticsConfig {
  recentWeight: number;
  recentDays: number;
}

const defaultConfig: StatisticsConfig = { recentWeight: 0.6, recentDays: 14 };

function ratio(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

export function calculateManagerStats(
  history: NegotiationHistory[],
  managers: Manager[],
  config: Partial<StatisticsConfig> = {},
): ManagerStat[] {
  const settings = { ...defaultConfig, ...config };
  const cutoff = Date.now() - settings.recentDays * 86400000;
  const teamHeld = history.filter((item) => item.held).length;
  const teamSales = history.filter((item) => item.held && item.sold).length;
  const teamSaleMargin = history.filter((item) => item.sold).map((item) => item.grossMargin);
  const fallbackConversion = ratio(teamSales, teamHeld) || 0.25;
  const fallbackMargin = teamSaleMargin.length ? teamSaleMargin.reduce((sum, value) => sum + value, 0) / teamSaleMargin.length : 220;

  return managers.map((manager) => {
    const personal = history.filter((item) => item.managerId === manager.id && item.held);
    const recent = personal.filter((item) => new Date(item.date).getTime() >= cutoff);
    const old = personal.filter((item) => new Date(item.date).getTime() < cutoff);
    const sales = personal.filter((item) => item.sold);
    const recentConversion = recent.length ? ratio(recent.filter((item) => item.sold).length, recent.length) : fallbackConversion;
    const historicalConversion = old.length ? ratio(old.filter((item) => item.sold).length, old.length) : fallbackConversion;
    const conversion = personal.length
      ? recentConversion * settings.recentWeight + historicalConversion * (1 - settings.recentWeight)
      : fallbackConversion;
    const margin = sales.length ? sales.reduce((sum, item) => sum + item.grossMargin, 0) / sales.length : fallbackMargin;
    const check = sales.length ? sales.reduce((sum, item) => sum + item.saleAmount, 0) / sales.length : 0;
    const discount = personal.length ? personal.reduce((sum, item) => sum + item.discount, 0) / personal.length : 0;
    return {
      managerId: manager.id,
      conversion: Math.min(1, Math.max(0, conversion)),
      expectedGrossMarginOnSale: Math.max(0, margin),
      avgCheck: Math.max(0, check),
      avgDiscount: Math.max(0, discount),
      currentLoad: 0,
      observations: personal.length,
      recentConversion,
      historicalConversion,
      specialty: personal.length ? "Связка менеджера и истории" : "Командная статистика",
    };
  });
}

export function calculateManagerStatForLead(
  history: NegotiationHistory[],
  manager: Manager,
  lead: Lead,
  config: Partial<StatisticsConfig> = {},
): ManagerStat {
  const base = calculateManagerStats(history, [manager], config)[0];
  const settings = { ...defaultConfig, ...config };
  const now = Date.now();
  const within = (item: NegotiationHistory, days: number) => now - new Date(item.date).getTime() <= days * 86400000;
  const scoped = history.filter((item) => item.managerId === manager.id && item.held && item.region === lead.region && item.product === lead.product && within(item, 180));
  const peers = history.filter((item) => item.managerId !== manager.id && item.held && item.region === lead.region && item.product === lead.product && within(item, 180));
  const region = history.filter((item) => item.held && item.region === lead.region && within(item, 180));
  const product = history.filter((item) => item.held && item.product === lead.product && within(item, 180));
  const team = history.filter((item) => item.held && within(item, 180));
  const prior = peers.length >= 5 ? peers : product.length >= 5 ? product : region.length >= 5 ? region : team;
  const priorSource = peers.length >= 5 ? "другие менеджеры в этой связке" : product.length >= 5 ? `команда по продукту «${lead.product}»` : region.length >= 5 ? `команда в регионе «${lead.region}»` : "вся команда";
  const mean = (items: NegotiationHistory[], key: "grossMargin" | "saleAmount" | "discount") => items.length ? items.reduce((sum, item) => sum + item[key], 0) / items.length : 0;
  const priorSales = prior.filter((item) => item.sold);
  const priorConversion = prior.length ? ratio(priorSales.length, prior.length) : base.conversion;
  const priorMargin = priorSales.length ? mean(priorSales, "grossMargin") : base.expectedGrossMarginOnSale;
  const priorCheck = priorSales.length ? mean(priorSales, "saleAmount") : base.avgCheck;
  const recent = scoped.filter((item) => within(item, settings.recentDays));
  const older = scoped.filter((item) => !within(item, settings.recentDays));
  const recentSales = recent.filter((item) => item.sold);
  const olderSales = older.filter((item) => item.sold);
  const recentConversion = recent.length ? ratio(recentSales.length, recent.length) : priorConversion;
  const historicalConversion = older.length ? ratio(olderSales.length, older.length) : priorConversion;
  const weightedConversion = recentConversion * settings.recentWeight + historicalConversion * (1 - settings.recentWeight);
  const weighted = (key: "grossMargin" | "saleAmount", fallback: number) => {
    const recentMean = recentSales.length ? mean(recentSales, key) : fallback;
    const olderMean = olderSales.length ? mean(olderSales, key) : fallback;
    return recentMean * settings.recentWeight + olderMean * (1 - settings.recentWeight);
  };
  const weight = scoped.length / (scoped.length + 8);
  return {
    ...base,
    conversion: Math.min(1, Math.max(0, weight * weightedConversion + (1 - weight) * priorConversion)),
    expectedGrossMarginOnSale: Math.max(0, weight * weighted("grossMargin", priorMargin) + (1 - weight) * priorMargin),
    avgCheck: Math.max(0, weight * weighted("saleAmount", priorCheck) + (1 - weight) * priorCheck),
    avgDiscount: Math.max(0, weight * mean(scoped, "discount") + (1 - weight) * mean(prior, "discount")),
    observations: scoped.length,
    sales: scoped.filter((item) => item.sold).length,
    recentObservations: recent.length,
    priorObservations: prior.length,
    observations60: scoped.filter((item) => within(item, 60)).length,
    observations180: scoped.length,
    priorConversion,
    smoothingWeight: weight,
    recentConversion,
    historicalConversion,
    specialty: `Связка «${lead.region} + ${lead.product}»: ${scoped.length} переговоров; вес личной истории ${Math.round(weight * 100)}%, опорной статистики (${priorSource}) ${Math.round((1 - weight) * 100)}%`,
  };
}
