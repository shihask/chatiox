-- Analytics: read-only aggregate reports over data Phase 1 already models (contacts +
-- lead_statuses/lead_sources), documented in docs/modules/analytics/analytics.md as the
-- flagship "Lead Source performance" report. RPCs (not views) so the same explicit
-- get_my_role()-style authorization check used by every other write RPC in this project also
-- guards these reads, and so tenant scoping is unambiguous (an explicit p_tenant_id argument,
-- not implicit RLS-on-a-view semantics).
create or replace function public.get_leads_by_source(tenant_id uuid)
returns table(
  lead_source_id uuid,
  lead_source_name text,
  sort_order smallint,
  total bigint,
  won bigint,
  lost bigint
)
language plpgsql security definer stable set search_path = public as $$
begin
  if tenant_id not in (select public.get_my_tenant_ids()) then
    raise exception 'insufficient_permissions' using errcode = '42501';
  end if;

  return query
    select
      ls.id,
      ls.name,
      ls.sort_order,
      count(c.id)::bigint,
      count(c.id) filter (where lst.is_won)::bigint,
      count(c.id) filter (where lst.is_lost)::bigint
    from public.lead_sources ls
    left join public.contacts c
      on c.lead_source_id = ls.id and c.tenant_id = ls.tenant_id and c.deleted_at is null
    left join public.lead_statuses lst on lst.id = c.lead_status_id
    where ls.tenant_id = get_leads_by_source.tenant_id
    group by ls.id, ls.name, ls.sort_order
    order by ls.sort_order;
end;
$$;

revoke all on function public.get_leads_by_source from public, anon;
grant execute on function public.get_leads_by_source to authenticated, service_role;

create or replace function public.get_lead_status_distribution(tenant_id uuid)
returns table(
  lead_status_id uuid,
  lead_status_name text,
  sort_order smallint,
  is_won boolean,
  is_lost boolean,
  total bigint
)
language plpgsql security definer stable set search_path = public as $$
begin
  if tenant_id not in (select public.get_my_tenant_ids()) then
    raise exception 'insufficient_permissions' using errcode = '42501';
  end if;

  return query
    select
      lst.id,
      lst.name,
      lst.sort_order,
      lst.is_won,
      lst.is_lost,
      count(c.id)::bigint
    from public.lead_statuses lst
    left join public.contacts c
      on c.lead_status_id = lst.id and c.tenant_id = lst.tenant_id and c.deleted_at is null
    where lst.tenant_id = get_lead_status_distribution.tenant_id
    group by lst.id, lst.name, lst.sort_order, lst.is_won, lst.is_lost
    order by lst.sort_order;
end;
$$;

revoke all on function public.get_lead_status_distribution from public, anon;
grant execute on function public.get_lead_status_distribution to authenticated, service_role;
