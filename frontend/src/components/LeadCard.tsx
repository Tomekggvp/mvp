import type { Assignment, Lead } from "../types";
import { formatByn, formatPercent } from "../utils/formatters";

export function LeadCard({ lead, assignment, onOpen, onRemove }: { lead: Lead; assignment?: Assignment; onOpen: () => void; onRemove?: () => void }) {
  const hasManager = Boolean(assignment?.managerId);
  return <article className="lead-card">
    <div className="card-top"><span className="lead-id">#{lead.id.replace("lead-", "")}</span><div className="card-actions">{hasManager && onRemove && <button type="button" className="remove-assignment" aria-label="Снять назначение" title="Снять назначение" onClick={onRemove}>×</button>}<strong>{formatByn(assignment?.expectedGm ?? 0)}</strong></div></div>
    <button type="button" className="card-open" onClick={onOpen}><span className="lead-title">{lead.region} · {lead.product}</span><span className="card-meta">{formatPercent(assignment?.expectedProbability ?? 0)} вероятность · {lead.source}</span>{assignment?.recommendedManagerName && <span className="recommendation-line"><strong>{assignment.managerId && assignment.source === "manual" ? `Назначено: ${assignment.currentManagerName ?? assignment.recommendedManagerName}` : `Рекомендация: ${assignment.recommendedManagerName}`}</strong><span>История «{lead.region} + {lead.product}» · загрузка {assignment.currentLoad ?? 0}/{assignment.recommendedManagerCapacity ?? "—"}</span><span>Открыть расчёт и сравнение →</span></span>}</button>
  </article>;
}
