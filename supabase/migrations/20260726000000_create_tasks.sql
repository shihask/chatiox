-- tasks: follow-up/reminder items on a Contact (documented in docs/modules/crm/tasks.md as a
-- future module; promoted to real scope here, same pattern as notes -- see
-- 20260725000000_create_notes.sql). Tasks belong to Contacts, not a separate lifecycle of their
-- own (see docs/architecture.md's CRM-first design).
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,  -- denormalized for cheap RLS
  contact_id uuid not null references public.contacts(id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz,
  status text not null default 'open' check (status in ('open', 'completed', 'cancelled')),
  assigned_to_user_id uuid references auth.users(id),
  completed_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_tasks_title_not_blank check (btrim(title) <> '')
);

create index idx_tasks_contact_id_due_at on public.tasks (contact_id, due_at);
create index idx_tasks_tenant_id_status_due_at on public.tasks (tenant_id, status, due_at);
create index idx_tasks_assigned_to on public.tasks (tenant_id, assigned_to_user_id);

create trigger trg_tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- Defense-in-depth: tasks.tenant_id is denormalized (kept off the parent contact join for cheap
-- RLS), so enforce it can never drift from the parent contact's actual tenant -- same pattern as
-- contact_channels' enforce_contact_channel_tenant_match() / notes' enforce_note_tenant_match().
create or replace function public.enforce_task_tenant_match()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.contacts c
    where c.id = new.contact_id and c.tenant_id = new.tenant_id
  ) then
    raise exception 'tasks.tenant_id must match parent contact.tenant_id';
  end if;
  return new;
end;
$$;

create trigger trg_tasks_tenant_match
  before insert on public.tasks
  for each row execute function public.enforce_task_tenant_match();

alter table public.tasks enable row level security;

create policy tasks_select on public.tasks for select
  using (tenant_id in (select public.get_my_tenant_ids()));

create policy tasks_insert on public.tasks for insert
  with check (
    tenant_id in (select public.get_my_tenant_ids())
    and public.get_my_role(tenant_id) in ('owner', 'admin', 'manager', 'agent')
    and created_by = auth.uid()
  );

create policy tasks_update on public.tasks for update
  using (tenant_id in (select public.get_my_tenant_ids()))
  with check (
    tenant_id in (select public.get_my_tenant_ids())
    and public.get_my_role(tenant_id) in ('owner', 'admin', 'manager', 'agent')
  );

-- A task's creator can remove their own task; owner/admin can remove anyone's (moderation) --
-- same precedent as notes_delete. Cancelling (status='cancelled') is the normal "I don't need
-- this anymore" path; delete is only for outright mistakes.
create policy tasks_delete on public.tasks for delete
  using (
    tenant_id in (select public.get_my_tenant_ids())
    and (created_by = auth.uid() or public.get_my_role(tenant_id) in ('owner', 'admin'))
  );
