# Administration: Team Members

## Status

Not implemented in Phase 1. Real nav item (sidebar → Team), currently rendering `ComingSoonPage`.

## Purpose

Invite/role-management for a workspace's team. `tenant_memberships` (role enum `owner`/`admin`/`manager`/`agent`) already exists and is fully functional in Phase 1 for authorization purposes -- this module is the **UI and invite flow** on top of it, not new authorization plumbing.

## Data shapes (documented now, no new tables needed beyond what exists)

```ts
interface TeamMemberDTO {
  userId: string
  email: string
  role: WorkspaceRole // 'owner' | 'admin' | 'manager' | 'agent' -- already defined in _shared/http/requestContext.ts
  joinedAt: string
}
interface TeamInviteDTO {
  id: string
  workspaceId: string
  email: string
  role: WorkspaceRole
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  invitedBy: string
  createdAt: string
}
```

## Implementation checklist (when this is built)

- [ ] Migration: `tenant_invites` (or similar) -- `tenant_memberships` itself already exists, no change needed there
- [ ] `administration/team-members.controller.ts` / `.service.ts` / `.repository.ts` / `.routes.ts` -- role changes/removals restricted to `owner`/`admin` via the existing `requireRole()` pattern already used by Contacts
- [ ] Invite acceptance flow likely needs a new `/auth/*`-adjacent public endpoint (accepting an invite token creates a `tenant_memberships` row for an existing or new user) -- coordinate with Auth's existing signup flow rather than duplicating it
