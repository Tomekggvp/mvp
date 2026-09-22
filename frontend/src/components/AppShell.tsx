import type { ReactNode } from "react";
import type { User } from "../types";
export function AppShell({ user, onLogout, children }: { user: User; onLogout: () => void; children: ReactNode }) { return <div className="app-shell"><header className="topbar"><div className="brand-mark"><span className="brand-dot" />margin / board</div><div className="topbar-meta"><span>{user.email}</span><button className="button button-ghost" onClick={onLogout}>Выйти</button></div></header>{children}</div>; }
