-- Team member management (docs/modules/administration/team-members.md): tenant_memberships
-- already exists and is fully functional for authorization; this migration adds the invite flow
-- plus the write operations (role change, removal) that were deliberately left out of the original
-- tenant_memberships migration ("only ever via security-definer RPCs").
create table public.tenant_invites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  role public.tenant_role not null default 'agent',
  token uuid not null default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz
);

-- Only one live invite per email per workspace at a time -- creating a new one for the same email
-- requires revoking (deleting) the pending one first, avoiding stale/ambiguous duplicate links.
create unique index uq_tenant_invites_pending_email on public.tenant_invites (tenant_id, lower(email)) where status = 'pending';
create unique index uq_tenant_invites_token on public.tenant_invites (token);
create index idx_tenant_invites_tenant_id on public.tenant_invites (tenant_id);

alter table public.tenant_invites enable row level security;

create policy tenant_invites_select on public.tenant_invites for select
  using (tenant_id in (select public.get_my_tenant_ids()) and public.get_my_role(tenant_id) in ('owner', 'admin'));

create policy tenant_invites_insert on public.tenant_invites for insert
  with check (
    tenant_id in (select public.get_my_tenant_ids())
    and public.get_my_role(tenant_id) in ('owner', 'admin')
    and invited_by = auth.uid()
  );

-- Revoking a pending invite is a delete (no 'revoked' status kept -- same precedent as lead
-- statuses/sources: removal in this pass is destructive, not a soft-state transition). Acceptance
-- (status -> 'accepted') is only ever done by the signup flow's service-role client, which bypasses
-- RLS entirely -- no update policy needed for authenticated users.
create policy tenant_invites_delete on public.tenant_invites for delete
  using (tenant_id in (select public.get_my_tenant_ids()) and public.get_my_role(tenant_id) in ('owner', 'admin'));

-- Role changes and removals need to protect an invariant (never leave a workspace with zero owners)
-- that's awkward to express as a pure RLS predicate, so -- same pattern as soft_delete_contact() --
-- they're security-definer RPCs rather than plain policies.
create or replace function public.update_member_role(p_tenant_id uuid, p_target_user_id uuid, p_new_role public.tenant_role)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_caller_role public.tenant_role;
  v_current_role public.tenant_role;
  v_owner_count int;
begin
  v_caller_role := public.get_my_role(p_tenant_id);
  if v_caller_role not in ('owner', 'admin') then
    raise exception 'insufficient_permissions' using errcode = '42501';
  end if;

  select role into v_current_role from public.tenant_memberships
    where tenant_id = p_tenant_id and user_id = p_target_user_id;
  if v_current_role is null then
    raise exception 'Member not found in this workspace' using errcode = 'P0002';
  end if;

  -- Only an owner may promote someone to owner or change another owner's role.
  if (p_new_role = 'owner' or v_current_role = 'owner') and v_caller_role <> 'owner' then
    raise exception 'insufficient_permissions' using errcode = '42501';
  end if;

  if v_current_role = 'owner' and p_new_role <> 'owner' then
    select count(*) into v_owner_count from public.tenant_memberships
      where tenant_id = p_tenant_id and role = 'owner';
    if v_owner_count <= 1 then
      raise exception 'A workspace must always have at least one owner' using errcode = '22023';
    end if;
  end if;

  update public.tenant_memberships set role = p_new_role
    where tenant_id = p_tenant_id and user_id = p_target_user_id;
end;
$$;

create or replace function public.remove_member(p_tenant_id uuid, p_target_user_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_caller_role public.tenant_role;
  v_current_role public.tenant_role;
  v_owner_count int;
begin
  v_caller_role := public.get_my_role(p_tenant_id);
  if v_caller_role not in ('owner', 'admin') then
    raise exception 'insufficient_permissions' using errcode = '42501';
  end if;

  select role into v_current_role from public.tenant_memberships
    where tenant_id = p_tenant_id and user_id = p_target_user_id;
  if v_current_role is null then
    raise exception 'Member not found in this workspace' using errcode = 'P0002';
  end if;

  if v_current_role = 'owner' then
    if v_caller_role <> 'owner' then
      raise exception 'insufficient_permissions' using errcode = '42501';
    end if;
    select count(*) into v_owner_count from public.tenant_memberships
      where tenant_id = p_tenant_id and role = 'owner';
    if v_owner_count <= 1 then
      raise exception 'A workspace must always have at least one owner' using errcode = '22023';
    end if;
  end if;

  delete from public.tenant_memberships where tenant_id = p_tenant_id and user_id = p_target_user_id;
end;
$$;

grant execute on function public.update_member_role to authenticated;
grant execute on function public.remove_member to authenticated;
