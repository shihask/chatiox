-- Solves the chicken-and-egg problem: a brand-new user has no membership yet, so plain RLS would
-- block their own tenant/membership insert. This is the only place tenant creation happens.
create or replace function public.create_tenant_with_owner(p_user_id uuid, p_tenant_name text)
returns table(tenant_id uuid, role public.tenant_role)
language plpgsql security definer set search_path = public as $$
declare
  v_tenant_id uuid;
begin
  insert into public.tenants(name, slug) values (
    p_tenant_name,
    lower(regexp_replace(p_tenant_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 6)
  ) returning id into v_tenant_id;

  insert into public.tenant_memberships(tenant_id, user_id, role)
  values (v_tenant_id, p_user_id, 'owner');

  -- Sensible starting defaults -- every workspace can rename/reorder/add its own later (once that
  -- management UI is built, see docs/modules/administration/workspace.md). Not hardcoded constants
  -- read at runtime; just seed data.
  insert into public.lead_statuses (tenant_id, name, sort_order, is_won, is_lost) values
    (v_tenant_id, 'New', 10, false, false),
    (v_tenant_id, 'Contacted', 20, false, false),
    (v_tenant_id, 'Interested', 30, false, false),
    (v_tenant_id, 'Counseling Scheduled', 40, false, false),
    (v_tenant_id, 'Demo Scheduled', 50, false, false),
    (v_tenant_id, 'Follow-up Required', 60, false, false),
    (v_tenant_id, 'Admission Confirmed', 70, true, false),
    (v_tenant_id, 'Lost', 80, false, true);

  insert into public.lead_sources (tenant_id, name, sort_order) values
    (v_tenant_id, 'Instagram', 10), (v_tenant_id, 'Facebook', 20), (v_tenant_id, 'WhatsApp', 30),
    (v_tenant_id, 'Google Search', 40), (v_tenant_id, 'Google Ads', 50), (v_tenant_id, 'Website', 60),
    (v_tenant_id, 'Landing Page', 70), (v_tenant_id, 'Reference', 80), (v_tenant_id, 'Walk-in', 90),
    (v_tenant_id, 'Phone Call', 100), (v_tenant_id, 'YouTube', 110), (v_tenant_id, 'LinkedIn', 120),
    (v_tenant_id, 'Telegram', 130), (v_tenant_id, 'Newspaper', 140), (v_tenant_id, 'Flyer', 150),
    (v_tenant_id, 'Other', 160);

  return query select v_tenant_id, 'owner'::public.tenant_role;
end;
$$;

-- service_role only: this function trusts p_user_id as-given with no auth.uid() check, so it must
-- never be callable by an arbitrary authenticated user (who could pass someone else's user id).
-- Only our own signup flow (using the service-role client) is meant to call this.
revoke all on function public.create_tenant_with_owner from public, authenticated, anon;
grant execute on function public.create_tenant_with_owner to service_role;
