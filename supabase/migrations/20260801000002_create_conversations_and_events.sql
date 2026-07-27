-- Provider-agnostic messaging architecture, part 3/6.
-- conversations FKs to channel_identities (not contacts directly) -- contact_id stays nullable and
-- denormalized from channel_identities.contact_id at link time, so an "Unassigned" inbox
-- (Intercom/Zendesk-style) is a first-class state, not a workaround (docs/modules/communication/
-- inbox.md). The partial unique index means at most one *live* conversation per identity at a
-- time -- closing one frees the identity for a genuinely new conversation row later, rather than
-- forcing a single thread forever.
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  channel_identity_id uuid not null references public.channel_identities(id),
  contact_id uuid references public.contacts(id),
  channel_connection_id uuid not null references public.channel_connections(id),
  channel_type text not null references public.channel_types(code),
  provider_thread_id text, -- reserved for channels with a native thread concept (Instagram/Messenger)
  status text not null default 'open' check (status in ('open', 'pending', 'closed')),
  tags text[] not null default '{}', -- mirrors contacts.tags
  assigned_to_user_id uuid references auth.users(id),
  last_message_at timestamptz,
  last_message_preview text,
  unread_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index uq_conversations_live_identity
  on public.conversations (tenant_id, channel_identity_id)
  where status <> 'closed';

create index idx_conversations_tenant_status on public.conversations (tenant_id, status, last_message_at desc);
create index idx_conversations_contact_id on public.conversations (tenant_id, contact_id);
create index idx_conversations_assigned_to on public.conversations (tenant_id, assigned_to_user_id);

create trigger trg_conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

-- Defense-in-depth: conversations.tenant_id must match both parent FKs' tenant_id (same pattern as
-- contact_channels' enforce_contact_channel_tenant_match()).
create or replace function public.enforce_conversation_tenant_match()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.channel_identities ci where ci.id = new.channel_identity_id and ci.tenant_id = new.tenant_id
  ) then
    raise exception 'conversations.tenant_id must match channel_identities.tenant_id';
  end if;
  if not exists (
    select 1 from public.channel_connections cc where cc.id = new.channel_connection_id and cc.tenant_id = new.tenant_id
  ) then
    raise exception 'conversations.tenant_id must match channel_connections.tenant_id';
  end if;
  return new;
end;
$$;

create trigger trg_conversations_tenant_match
  before insert on public.conversations
  for each row execute function public.enforce_conversation_tenant_match();

alter table public.conversations enable row level security;

create policy conversations_select on public.conversations for select
  using (tenant_id in (select public.get_my_tenant_ids()));

create policy conversations_insert on public.conversations for insert
  with check (
    tenant_id in (select public.get_my_tenant_ids())
    and public.get_my_role(tenant_id) in ('owner', 'admin', 'manager', 'agent')
  );

create policy conversations_update on public.conversations for update
  using (tenant_id in (select public.get_my_tenant_ids()))
  with check (
    tenant_id in (select public.get_my_tenant_ids())
    and public.get_my_role(tenant_id) in ('owner', 'admin', 'manager', 'agent')
  );
-- No delete policy: conversations are never hard-deleted, same as contacts/tasks/notes.

-- conversation_participants: generalizes beyond the single assigned_to_user_id column above, for
-- future multi-agent-watcher and multi-party (Voice conference, group-style) scenarios. Schema-only
-- this pass -- no dedicated endpoints/UI for watchers yet, single assignee is all the Service layer
-- exposes today; this table exists so adding that capability later is additive, not a redesign.
create table public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  participant_type text not null check (participant_type in ('agent', 'contact')),
  user_id uuid references auth.users(id),
  contact_id uuid references public.contacts(id),
  role text,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  constraint chk_conversation_participants_type_matches check (
    (participant_type = 'agent' and user_id is not null and contact_id is null)
    or (participant_type = 'contact' and contact_id is not null and user_id is null)
  )
);

create unique index uq_conversation_participants_agent
  on public.conversation_participants (conversation_id, user_id) where participant_type = 'agent';
