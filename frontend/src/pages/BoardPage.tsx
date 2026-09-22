import { useEffect, useState } from "react";
import { useBoard } from "../hooks/useBoard";
import { api } from "../lib/api";
import { KpiStrip } from "../components/KpiStrip";
import { BoardToolbar } from "../components/BoardToolbar";
import { KanbanBoard } from "../components/KanbanBoard";
import { LeadDetailsDrawer } from "../components/LeadDetailsDrawer";
import { ManagerDetailsDrawer } from "../components/ManagerDetailsDrawer";
import { ManagerDialog } from "../components/ManagerDialog";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import type { Lead, ManagerScore } from "../types";

export function BoardPage() {
  const boardState = useBoard();
  const [selected, setSelected] = useState<Lead | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);
  const [scores, setScores] = useState<ManagerScore[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [actionError, setActionError] = useState("");
  const [showManager, setShowManager] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setSelected(null); setSelectedManagerId(null); setScores([]); }, [boardState.plannedFor]);
  const message = (caught: unknown) => caught instanceof Error ? caught.message : "Не удалось выполнить действие";
  const openLead = async (lead: Lead) => {
    setSelectedManagerId(null);
    setSelected(lead); setScores([]); setDetailError(""); setActionError(""); setDetailLoading(true);
    try { setScores((await api.getLeadDetail(lead.id)).scores); } catch (caught) { setDetailError(message(caught)); } finally { setDetailLoading(false); }
  };
  const execute = async (action: () => Promise<unknown>, refreshDetail = false) => {
    setBusy(true); setActionError("");
    try { await action(); await boardState.reload(); if (refreshDetail && selected) setScores((await api.getLeadDetail(selected.id)).scores); }
    catch (caught) { setActionError(message(caught)); }
    finally { setBusy(false); }
  };
  const assign = async (leadId: string, managerId: string) => execute(async () => { await api.assignLead(leadId, managerId); if (selected?.id === leadId) setSelected({ ...selected, status: "assigned" }); }, selected?.id === leadId);
  const remove = async (leadId: string) => execute(async () => { await api.assignLead(leadId, null); if (selected?.id === leadId) setSelected({ ...selected, status: "new" }); }, selected?.id === leadId);
  if (boardState.loading && !boardState.board) return <main className="board-page"><LoadingState /></main>;
  if (boardState.error && !boardState.board) return <main className="board-page"><ErrorState message={boardState.error} onRetry={boardState.reload} /></main>;
  if (!boardState.board) return null;
  const assignment = selected ? boardState.board.assignments.find((item) => item.leadId === selected.id) : undefined;
  return <main className="board-page"><div className="board-heading"><div><p className="eyebrow">план переговоров · {boardState.plannedFor}</p><h1>Распределение заявок</h1></div><span className="live-status"><i /> демо-данные</span></div>
    <KpiStrip kpis={boardState.board.kpis} />
    <BoardToolbar {...boardState} onOptimize={() => { void execute(() => api.runOptimization(boardState.plannedFor)); }} onAddManager={() => setShowManager(true)} busy={busy} />
    {actionError && !selected && <p className="form-error">{actionError}</p>}
    <KanbanBoard board={boardState.board} leads={boardState.filteredLeads} onRemove={remove} onOpenLead={openLead} onOpenManager={(manager) => { setSelected(null); setSelectedManagerId(manager.id); }} />
    <ManagerDetailsDrawer manager={boardState.board.managers.find((manager) => manager.id === selectedManagerId) ?? null} board={boardState.board} onClose={() => setSelectedManagerId(null)} onOpenLead={(lead) => { void openLead(lead); }} />
    <LeadDetailsDrawer lead={selected} assignment={assignment} scores={scores} loading={detailLoading} error={detailError} actionError={actionError} busy={busy} onClose={() => { setSelected(null); setScores([]); }} onAssign={(managerId) => { if (selected) void assign(selected.id, managerId); }} onRemove={() => { if (selected) void remove(selected.id); }} onStartWork={() => { if (selected) void execute(async () => { await api.setLeadStatus(selected.id, "in_progress"); setSelected({ ...selected, status: "in_progress" }); }); }} />
    {showManager && <ManagerDialog onClose={() => setShowManager(false)} onSaved={boardState.reload} />}
  </main>;
}
