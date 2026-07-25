-- notes: free-text annotations on a Contact (documented in docs/modules/crm/notes.md as a future
-- module; promoted to real Phase 1 scope here as a small, self-contained CRUD addition alongside
-- the design-system UI pass -- no Tasks/Timeline/Notification tables are being added yet).
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,  -- denormalized for cheap RLS
  contact_id uuid not null references public.contacts(id) on delete cascade,
  body text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint chk_notes_body_not_blank check (btrim(body) <> '')
);

create index idx_notes_contact_id_created_at on public.notes (contact_id, created_at desc);
create index idx_notes_tenant_id on public.notes (tenant_id);

-- Defense-in-depth: notes.tenant_id is denormalized (kept off the parent contact join for cheap
-- RLS), so enforce it can never drift from the parent contact's actual tenant -- same pattern as
-- contact_channels' enforce_contact_channel_tenant_match().
create or replace function public.enforce_note_tenant_match()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.contacts c
    where c.id = new.contact_id and c.tenant_id = new.tenant_id
  ) then
    raise exception 'notes.tenant_id must match parent contact.tenant_id';
  end if;
  return new;
end;
$$;

create trigger trg_notes_tenant_match
  before insert on public.notes
  for each row execute function public.enforce_note_tenant_match();

alter table public.notes enable row level security;

create policy notes_select on public.notes for select
  using (tenant_id in (select public.get_my_tenant_ids()));

create policy notes_insert on public.notes for insert
  with check (
    tenant_id in (select public.get_my_tenant_ids())
    and public.get_my_role(tenant_id) in ('owner', 'admin', 'manager', 'agent')
    and created_by = auth.uid()
  );

-- A note's author can remove their own note; owner/admin can remove anyone's (moderation).
create policy notes_delete on public.notes for delete
  using (
    tenant_id in (select public.get_my_tenant_ids())
    and (created_by = auth.uid() or public.get_my_role(tenant_id) in ('owner', 'admin'))
  );
-- No update policy: notes are add/remove only in this pass, matching the simple "add a note,
-- delete a note" UX -- no edit-in-place.