create unique index uq_conversation_participants_contact
  on public.conversation_participants (conversation_id, contact_id) where participant_type = 'contact';

create or replace function public.enforce_conversation_participant_tenant_match()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.conversations c where c.id = new.conversation_id and c.tenant_id = new.tenant_id
  ) then
    raise exception 'conversation_participants.tenant_id must match parent conversation.tenant_id';
  end if;
  return new;
end;
$$;

create trigger trg_conversation_participants_tenant_match
  before insert on public.conversation_participants
  for each row execute function public.enforce_conversation_participant_tenant_match();

alter table public.conversation_participants enable row level security;

create policy conversation_participants_select on public.conversation_participants for select
  using (tenant_id in (select public.get_my_tenant_ids()));

create policy conversation_participants_insert on public.conversation_participants for insert
  with check (
    tenant_id in (select public.get_my_tenant_ids())
    and public.get_my_role(tenant_id) in ('owner', 'admin', 'manager', 'agent')
  );

-- conversation_events: the audit trail for conversation lifecycle -- assignment changes, status
-- changes, reopens, contact linking. event_type is free text at the DB level (same deliberate
-- precedent as audit_logs.action -- extensible without a migration per new value); a companion
-- TS const union gives type safety at the application layer (see channel.types.ts).
create table public.conversation_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  event_type text not null,
  actor_user_id uuid references auth.users(id), -- null = system/webhook-triggered
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_conversation_events_conversation_id on public.conversation_events (conversation_id, created_at desc);

create or replace function public.enforce_conversation_event_tenant_match()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.conversations c where c.id = new.conversation_id and c.tenant_id = new.tenant_id
  ) then
    raise exception 'conversation_events.tenant_id must match parent conversation.tenant_id';
  end if;
  return new;
end;
$$;

create trigger trg_conversation_events_tenant_match
  before insert on public.conversation_events
  for each row execute function public.enforce_conversation_event_tenant_match();

alter table public.conversation_events enable row level security;

create policy conversation_events_select on public.conversation_events for select
  using (tenant_id in (select public.get_my_tenant_ids()));

create policy conversation_events_insert on public.conversation_events for insert
  with check (
    tenant_id in (select public.get_my_tenant_ids())
    and public.get_my_role(tenant_id) in ('owner', 'admin', 'manager', 'agent')
  );

-- conversation_notes: an internal note scoped to THIS conversation thread (e.g. "asked to be
-- called back re: this specific complaint"), distinct from the existing contact-level notes table
-- (which persist across all of a contact's conversations). Identical shape/RLS precedent to notes.
create table public.conversation_notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  body text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint chk_conversation_notes_body_not_blank check (btrim(body) <> '')
);

create index idx_conversation_notes_conversation_id on public.conversation_notes (conversation_id, created_at desc);

create or replace function public.enforce_conversation_note_tenant_match()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.conversations c where c.id = new.conversation_id and c.tenant_id = new.tenant_id
  ) then
    raise exception 'conversation_notes.tenant_id must match parent conversation.tenant_id';
  end if;
  return new;
end;
$$;

create trigger trg_conversation_notes_tenant_match
  before insert on public.conversation_notes
  for each row execute function public.enforce_conversation_note_tenant_match();

alter table public.conversation_notes enable row level security;

create policy conversation_notes_select on public.conversation_notes for select
  using (tenant_id in (select public.get_my_tenant_ids()));

create policy conversation_notes_insert on public.conversation_notes for insert
  with check (
    tenant_id in (select public.get_my_tenant_ids())
    and public.get_my_role(tenant_id) in ('owner', 'admin', 'manager', 'agent')
    and created_by = auth.uid()
  );

-- Author can remove their own note; owner/admin can remove anyone's (moderation) -- same
-- precedent as notes_delete.
create policy conversation_notes_delete on public.conversation_notes for delete
  using (
    tenant_id in (select public.get_my_tenant_ids())
    and (created_by = auth.uid() or public.get_my_role(tenant_id) in ('owner', 'admin'))
  );
