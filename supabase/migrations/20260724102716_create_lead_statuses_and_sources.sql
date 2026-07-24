-- Per-workspace-configurable Lead Status & Lead Source -- NOT enums, NOT a separate "Lead"
-- business entity. A lead is just a Contact with these set (see docs/architecture.md §6).
-- Lookup tables (not enums) because each workspace curates its own list, and enums have no
-- SQL Server equivalent anyway.
create table public.lead_statuses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  sort_order smallint not null default 0,
  is_won boolean not null default false,   -- marks the terminal "converted" stage (e.g. "Admission Confirmed")
  is_lost boolean not null default false,  -- marks the terminal "lost" stage
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table public.lead_sources (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name)
);

alter table public.lead_statuses enable row level security;
alter table public.lead_sources enable row level security;

create trigger trg_lead_statuses_set_updated_at
  before update on public.lead_statuses
  for each row execute function public.set_updated_at();

create trigger trg_lead_sources_set_updated_at
  before update on public.lead_sources
  for each row execute function public.set_updated_at();

create policy lead_statuses_select on public.lead_statuses for select
  using (tenant_id in (select public.get_my_tenant_ids()));

create policy lead_sources_select on public.lead_sources for select
  using (tenant_id in (select public.get_my_tenant_ids()));

-- No write policies yet -- only the provisioning RPC (security definer, next migration) writes in
-- Phase 1. Full CRUD management of these lists is a future Administration/Workspace-settings
-- concern (see docs/modules/administration/workspace.md), documented, not built.
