create extension if not exists pgcrypto;

create table if not exists managers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  active boolean not null default true,
  daily_capacity integer not null default 10 check (daily_capacity >= 0),
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  region text not null,
  product text not null,
  source text not null,
  status text not null default 'new',
  potential_amount numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table leads add column if not exists planned_for date not null default (current_date + 1);

create table if not exists negotiation_history (
  id uuid primary key default gen_random_uuid(),
  date timestamptz not null,
  manager_id uuid not null references managers(id),
  region text not null,
  product text not null,
  held boolean not null,
  sold boolean not null,
  sale_amount numeric not null default 0,
  gross_margin numeric not null default 0,
  discount numeric not null default 0
);

create table if not exists lead_assignments (
  lead_id uuid primary key references leads(id) on delete cascade,
  manager_id uuid references managers(id) on delete set null,
  expected_probability numeric not null default 0,
  expected_gm numeric not null default 0,
  recommended_manager_id uuid references managers(id) on delete set null,
  source text not null,
  assigned_at timestamptz not null default now()
);

alter table lead_assignments add column if not exists recommendation_snapshot jsonb;

create table if not exists manager_statistics (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references managers(id),
  region text not null,
  product text not null,
  meetings integer not null default 0,
  sales integer not null default 0,
  conversion numeric not null default 0,
  avg_check numeric not null default 0,
  avg_gm numeric not null default 0,
  avg_discount numeric not null default 0
);

create table if not exists optimization_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  leads_count integer not null,
  assigned_count integer not null,
  expected_total_gm numeric not null
);

create index if not exists leads_status_idx on leads(status);
create index if not exists history_manager_region_product_idx on negotiation_history(manager_id, region, product);
