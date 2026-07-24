# Automation

## Status

Not implemented in Phase 1. Real nav item (sidebar → Automation, flat -- one module today, domain === module until it grows), currently rendering `ComingSoonPage`.

## Purpose

Automation acts on CRM entities by reacting to the same domain event bus every other module already emits into (`_shared/events.ts` -- see `crm/timeline.md` for the same bus used to build Timeline). Example flow, directly from the product spec:

```
Lead Created -> Assign Agent -> Send WhatsApp -> Create Task -> Wait 2 Days -> Send Reminder
```

## Why the event bus, not a new trigger mechanism

A future `LeadStatusChanged` (or `ContactCreated`) event is exactly what an Automation trigger listens for via the bus's `onEvent()` hook (already present in Phase 1, currently only used internally) -- Automation does not need its own separate "watch for changes" polling mechanism. Each automation _action_ (send WhatsApp, create task, etc.) calls the exact same service methods a human-driven UI action would call (`getProvider(channelType).send(...)`, the future Tasks service's `createTask()`), so Automation never bypasses the Service layer's RBAC/validation to take a shortcut.

## Data shapes (documented now, no tables built yet)

```ts
interface AutomationDTO {
  id: string
  workspaceId: string
  name: string
  isActive: boolean
  triggerEventType: string // matches a DomainEvent["type"], e.g. "LeadStatusChanged"
  steps: AutomationStepDTO[]
}
interface AutomationStepDTO {
  id: string
  automationId: string
  order: number
  action: 'assign_user' | 'send_message' | 'create_task' | 'wait' | 'send_reminder'
  config: Record<string, unknown> // shape depends on `action`
}
```

## Implementation checklist (when this is built)

- [ ] `automation/automation.schemas.ts` / `.dtos.ts` / `.mapper.ts` / `.repository.ts` / `.service.ts` / `.controller.ts` / `.routes.ts`
- [ ] Migrations: `automations`, `automation_steps`, `automation_runs` (execution log), RLS scoped like `contacts`
- [ ] A `automations.subscriber.ts` registered via `onEvent()`, parallel to Timeline's `activities.subscriber.ts` -- both are downstream consumers of the same bus, built independently of each other
- [ ] Long-running/delayed steps ("Wait 2 Days") need the same Queue/Worker infrastructure as `docs/modules/jobs.md`, not an in-process timer
