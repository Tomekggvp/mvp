import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";
import type { BoardSnapshot } from "../types";

const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const firstRuns = new Map<string, Promise<unknown>>();

export function useBoard() {
  const [board, setBoard] = useState<BoardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [plannedFor, setPlannedFor] = useState(tomorrow);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [product, setProduct] = useState("all");
  const requestNumber = useRef(0);
  const load = useCallback(async () => {
    const request = ++requestNumber.current;
    setLoading(true); setError("");
    try {
      let next = await api.getBoard(plannedFor);
      if (next.leads.length && !next.assignments.length) {
        if (!firstRuns.has(plannedFor)) firstRuns.set(plannedFor, api.runOptimization(plannedFor));
        try { await firstRuns.get(plannedFor); } finally { firstRuns.delete(plannedFor); }
        next = await api.getBoard(plannedFor);
      }
      if (request === requestNumber.current) setBoard(next);
    } catch (caught) { if (request === requestNumber.current) setError(caught instanceof Error ? caught.message : "Не удалось загрузить доску"); }
    finally { if (request === requestNumber.current) setLoading(false); }
  }, [plannedFor]);
  useEffect(() => { void load(); }, [load]);
  const filteredLeads = useMemo(() => (board?.leads ?? []).filter((lead) =>
    (region === "all" || lead.region === region) && (product === "all" || lead.product === product) &&
    `${lead.id} ${lead.region} ${lead.product}`.toLowerCase().includes(query.toLowerCase())), [board, product, query, region]);
  return { board, filteredLeads, loading, error, plannedFor, setPlannedFor: (day: string) => { if (day) { setBoard(null); setPlannedFor(day); } }, query, setQuery, region, setRegion, product, setProduct, reload: load };
}
