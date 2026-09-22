import type { BoardSnapshot } from "../types";
import { formatByn } from "../utils/formatters";
export function KpiStrip({ kpis }: { kpis: BoardSnapshot["kpis"] }) { return <div className="kpi-strip"><div><span>входящие</span><strong>{kpis.incoming}</strong></div><div><span>назначено</span><strong>{kpis.assigned}</strong></div><div><span>без назначения</span><strong>{kpis.unassigned}</strong></div><div className="kpi-accent"><span>Expected GM</span><strong>{formatByn(kpis.expectedTotalGm)}</strong></div></div>; }
