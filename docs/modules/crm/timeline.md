# CRM: Timeline

## Status

Not implemented in Phase 1. Not a nav item on its own -- Timeline is a per-contact feed, most likely surfaced as a panel on a future `ContactDetailPage` (and inside the future Inbox's conversation view, see `communication/inbox.md`), not a standalone route.

## The core idea: Activities are the stored data, Timeline is the UI

`supabase/functions/_shared/events.ts` already ships a domain event bus in Phase 1 (`emit()` / `DomainEvent` / `onEvent()`), built for Contacts and Auth. Timeline is designed to **piggyback on that bus rather than invent a second notification mechanism**.

When this is built: a single `activities.subscriber.ts` (living in `services/crm/`) calls `onEvent()` once at cold-start and maps `DomainEvent` variants into rows of a new `activities` table. No other module ever writes "into the timeline" directly, or in its own ad hoc shape -- every module only ever calls `emit()` (already the established habit from audit-log integration), and the subscriber is the _one_ place that turns events into activity rows.

"Timeline" is simply the per-contact, chronological **read view** over that contact's Activities -- it is not a second storage concept.

```
activities: id, workspace_id, contact_id, activity_type text, title, description, metadata jsonb,
            actor_user_id uuid null (null = system/automation-triggered), occurred_at, created_at
-- index: (workspace_id, contact_id, occurred_at desc)
-- activity_type is free-form text, NOT an enum and NOT FK'd to a lookup table -- same precedent as
-- audit_logs.action, because activity types grow per future module/integration, unlike the small,
-- platform-curated channel_types set.
```

Reading a contact's timeline becomes one indexed query:

```sql
select * from activities where workspace_id = $1 and contact_id = $2 order by occurred_at desc;
```

Never a live fan-out join across contacts/tasks/notes/conversations/campaign-deliveries on every page view.

## Example event -> activity mappings

Directly from the product spec:

| DomainEvent (or future addition)       | Activity type / timeline entry                                          |
| -------------------------------------- | ----------------------------------------------------------------------- |
| `ContactCreated`                       | Contact Created                                                         |
| `UserSignedUp`                         | (workspace-level, not contact-level -- not shown on a Contact timeline) |
| future `CampaignRecipientAdded`        | Campaign Sent                                                           |
| future `MessageQueued` / `MessageSent` | WhatsApp Sent / Queued                                                  |
| future `MessageDelivered`              | Delivered                                                               |
| future `MessageRead`                   | Read                                                                    |
| future `MessageFailed`                 | Failed                                                                  |
| future `MessageReplied`                | Replied                                                                 |
| future `InteractiveButtonClicked`      | Interactive Button Clicked                                              |
| future `TaskCreated`                   | Task Created                                                            |
| future `TaskCompleted`                 | Task Completed                                                          |
| future `NoteAdded`                     | Note Added                                                              |
| future `LeadStatusChanged`             | Lead Status Changed                                                     |
| future `LeadSourceUpdated`             | Lead Source Updated                                                     |
| future `ContactAssigned`               | Lead Assigned                                                           |

Example resulting feed for one contact: **Lead Created → Assigned to Rahul → WhatsApp Sent → Counseling Scheduled**.

## Why extend the bus instead of building a second mechanism

1. Every write that matters already calls `emit()` -- established by Contacts/Auth in Phase 1. A future module's checklist doesn't grow; "emit a `DomainEvent` after your write" is already the habit.
2. It keeps exactly one "something happened" concept in the codebase instead of three (audit log, activities/timeline, some ad hoc broadcaster) doing similar things in different ways.
3. It preserves the event bus's stated promise -- "swappable for a real broker later with zero call-site changes" -- Timeline's subscriber is just one more downstream consumer of `emit()`, whether the future broker ends up being Postgres LISTEN/NOTIFY, Redis Streams, or a real message queue.
4. It directly satisfies "future modules should simply append timeline entries": append one `DomainEvent` variant + one `case` in the subscriber's mapping switch. Zero new plumbing per module.

## Implementation checklist (when this is built)

- [ ] Migration: `activities` table + index, RLS scoped like `contacts` (readable by any workspace member; writes only via the subscriber, running with the same privileges as the emitting request)
- [ ] `services/crm/activities.subscriber.ts` -- registers via `onEvent()` at cold-start (called once from `index.ts`, alongside where a future channel provider would self-register)
- [ ] `crm/activities.repository.ts` -- `listForContact(workspaceId, contactId)`
- [ ] A `GET /contacts/:id/timeline` (or `/activities?contactId=...`) read endpoint
- [ ] Frontend: a `Timeline` panel component reused by both the future `ContactDetailPage` and the future Inbox conversation view
