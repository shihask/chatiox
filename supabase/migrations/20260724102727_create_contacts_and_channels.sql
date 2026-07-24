-- channel_types: global, platform-curated lookup (unlike lead_statuses/lead_sources, which are
-- per-workspace) -- a lookup table, not a native enum, since enums need ALTER TYPE ADD VALUE per
-- new channel and have no SQL Server equivalent, so a table is both easier to extend and directly
-- portable at migration time (see docs/architecture.md §3).
create table public.channel_types (
  code text primary key,
  label text not null,
  is_active boolean not null default true,
  sort_order smallint not null default 0
);

insert into public.channel_types (code, label, sort_order) values
  ('whatsapp', 'WhatsApp', 10),
  ('email', 'Email', 20),
  ('sms', 'SMS', 30),
  ('telegram', 'Telegram', 40),
  ('instagram', 'Instagram', 50),
  ('messenger', 'Messenger', 60),
  ('rcs', 'RCS', 70);

alter table public.channel_types enable row level security;

create policy channel_types_select_authenticated on public.channel_types
  for select to authenticated using (true);
-- No write policies: only migrations change this platform-wide list.

create extension if not exists pg_trgm;  -- fuzzy/partial-match search across name + channel values

-- contacts: the central CRM entity (see docs/architecture.md). Channel-agnostic -- no phone/email
-- column here, see contact_channels below. Carries Lead Status/Source/Assignee directly since
-- Phase 1 deliberately does not model a separate Lead entity (see "Future CRM Extensions:
-- Opportunity" in docs/architecture.md §6).
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  first_name text not null,
  last_name text,
  tags text[] not null default '{}',
  lead_status_id uuid references public.lead_statuses(id),
  lead_source_id uuid references public.lead_sources(id),
  assigned_to_user_id uuid references auth.users(id),  -- service layer validates membership on write
  created_by uuid references auth.users(id),
  deleted_at timestamptz,  -- soft delete: null = active. Never hard-DELETE -- see soft_delete_contact() below.
  deleted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_contacts_tenant_id on public.contacts (tenant_id);
create index idx_contacts_tags_gin on public.contacts using gin (tags);
create index idx_contacts_name_trgm
  on public.contacts using gin ((first_name || ' ' || coalesce(last_name, '')) gin_trgm_ops);
create index idx_contacts_lead_status on public.contacts (tenant_id, lead_status_id);
create index idx_contacts_assigned_to on public.contacts (tenant_id, assigned_to_user_id);

create trigger trg_contacts_set_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();

-- contact_channels: one row per identity a contact has on a channel (WhatsApp number, email
-- address, Telegram handle, ...). This is what makes Contacts channel-agnostic.
create table public.contact_channels (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,  -- denormalized for cheap RLS
  contact_id uuid not null references public.contacts(id) on delete cascade,
  channel_type text not null references public.channel_types(code),
  value text not null,  -- normalized: E.164 phone / lowercased email / lowercased handle
  is_primary boolean not null default false,
  verified_at timestamptz,  -- null in Phase 1; column exists so opt-in/verification needs no future migration
  deleted_at timestamptz,   -- mirrors contacts.deleted_at; set when the parent contact is soft-deleted
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_contact_channels_value_not_blank check (btrim(value) <> '')
);

create index idx_contact_channels_contact_id on public.contact_channels (contact_id);
create index idx_contact_channels_tenant_type on public.contact_channels (tenant_id, channel_type);
create index idx_contact_channels_value_trgm
  on public.contact_channels using gin (value gin_trgm_ops);  -- search by phone/email/handle

-- One identity maps to exactly one contact per tenant per channel type, among ACTIVE contacts
-- only -- soft-deleting a contact frees its phone/email/handle for reuse by a new contact.
create unique index uq_contact_channels_tenant_type_value
  on public.contact_channels (tenant_id, channel_type, value) where deleted_at is null;

-- At most one "primary" per (contact, channel_type).
create unique index uq_contact_channels_one_primary_per_type
  on public.contact_channels (contact_id, channel_type) where is_primary;

create trigger trg_contact_channels_set_updated_at
  before update on public.contact_channels
  for each row execute function public.set_updated_at();

-- Defense-in-depth: contact_channels.tenant_id is denormalized (kept off the parent contact join
-- for cheap RLS), so enforce it can never drift from the parent contact's actual tenant.
create or replace function public.enforce_contact_channel_tenant_match()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.contacts c
    where c.id = new.contact_id and c.tenant_id = new.tenant_id
  ) then
    raise exception 'contact_channels.tenant_id must match parent contact.tenant_id';
  end if;
  return new;
