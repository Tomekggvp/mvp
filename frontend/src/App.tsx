import { useState } from "react";
import { AppShell } from "./components/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { BoardPage } from "./pages/BoardPage";
import { session } from "./lib/session";
export function App() { const [user, setUser] = useState(session.getUser()); if (!user) return <LoginPage onLogin={(token, nextUser) => { session.set(token, nextUser); setUser(nextUser); }} />; return <AppShell user={user} onLogout={() => { session.clear(); setUser(null); }}><BoardPage /></AppShell>; }
