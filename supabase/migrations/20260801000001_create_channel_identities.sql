-- Provider-agnostic messaging architecture, part 2/6.
-- channel_identities is what actually lets an inbound sender exist before any Contact does: a
-- channel address (phone number, email, IG handle) tracked from first contact, contact_id
-- nullable, linked to a real Contact later. This does NOT replace contact_channels (Phase 1,
-- already depended on throughout the Contacts feature) -- it's a thinner, additive layer purpose-
-- built for "we've heard from this address but don't yet know who it is" (see docs/modules/
-- communication/inbox.md's Unassigned-inbox flow).
create table public.channel_identities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  channel_type text not null references public.channel_types(code),
  value text not null, -- normalized, same rules as contact_channels.value
  contact_id uuid references public.contacts(id),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint chk_channel_identities_value_not_blank check (btrim(value) <> '')
);

create unique index uq_channel_identities_tenant_type_value
  on public.channel_identities (tenant_id, channel_type, value);

create index idx_channel_identities_contact_id on public.channel_identities (tenant_id, contact_id);

alter table public.channel_identities enable row level security;

create policy channel_identities_select on public.channel_identities for select
  using (tenant_id in (select public.get_my_tenant_ids()));

create policy channel_identities_insert on public.channel_identities for insert
  with check (
    tenant_id in (select public.get_my_tenant_ids())
    and public.get_my_role(tenant_id) in ('owner', 'admin', 'manager', 'agent')
  );

-- Linking to a contact (or un-linking) is an update -- any workspace member can triage the
-- Unassigned queue, same write roles as insert.
create policy channel_identities_update on public.channel_identities for update
  using (tenant_id in (select public.get_my_tenant_ids()))
  with check (
    tenant_id in (select public.get_my_tenant_ids())
    and public.get_my_role(tenant_id) in ('owner', 'admin', 'manager', 'agent')
  );
