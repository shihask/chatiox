-- Provider-agnostic messaging architecture, part 4/6.
-- messages.channel_template_id has no FK constraint yet -- channel_templates is created in the next
-- migration (E); the constraint is added there via ALTER TABLE once that table exists, to preserve
-- the intended migration order (connections/identities/conversations before templates).
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  channel_connection_id uuid not null references public.channel_connections(id), -- denormalized, for the dedup index below
  direction text not null check (direction in ('inbound', 'outbound')),
  message_type text not null default 'text' check (message_type in ('text', 'template', 'media', 'interactive', 'system')),
  body text,
  channel_template_id uuid,
  provider_message_id text,
  status text not null default 'queued' check (status in ('queued', 'sent', 'delivered', 'read', 'failed', 'received')),
  error_code text,
  error_message text,
  sent_by_user_id uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  occurred_at timestamptz not null default now()
);

-- Idempotent webhook dedup -- a provider_message_id is only unique within one connected account.
create unique index uq_messages_connection_provider_message_id
  on public.messages (channel_connection_id, provider_message_id)
  where provider_message_id is not null;

create index idx_messages_conversation_id on public.messages (tenant_id, conversation_id, created_at desc);

create or replace function public.enforce_message_tenant_match()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.conversations c where c.id = new.conversation_id and c.tenant_id = new.tenant_id
  ) then
    raise exception 'messages.tenant_id must match parent conversation.tenant_id';
  end if;
  return new;
end;
$$;

create trigger trg_messages_tenant_match
  before insert on public.messages
  for each row execute function public.enforce_message_tenant_match();

-- Mechanical bookkeeping (not conditional business logic, unlike the Won/Lost mutual-exclusivity
-- case) -- a trigger is the right tool here, keeping conversations' denormalized list-view fields
-- in sync with every new message.
create or replace function public.sync_conversation_on_new_message()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.conversations
  set
    last_message_at = new.occurred_at,
    last_message_preview = left(coalesce(new.body, '[' || new.message_type || ']'), 200),
    unread_count = case when new.direction = 'inbound' then unread_count + 1 else unread_count end,
    updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger trg_messages_sync_conversation
  after insert on public.messages
  for each row execute function public.sync_conversation_on_new_message();

alter table public.messages enable row level security;

create policy messages_select on public.messages for select
  using (tenant_id in (select public.get_my_tenant_ids()));

create policy messages_insert on public.messages for insert
  with check (
    tenant_id in (select public.get_my_tenant_ids())
    and public.get_my_role(tenant_id) in ('owner', 'admin', 'manager', 'agent')
  );

create policy messages_update on public.messages for update
  using (tenant_id in (select public.get_my_tenant_ids()))
  with check (tenant_id in (select public.get_my_tenant_ids()));
-- No delete policy: message history is never hard-deleted.

-- message_status_events: append-only history of every status transition a provider reports
-- (sent -> delivered -> read). messages.status stays a denormalized "current" column, advanced
-- only forward by the Service layer (ordering logic lives there, not a trigger, same precedent as
-- the Won/Lost mutual-exclusivity logic living in workspace.repository.ts).
create table public.message_status_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  message_id uuid not null references public.messages(id) on delete cascade,
  status text not null check (status in ('queued', 'sent', 'delivered', 'read', 'failed', 'received')),
  error_code text,
  error_message text,
  occurred_at timestamptz not null default now(),
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create index idx_message_status_events_message_id on public.message_status_events (message_id, occurred_at);

create or replace function public.enforce_message_status_event_tenant_match()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.messages m where m.id = new.message_id and m.tenant_id = new.tenant_id
  ) then
    raise exception 'message_status_events.tenant_id must match parent message.tenant_id';
  end if;
  return new;
end;
$$;

create trigger trg_message_status_events_tenant_match
  before insert on public.message_status_events
  for each row execute function public.enforce_message_status_event_tenant_match();

alter table public.message_status_events enable row level security;

create policy message_status_events_select on public.message_status_events for select
  using (tenant_id in (select public.get_my_tenant_ids()));

