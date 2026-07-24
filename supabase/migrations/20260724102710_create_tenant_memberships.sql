create type public.tenant_role as enum ('owner', 'admin', 'manager', 'agent');

create table public.tenant_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.tenant_role not null default 'agent',
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

alter table public.tenant_memberships enable row level security;

-- security definer avoids RLS self-recursion when policies (including this table's own, below)
-- query tenant_memberships -- see docs/architecture.md §2.
create or replace function public.get_my_tenant_ids()
returns setof uuid
language sql security definer stable set search_path = public as $$
  select tenant_id from public.tenant_memberships where user_id = auth.uid();
$$;

create or replace function public.get_my_role(tenant_id uuid)
returns public.tenant_role
language sql security definer stable set search_path = public as $$
  select role from public.tenant_memberships
  where tenant_memberships.tenant_id = get_my_role.tenant_id and user_id = auth.uid();
$$;

-- Now that get_my_tenant_ids() exists, add the read policy deferred from create_tenants.sql.
create policy tenants_select on public.tenants for select
  using (id in (select public.get_my_tenant_ids()));

create policy tenant_memberships_select on public.tenant_memberships for select
  using (tenant_id in (select public.get_my_tenant_ids()));

-- No insert/update/delete policies on either table: tenant creation and membership assignment
-- only ever happen via the security-definer create_tenant_with_owner() RPC (next migration).
