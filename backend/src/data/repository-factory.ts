import { createDemoRepository } from "./demo-repository.js";
import { createSupabaseRepository } from "./supabase-repository.js";
import type { Repository } from "./repository.js";

export function createRepository(config: { dataSource?: string; supabaseUrl?: string; supabaseKey?: string } = {}): Repository {
  if ((config.dataSource ?? process.env.DATA_SOURCE ?? "demo") === "supabase") {
    return createSupabaseRepository(config.supabaseUrl ?? process.env.SUPABASE_URL ?? "", config.supabaseKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "");
  }
  return createDemoRepository();
}