create policy message_status_events_insert on public.message_status_events for insert
  with check (tenant_id in (select public.get_my_tenant_ids()));

-- message_attachments: inbound media is downloaded and re-uploaded into the message-attachments
-- Storage bucket immediately on ingest (provider-hosted media URLs/IDs expire) -- this table never
-- serves a live provider URL, only a stable Storage path.
create table public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  message_id uuid not null references public.messages(id) on delete cascade,
  content_type text not null,
  storage_path text not null,
  provider_media_id text, -- audit/debug only, never used to serve
  file_name text,
  file_size_bytes bigint,
  width integer,
  height integer,
  duration_seconds numeric,
  created_at timestamptz not null default now()
);

create index idx_message_attachments_message_id on public.message_attachments (message_id);

create or replace function public.enforce_message_attachment_tenant_match()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.messages m where m.id = new.message_id and m.tenant_id = new.tenant_id
  ) then
    raise exception 'message_attachments.tenant_id must match parent message.tenant_id';
  end if;
  return new;
end;
$$;

create trigger trg_message_attachments_tenant_match
  before insert on public.message_attachments
  for each row execute function public.enforce_message_attachment_tenant_match();

alter table public.message_attachments enable row level security;

create policy message_attachments_select on public.message_attachments for select
  using (tenant_id in (select public.get_my_tenant_ids()));

create policy message_attachments_insert on public.message_attachments for insert
  with check (tenant_id in (select public.get_my_tenant_ids()));

-- message_reactions: schema-only this pass, no endpoints yet. Actor identity is normalized
-- (actor_type + actor_user_id/actor_contact_id, same pattern as conversation_participants) rather
-- than overloading a single nullable user_id column -- this is what leaves room for bot/
-- integration/system-generated reactions later without another migration.
create table public.message_reactions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  message_id uuid not null references public.messages(id) on delete cascade,
  emoji text not null,
  actor_type text not null check (actor_type in ('agent', 'contact')),
  actor_user_id uuid references auth.users(id),
  actor_contact_id uuid references public.contacts(id),
  created_at timestamptz not null default now(),
  constraint chk_message_reactions_actor_matches check (
    (actor_type = 'agent' and actor_user_id is not null and actor_contact_id is null)
    or (actor_type = 'contact' and actor_contact_id is not null and actor_user_id is null)
  )
);

create unique index uq_message_reactions_agent
  on public.message_reactions (message_id, actor_user_id, emoji) where actor_type = 'agent';
create unique index uq_message_reactions_contact
  on public.message_reactions (message_id, actor_contact_id, emoji) where actor_type = 'contact';

create or replace function public.enforce_message_reaction_tenant_match()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.messages m where m.id = new.message_id and m.tenant_id = new.tenant_id
  ) then
    raise exception 'message_reactions.tenant_id must match parent message.tenant_id';
  end if;
  return new;
end;
$$;

create trigger trg_message_reactions_tenant_match
  before insert on public.message_reactions
  for each row execute function public.enforce_message_reaction_tenant_match();

alter table public.message_reactions enable row level security;

create policy message_reactions_select on public.message_reactions for select
  using (tenant_id in (select public.get_my_tenant_ids()));

create policy message_reactions_insert on public.message_reactions for insert
  with check (tenant_id in (select public.get_my_tenant_ids()));

-- Storage: private bucket for message attachments, workspace-prefixed paths, first concrete use of
-- the "File Storage" item docs/architecture.md §6 already flagged as future/undefined.
insert into storage.buckets (id, name, public)
values ('message-attachments', 'message-attachments', false)
on conflict (id) do nothing;

create policy message_attachments_storage_select on storage.objects for select
  using (
    bucket_id = 'message-attachments'
    and (storage.foldername(name))[1]::uuid in (select public.get_my_tenant_ids())
  );

create policy message_attachments_storage_insert on storage.objects for insert
  with check (
    bucket_id = 'message-attachments'
    and (storage.foldername(name))[1]::uuid in (select public.get_my_tenant_ids())
  );