end;
$$;

create trigger trg_contact_channels_tenant_match
  before insert or update on public.contact_channels
  for each row execute function public.enforce_contact_channel_tenant_match();

alter table public.contacts enable row level security;
alter table public.contact_channels enable row level security;

-- select/insert/update allowed for owner|admin|manager|agent in the caller's tenant.
create policy contacts_select on public.contacts for select
  using (tenant_id in (select public.get_my_tenant_ids()));
create policy contacts_insert on public.contacts for insert
  with check (
    tenant_id in (select public.get_my_tenant_ids())
    and public.get_my_role(tenant_id) in ('owner', 'admin', 'manager', 'agent')
  );
create policy contacts_update on public.contacts for update
  using (tenant_id in (select public.get_my_tenant_ids()))
  with check (
    tenant_id in (select public.get_my_tenant_ids())
    and public.get_my_role(tenant_id) in ('owner', 'admin', 'manager', 'agent')
  );
-- No delete policy: hard deletes are never issued by the app -- see soft_delete_contact() below,
-- which performs its own role check (owner|admin|manager only, agents excluded).

create policy contact_channels_select on public.contact_channels for select
  using (tenant_id in (select public.get_my_tenant_ids()));
create policy contact_channels_insert on public.contact_channels for insert
  with check (
    tenant_id in (select public.get_my_tenant_ids())
    and public.get_my_role(tenant_id) in ('owner', 'admin', 'manager', 'agent')
  );
create policy contact_channels_update on public.contact_channels for update
  using (tenant_id in (select public.get_my_tenant_ids()))
  with check (
    tenant_id in (select public.get_my_tenant_ids())
    and public.get_my_role(tenant_id) in ('owner', 'admin', 'manager', 'agent')
  );

-- Atomic create RPC: postgrest-js has no cross-table transactions, so contact+channels creation
-- needs an RPC -- same pattern as create_tenant_with_owner(). Role-checked internally (not just by
-- RLS) so the error is a clean 403 rather than an opaque RLS-violation failure.
create or replace function public.create_contact_with_channels(
  tenant_id uuid,
  p_first_name text,
  p_last_name text,
  p_tags text[],
  p_channels jsonb,
  p_lead_status_id uuid default null,
  p_lead_source_id uuid default null,
  p_assigned_to_user_id uuid default null
) returns public.contacts
language plpgsql security definer set search_path = public as $$
declare
  v_contact public.contacts;
  v_channel jsonb;
begin
  if public.get_my_role(tenant_id) not in ('owner', 'admin', 'manager', 'agent') then
    raise exception 'insufficient_permissions' using errcode = '42501';
  end if;
  if p_channels is null or jsonb_array_length(p_channels) = 0 then
    raise exception 'at_least_one_channel_required' using errcode = '22023';
  end if;

  insert into public.contacts (
    tenant_id, first_name, last_name, tags, lead_status_id, lead_source_id, assigned_to_user_id, created_by
  )
  values (
    tenant_id, p_first_name, p_last_name, coalesce(p_tags, '{}'),
    p_lead_status_id, p_lead_source_id, p_assigned_to_user_id, auth.uid()
  )
  returning * into v_contact;

  for v_channel in select * from jsonb_array_elements(p_channels) loop
    insert into public.contact_channels (tenant_id, contact_id, channel_type, value, is_primary, created_by)
    values (
      tenant_id, v_contact.id, v_channel->>'channel_type', v_channel->>'value',
      coalesce((v_channel->>'is_primary')::boolean, false), auth.uid()
    );
  end loop;

  return v_contact;
end;
$$;

revoke all on function public.create_contact_with_channels from public, anon;
grant execute on function public.create_contact_with_channels to authenticated, service_role;

-- Soft delete, not hard delete: Contacts is a CRM system of record; recovery matters.
-- DELETE /contacts/:id calls this RPC instead of issuing SQL DELETE.
create or replace function public.soft_delete_contact(tenant_id uuid, p_contact_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.get_my_role(tenant_id) not in ('owner', 'admin', 'manager') then
    raise exception 'insufficient_permissions' using errcode = '42501';
  end if;

  update public.contacts set deleted_at = now(), deleted_by = auth.uid()
    where id = p_contact_id and contacts.tenant_id = soft_delete_contact.tenant_id and deleted_at is null;

  update public.contact_channels set deleted_at = now()
    where contact_id = p_contact_id and contact_channels.tenant_id = soft_delete_contact.tenant_id;
end;
$$;

revoke all on function public.soft_delete_contact from public, anon;
grant execute on function public.soft_delete_contact to authenticated, service_role;
