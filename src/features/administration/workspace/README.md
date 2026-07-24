# Administration: Workspace (not yet implemented)

Full spec: [`docs/modules/administration/workspace.md`](../../../../docs/modules/administration/workspace.md).

Status: sidebar entry renders `ComingSoonPage`. No write endpoints exist yet -- Phase 1 already built read-only `GET /lead-statuses` and `GET /lead-sources` (colocated with Contacts); this module adds management (create/rename/reorder/archive) over those same tables, plus general workspace profile settings.

**Naming note**: this is not the same "workspace" as the multi-tenancy noun (`workspaceId`). See `docs/architecture.md` §2.
