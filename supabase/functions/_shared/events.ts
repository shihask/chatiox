// Domain event bus -- console-log-backed today, swappable for a real broker later with zero
// call-site changes (see docs/architecture.md §5). onEvent() exists from Phase 1 onward so a
// future consumer (Timeline, Automation) can subscribe without any emitting module changing.
export type DomainEvent =
  | { type: 'ContactCreated'; workspaceId: string; contactId: string; actorUserId: string; occurredAt: string }
  | {
      type: 'ContactUpdated'
      workspaceId: string
      contactId: string
      actorUserId: string
      changedFields: string[]
      occurredAt: string
    }
  | { type: 'ContactDeleted'; workspaceId: string; contactId: string; actorUserId: string; occurredAt: string }
  | { type: 'UserSignedUp'; workspaceId: string; userId: string; email: string; occurredAt: string }
  | {
      type: 'NoteCreated'
      workspaceId: string
      contactId: string
      noteId: string
      actorUserId: string
      occurredAt: string
    }
  | {
      type: 'TaskCreated'
      workspaceId: string
      contactId: string
      taskId: string
      actorUserId: string
      occurredAt: string
    }
  | {
      type: 'TaskCompleted'
      workspaceId: string
      contactId: string
      taskId: string
      actorUserId: string
      occurredAt: string
    }
// Pattern to extend once a module is built -- do not pre-add LeadStatusChanged/MessageDelivered/etc. now.

type EventListener = (event: DomainEvent) => void | Promise<void>

const listeners: EventListener[] = []

/** Registers a listener. Unused in Phase 1 -- reserved for the future Timeline/Automation subscribers. */
export function onEvent(listener: EventListener): void {
  listeners.push(listener)
}

export function emit(event: DomainEvent): void {
  console.log(`[event] ${event.type}`, JSON.stringify(event))
  for (const listener of listeners) {
    try {
      const result = listener(event)
      if (result instanceof Promise) {
        result.catch((err: unknown) => console.error('[event-listener-failed]', event.type, err))
      }
    } catch (err) {
      console.error('[event-listener-failed]', event.type, err)
    }
  }
  // Swapping this for Redis/Kafka/RabbitMQ later only touches this function's internals -- callers never change.
}
