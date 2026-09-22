export interface AuthUser {
  id: string;
  email: string;
  role: "employee";
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}
