-- Workspace Settings: promotes lead_statuses/lead_sources from read-only (seeded once at signup)
-- to owner/admin-manageable lists, plus lets a workspace rename itself -- both explicitly
-- anticipated in docs/modules/administration/workspace.md ("no new migrations required... only
-- new write policies are needed"). No new tables.

-- tenants: previously had only a select policy (rename happens here for the first time).
create policy tenants_update on public.tenants for update
  using (id in (select public.get_my_tenant_ids()) and public.get_my_role(id) in ('owner', 'admin'))
  with check (id in (select public.get_my_tenant_ids()) and public.get_my_role(id) in ('owner', 'admin'));

-- lead_statuses / lead_sources: previously select-only ("only the provisioning RPC writes in
-- Phase 1" -- see 20260724102716_create_lead_statuses_and_sources.sql). Writes restricted to
-- owner/admin, same bar as every other workspace-configuration change.
create policy lead_statuses_insert on public.lead_statuses for insert
  with check (tenant_id in (select public.get_my_tenant_ids()) and public.get_my_role(tenant_id) in ('owner', 'admin'));
create policy lead_statuses_update on public.lead_statuses for update
  using (tenant_id in (select public.get_my_tenant_ids()) and public.get_my_role(tenant_id) in ('owner', 'admin'))
  with check (tenant_id in (select public.get_my_tenant_ids()) and public.get_my_role(tenant_id) in ('owner', 'admin'));
create policy lead_statuses_delete on public.lead_statuses for delete
  using (tenant_id in (select public.get_my_tenant_ids()) and public.get_my_role(tenant_id) in ('owner', 'admin'));

create policy lead_sources_insert on public.lead_sources for insert
  with check (tenant_id in (select public.get_my_tenant_ids()) and public.get_my_role(tenant_id) in ('owner', 'admin'));
create policy lead_sources_update on public.lead_sources for update
  using (tenant_id in (select public.get_my_tenant_ids()) and public.get_my_role(tenant_id) in ('owner', 'admin'))
  with check (tenant_id in (select public.get_my_tenant_ids()) and public.get_my_role(tenant_id) in ('owner', 'admin'));
create policy lead_sources_delete on public.lead_sources for delete
  using (tenant_id in (select public.get_my_tenant_ids()) and public.get_my_role(tenant_id) in ('owner', 'admin'));

-- Note on deletion: contacts.lead_status_id/lead_source_id reference these tables with the default
-- ON DELETE NO ACTION, so deleting a status/source still in use on any contact raises a foreign key
-- violation (23503) rather than silently orphaning/nulling a contact's lead status -- the API layer
-- maps that to a clean 409 (see _shared/errors.ts). Reassign or clear affected contacts first.
