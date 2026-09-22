import type { Score } from "./expected-gm.js";
import type { ManagerStat } from "./statistics.js";

export function buildExplanation(score: Score, stat: ManagerStat): string {
  return `${stat.specialty}. Вероятность продажи ${Math.round(score.probability * 100)}%, Expected GM ${Math.round(score.expectedGm)} BYN.`;
}
