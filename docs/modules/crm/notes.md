# CRM: Notes

## Status

Not implemented in Phase 1. Real nav item (sidebar → CRM → Notes), currently rendering `ComingSoonPage`. Follow the pattern established by CRM Contacts when this is built.

## Purpose

Free-text notes attached to a Contact, authored by a team member. Examples: "Interested in weekend batch," "Needs Malayalam communication," "Call after salary," "Requested brochure."

## Data shape (documented now, no table built yet)

```ts
interface NoteDTO {
  id: string
  workspaceId: string
  contactId: string
  body: string
  createdBy: string
  createdAt: string
  updatedAt: string
}
```

## Planned REST endpoints

- `GET /notes?contactId=...`
- `POST /notes`
- `PATCH /notes/:id`
- `DELETE /notes/:id`

## Implementation checklist (backend, when this is built)

- [ ] `crm/notes.schemas.ts` / `.dtos.ts` / `.mapper.ts` / `.repository.ts` / `.service.ts` / `.controller.ts` / `.routes.ts`
- [ ] Migration: `notes` table (`tenant_id`, `contact_id` FK, `body`, `created_by`), RLS scoped like `contacts`
- [ ] Wire `recordAudit()` (`note.created`) and `emit()` (`NoteAdded`) -- becomes a Timeline entry with zero new plumbing (see `crm/timeline.md`)

## Implementation checklist (frontend, when this is built)

- [ ] `src/features/crm/notes/{schemas,hooks,components,pages}`
- [ ] `src/api/notesApi.ts` (flat, alongside `contactsApi.ts`)
- [ ] Likely surfaced primarily as a panel on the future `ContactDetailPage`, in addition to its own list route
- [ ] Register real route in `src/router/routes.tsx`; flip `navConfig.ts`'s Notes entry from `"coming-soon"` to `"real"`
