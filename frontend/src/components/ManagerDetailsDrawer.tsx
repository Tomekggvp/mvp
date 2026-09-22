import type { BoardSnapshot, Lead, Manager } from "../types";
import { formatByn } from "../utils/formatters";

export function ManagerDetailsDrawer({ manager, board, onClose, onOpenLead }: { manager: Manager | null; board: BoardSnapshot; onClose: () => void; onOpenLead: (lead: Lead) => void }) {
  if (!manager) return null;
  const assignments = board.assignments.filter((assignment) => assignment.managerId === manager.id);
  const leadById = new Map(board.leads.map((lead) => [lead.id, lead]));
  const items = assignments.flatMap((assignment) => { const lead = leadById.get(assignment.leadId); return lead ? [{ assignment, lead }] : []; });
  return <aside className="drawer manager-details" role="dialog" aria-label={`Заявки менеджера ${manager.name}`}>
    <div className="drawer-header"><div><span className="eyebrow">Менеджер</span><h2>{manager.name}</h2></div><button type="button" className="button button-ghost" onClick={onClose}>Закрыть</button></div>
    <p className="manager-load-summary">Назначено {items.length} из {manager.dailyCapacity} · свободно {Math.max(0, manager.dailyCapacity - items.length)}</p>
    <p className="drawer-note">Все заявки менеджера на выбранный день. Нажмите на заявку, чтобы увидеть расчёт и изменить назначение.</p>
    <div className="manager-leads">{items.length ? items.map(({ lead, assignment }) => <button type="button" key={lead.id} className="manager-lead" onClick={() => onOpenLead(lead)}><span className="comparison-title"><strong>#{lead.id.replace("lead-", "")} · {lead.region} · {lead.product}</strong><b>{formatByn(assignment.expectedGm)}</b></span><span>{lead.status === "in_progress" ? "В работе" : assignment.source === "manual" ? "Назначена сотрудником" : "Рекомендация системы"} · {lead.source}</span></button>) : <p className="drawer-note">На этот день заявок пока нет.</p>}</div>
  </aside>;
}
