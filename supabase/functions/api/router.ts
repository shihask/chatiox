import type {
  AuthenticatedHandler,
  PublicHandler,
  WorkspaceHandler,
} from '../_shared/http/requestContext.ts'
import { routes as authRoutes } from './controllers/auth.routes.ts'
import { routes as crmContactsRoutes } from './controllers/crm/contacts.routes.ts'
import { routes as crmNotesRoutes } from './controllers/crm/notes.routes.ts'
import { routes as crmTasksRoutes } from './controllers/crm/tasks.routes.ts'
import { routes as analyticsAnalyticsRoutes } from './controllers/analytics/analytics.routes.ts'
import { routes as administrationWorkspaceRoutes } from './controllers/administration/workspace.routes.ts'
import { routes as administrationTeamMembersRoutes } from './controllers/administration/team-members.routes.ts'
// Future modules: ONE import + ONE array entry, grouped by domain, e.g.
//   CRM            -> controllers/crm/tasks.routes.ts       -> crmTasksRoutes
//   Communication  -> controllers/communication/inbox.routes.ts -> communicationInboxRoutes
//   Administration -> controllers/administration/billing.routes.ts -> administrationBillingRoutes
// (not written as literal import statements here so deploy tooling doesn't try to bundle
// not-yet-existing files -- see docs/architecture.md §1)

// Discriminated union (not one flat `handler: Handler` field) so each tier's specific handler
// signature (which `ctx` shape it receives) is correctly matched at the call site in index.ts.
export interface PublicRouteDefinition {
  method: string
  pattern: URLPattern
  tier: 'public'
  handler: PublicHandler
}
export interface AuthenticatedRouteDefinition {
  method: string
  pattern: URLPattern
  tier: 'authenticated'
  handler: AuthenticatedHandler
}
export interface WorkspaceRouteDefinition {
  method: string
  pattern: URLPattern
  tier: 'workspace'
  handler: WorkspaceHandler
}
export type RouteDefinition =
  | PublicRouteDefinition
  | AuthenticatedRouteDefinition
  | WorkspaceRouteDefinition

// Reserved, not built in Phase 1: a separate /webhooks/<channel> route family for inbound provider
// callbacks needs a fourth "webhook" tier (signature-verified, never JWT-authenticated) once a
// provider is implemented -- see docs/architecture.md and _shared/http/.

export const routes: RouteDefinition[] = [
  authRoutes,
  crmContactsRoutes,
  crmNotesRoutes,
  crmTasksRoutes,
  analyticsAnalyticsRoutes,
  administrationWorkspaceRoutes,
  administrationTeamMembersRoutes,
].flat()
