-- Human-readable, owner/admin-only-readable audit trail of sensitive actions. Real Phase 1 scope,
-- not deferred (see docs/architecture.md §5).
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,        -- e.g. 'contact.created', 'auth.login'
  target_type text not null,   -- e.g. 'contact', 'user'
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_tenant_id_created_at_idx on public.audit_logs (tenant_id, created_at desc);

alter table public.audit_logs enable row level security;

-- Only owner/admin may READ audit logs for their workspace -- sensitive data.
create policy audit_logs_select_owner_admin on public.audit_logs for select
  using (
    tenant_id in (select public.get_my_tenant_ids())
    and public.get_my_role(tenant_id) in ('owner', 'admin')
  );

-- No INSERT policy for `authenticated`: all writes go through this RPC.
create or replace function public.record_audit_log(
  tenant_id uuid,
  actor_user_id uuid,
  action text,
  target_type text,
  target_id uuid default null,
  metadata jsonb default '{}'::jsonb
) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs (tenant_id, actor_user_id, action, target_type, target_id, metadata)
  values (tenant_id, actor_user_id, action, target_type, target_id, metadata);
end;
$$;

revoke all on function public.record_audit_log from public, anon;
grant execute on function public.record_audit_log to authenticated, service_role;
