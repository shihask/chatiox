# Administration: Workspace (settings)

## Status

Not implemented in Phase 1. Real nav item (sidebar → Workspace, replacing what would otherwise be called "Settings"), currently rendering `ComingSoonPage`.

## Naming note

This is **not** the same "workspace" as the multi-tenancy noun (`workspaceId`, `X-Workspace-Id` header -- see `docs/architecture.md` §4). This module is the settings _screen_ for a tenant's own configuration. Kept textually distinct by living under `administration/` in both `src/features/` and (eventually) `supabase/functions/api/controllers/`.

## Purpose

General workspace profile/configuration, plus -- eventually -- management (create/rename/reorder/archive) of the `lead_statuses` and `lead_sources` lists that Phase 1 already seeds with sensible defaults per workspace (see `supabase/migrations/*_create_tenant_provisioning_rpc.sql`). Phase 1 only exposes **read** endpoints for those two lists (`GET /lead-statuses`, `GET /lead-sources`, colocated with Contacts) -- full CRUD management belongs here once built.

## Data shapes (documented now; `lead_statuses`/`lead_sources` tables already exist from Phase 1)

```ts
interface WorkspaceProfileDTO {
  id: string
  name: string
  slug: string
}
// LeadStatusDTO / LeadSourceDTO already exist (api/dtos/crm/contacts.dtos.ts) -- this module adds
// write endpoints (create/rename/reorder/archive) over the same Phase-1 tables, not new tables.
```

## Implementation checklist (when this is built)

- [ ] `administration/workspace.controller.ts` / `.service.ts` / `.repository.ts` / `.routes.ts`
- [ ] `PATCH /workspace` (profile), `POST/PATCH/DELETE /lead-statuses`, `POST/PATCH/DELETE /lead-sources` -- writes restricted to `owner`/`admin`, reusing the read endpoints Contacts already built in Phase 1
- [ ] No new migrations required for lead-status/lead-source management -- the tables and RLS already exist; only new write policies/RPCs are needed
