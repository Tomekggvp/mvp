import type { BoardSnapshot, Lead, Manager } from "../types";
import { LeadCard } from "./LeadCard";
import { formatByn } from "../utils/formatters";

function ManagerSlot({ manager, onOpen }: { manager: Manager; onOpen: () => void }) {
  return <button type="button" className="manager-slot" onClick={onOpen} aria-label={`Посмотреть заявки менеджера ${manager.name}`}><strong>{manager.name}</strong><span>{manager.load ?? 0}/{manager.dailyCapacity} · свободно {Math.max(0, manager.dailyCapacity - (manager.load ?? 0))}</span><span className="manager-slot-link">Заявки →</span></button>;
}

export function KanbanBoard({ board, leads, onRemove, onOpenLead, onOpenManager }: { board: BoardSnapshot; leads: Lead[]; onRemove: (leadId: string) => Promise<void>; onOpenLead: (lead: Lead) => void; onOpenManager: (manager: Manager) => void }) {
  const assignments = new Map(board.assignments.map((item) => [item.leadId, item]));
  const stageOf = (lead: Lead) => {
    const assignment = assignments.get(lead.id);
    if (!assignment?.managerId) return "Новая";
    if (lead.status === "in_progress") return "В работе";
    return assignment.source === "manual" ? "Назначена" : "Рекомендована";
  };
  const stages = [
    { title: "Новые", note: "без назначения / вне плана", match: (lead: Lead) => !assignments.get(lead.id)?.managerId },
    { title: "Рекомендованы", note: "план алгоритма", match: (lead: Lead) => lead.status !== "in_progress" && assignments.get(lead.id)?.source === "optimization" && Boolean(assignments.get(lead.id)?.managerId) },
    { title: "Назначены", note: "решение сотрудника", match: (lead: Lead) => lead.status !== "in_progress" && assignments.get(lead.id)?.source === "manual" && Boolean(assignments.get(lead.id)?.managerId) },
    { title: "В работе", note: "переговоры начаты", match: (lead: Lead) => lead.status === "in_progress" && Boolean(assignments.get(lead.id)?.managerId) },
  ];
  return <>
    <div className="manager-slots" aria-label="Загрузка менеджеров">{board.managers.filter((manager) => manager.active).map((manager) => <ManagerSlot key={manager.id} manager={manager} onOpen={() => onOpenManager(manager)} />)}</div>
    <div className="kanban-scroll"><section className="kanban-column all-leads-column" aria-label="Все заявки на выбранный день"><header className="column-header"><div><strong>Все заявки</strong><span>исходный поток · любой этап</span></div><b>{leads.length}</b></header><div className="column-body">{leads.map((lead) => { const assignment = assignments.get(lead.id); return <button type="button" key={lead.id} className="all-lead-item" onClick={() => onOpenLead(lead)}><span className="all-lead-top"><strong>#{lead.id.replace("lead-", "")}</strong><span>{formatByn(lead.potentialAmount)}</span></span><span>{lead.region} · {lead.product}</span><span className="all-lead-bottom"><span>{stageOf(lead)}</span><span>{assignment?.currentManagerName ?? assignment?.recommendedManagerName ?? "Без менеджера"}</span></span></button>; })}</div></section>{stages.map((stage) => { const items = leads.filter(stage.match); return <section key={stage.title} className="kanban-column"><header className="column-header"><div><strong>{stage.title}</strong><span>{stage.note}</span></div><b>{items.length}</b></header><div className="column-body">{items.map((lead) => <LeadCard key={lead.id} lead={lead} assignment={assignments.get(lead.id)} onOpen={() => onOpenLead(lead)} onRemove={assignments.get(lead.id)?.managerId ? () => onRemove(lead.id) : undefined} />)}</div></section>; })}</div>
  </>;
}
