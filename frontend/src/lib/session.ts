import type { User } from "../types";
const TOKEN_KEY = "kanban-demo-token";
const USER_KEY = "kanban-demo-user";
export const session = { getToken: () => sessionStorage.getItem(TOKEN_KEY), getUser: (): User | null => { const raw = sessionStorage.getItem(USER_KEY); return raw ? JSON.parse(raw) as User : null; }, set: (token: string, user: User) => { sessionStorage.setItem(TOKEN_KEY, token); sessionStorage.setItem(USER_KEY, JSON.stringify(user)); }, clear: () => { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(USER_KEY); } };
