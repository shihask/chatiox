-- Provider-agnostic messaging architecture, part 1/6 (see docs/modules/communication/{inbox,channels}.md).
-- channel_connections is the foundation every later table in this series FKs into: a workspace's
-- actual connected account for a channel_type (e.g. "Sales WhatsApp", phone_number_id 15551234567).
--
-- Secrets (access tokens, API keys) are NEVER stored in this table directly -- only a Vault secret
-- reference. Supabase Vault (pgsodium-backed) restricts the decrypted view (vault.decrypted_secrets)
-- to the service_role by default: this isn't just an RLS policy choice, it's architecturally
-- unreachable by anon/authenticated at all. Only non-secret config lives here.
create extension if not exists supabase_vault cascade;

create table public.channel_connections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  channel_type text not null references public.channel_types(code),
  display_name text not null,
  external_account_id text, -- e.g. WhatsApp phone_number_id -- non-secret, how inbound webhooks resolve tenant
  metadata jsonb not null default '{}'::jsonb, -- non-secret provider config (WABA id, default language, ...)
  secret_id uuid, -- references vault.secrets.id by convention (Vault has no cross-schema FK support)
  status text not null default 'disconnected' check (status in ('connected', 'disconnected', 'error')),
  last_error text,
  connected_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A phone number/account belongs to exactly one workspace, globally -- also the exact lookup key
-- inbound webhooks use to resolve which workspace an event belongs to.
create unique index uq_channel_connections_type_external_account
  on public.channel_connections (channel_type, external_account_id)
  where external_account_id is not null;

create trigger trg_channel_connections_set_updated_at
  before update on public.channel_connections
  for each row execute function public.set_updated_at();

alter table public.channel_connections enable row level security;

-- Credentials are sensitive by association even though the raw secret itself lives in Vault --
-- restrict to owner/admin same as workspace/lead-list management.
create policy channel_connections_select on public.channel_connections for select
  using (tenant_id in (select public.get_my_tenant_ids()) and public.get_my_role(tenant_id) in ('owner', 'admin'));

create policy channel_connections_insert on public.channel_connections for insert
  with check (
    tenant_id in (select public.get_my_tenant_ids())
    and public.get_my_role(tenant_id) in ('owner', 'admin')
    and connected_by = auth.uid()
  );

create policy channel_connections_update on public.channel_connections for update
  using (tenant_id in (select public.get_my_tenant_ids()) and public.get_my_role(tenant_id) in ('owner', 'admin'))
  with check (tenant_id in (select public.get_my_tenant_ids()) and public.get_my_role(tenant_id) in ('owner', 'admin'));

create policy channel_connections_delete on public.channel_connections for delete
  using (tenant_id in (select public.get_my_tenant_ids()) and public.get_my_role(tenant_id) in ('owner', 'admin'));
