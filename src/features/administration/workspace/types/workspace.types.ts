// Mirrors docs/modules/administration/workspace.md -- not implemented yet, no backend write route exists.
// LeadStatusDTO/LeadSourceDTO real shapes live in src/features/crm/contacts/types/contact.types.ts
// (Phase 1 already built read endpoints for them) -- this module adds write endpoints over the same
// tables, not new ones.
export interface WorkspaceProfileDTO {
  id: string
  name: string
  slug: string
}
