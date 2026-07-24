-- Multi-tenancy root table. "tenant" naming stays in the database forever -- the UI/API layer
-- above the repository renames this to "workspace" (see docs/architecture.md §2).
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tenants enable row level security;

-- Shared trigger function reused by every table with an updated_at column (tenants, lead_statuses,
-- lead_sources, contacts, contact_channels, ...) -- Postgres does not auto-update this on UPDATE
-- without a trigger.
create or replace function public.set_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_tenants_set_updated_at
  before update on public.tenants
  for each row execute function public.set_updated_at();
