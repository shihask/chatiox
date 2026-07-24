# CRM: Tasks

## Status

Not implemented in Phase 1. Real nav item (sidebar → CRM → Tasks), currently rendering `ComingSoonPage`. Follow the pattern established by CRM Contacts (`supabase/functions/api/{controllers,services,repositories,mappers,schemas,dtos}/crm/contacts.*` and `src/features/crm/contacts/`) when this is built.

## Purpose

Tasks belong to Contacts, not to a separate lifecycle of their own. Examples: Call Customer, Counseling, Demo Class, Meeting, Reminder, Follow-up.

## Data shape (documented now, no table built yet)

```ts
interface TaskDTO {
  id: string
  workspaceId: string
  contactId: string // required -- a Task always belongs to a Contact
  title: string
  description: string | null
  dueAt: string | null
  status: 'open' | 'completed' | 'cancelled'
  assignedToUserId: string | null
  createdBy: string
  completedAt: string | null
  createdAt: string
  updatedAt: string
}
```

## Planned REST endpoints (`/api/v1/...`, flat, no `/crm` prefix -- see architecture.md)

- `GET /tasks?contactId=...` -- list a contact's tasks (and/or a workspace-wide "my open tasks" view)
- `POST /tasks`
- `PATCH /tasks/:id` (including marking complete -- sets `completedAt`)
- `DELETE /tasks/:id`

## Implementation checklist (backend, when this is built)

- [ ] `crm/tasks.schemas.ts` / `crm/tasks.dtos.ts` / `crm/tasks.mapper.ts` / `crm/tasks.repository.ts` / `crm/tasks.service.ts` / `crm/tasks.controller.ts` / `crm/tasks.routes.ts`
- [ ] Migration: `tasks` table (`tenant_id`, `contact_id` FK, `assigned_to_user_id`, `status`, `due_at`, ...), RLS scoped like `contacts`
- [ ] `contacts.service.ts`'s "Assigned User" validation pattern is reused here for `assigned_to_user_id`
- [ ] Wire `recordAudit()` (`task.created` / `task.completed`) and `emit()` (`TaskCreated` / `TaskCompleted`) -- these become Activity/Timeline entries (see `crm/timeline.md`) with zero new plumbing

## Implementation checklist (frontend, when this is built)

- [ ] `src/features/crm/tasks/{schemas,hooks,components,pages}` following `src/features/crm/contacts/`'s structure
- [ ] `src/api/tasksApi.ts` (flat, alongside `contactsApi.ts`)
- [ ] Register real routes in `src/router/routes.tsx`; flip `navConfig.ts`'s Tasks entry from `"coming-soon"` to `"real"`
