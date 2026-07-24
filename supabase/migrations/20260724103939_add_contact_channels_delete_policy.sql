-- The original contacts_and_channels migration defined select/insert/update policies on
-- contact_channels but no delete policy, so any DELETE (used by the granular
-- DELETE /contact-channels/:id endpoint -- removing one channel from a contact that stays active,
-- distinct from soft-deleting a whole contact) would be silently blocked by RLS regardless of
-- role. Mirrors the same owner/admin/manager restriction used by soft_delete_contact().
create policy contact_channels_delete on public.contact_channels for delete
  using (
    tenant_id in (select public.get_my_tenant_ids())
    and public.get_my_role(tenant_id) in ('owner', 'admin', 'manager')
  );
