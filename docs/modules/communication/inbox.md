# Communication: Inbox

## Status

Fully implemented end to end: schema, service/repository/controller layer, and the frontend
(`src/features/communication/inbox/`) -- a real `/inbox` two-pane page (conversation list +
thread view), curl- and Playwright-verified. Conversation list filters (status tabs, Unassigned,
My conversations), thread view with per-message delivery status, a composer, assignment, and
contact linking (existing contact search or create-new) are all real and wired to the endpoints
this module already had. Conversation-scoped internal notes (`conversation_notes`) are schema/API-
complete but have no UI yet -- deliberately deferred, not part of this pass's explicit scope.
Real-time updates are a simple `refetchInterval` poll (~5s) for now; a genuine Supabase Realtime
subscription is a separate, later roadmap item.

## Model

```
Conversation -> Messages -> Attachments -> Events
```

Where `Events` are conversation-lifecycle records (assignment, status change, reopen, contact
linking) -- distinct from chat `Messages`, which carry `Attachments`. A conversation also has its
own `conversation_notes` (an internal note scoped to *this* thread specifically, distinct from the
contact-level `notes` table which persists across all of a contact's conversations).

## Conversations don't require a Contact -- the Unassigned inbox

A `conversations` row FKs to `channel_identities` (a channel address -- phone number, email, IG
handle -- tracked from first contact), not to `contacts` directly. `channel_identities.contact_id`
and the denormalized `conversations.contact_id` are both nullable: a message from an unrecognized
number creates the conversation with `contact_id = null`, and it shows up in `GET
/conversations?unassigned=true` for an agent to triage (Intercom/Zendesk-style), rather than
auto-creating a Contact for every spam/wrong-number/bot message. From there an agent can:

- `PATCH /conversations/:id/link-contact { contactId }` -- link to an existing Contact
- `POST /conversations/:id/create-contact { firstName, lastName? }` -- create a new Contact seeded
  with this identity's channel value, then link

Both paths also ensure a matching `contact_channels` row exists (creating one if missing), so
Contacts search/forms immediately see the identity too -- `contact_channels` (Phase 1) stays the
single source of truth; `channel_identities` is additive, not a replacement.

## Conversations don't force one thread forever

`conversations` has a partial unique index on `(tenant_id, channel_identity_id) where status <>
'closed'` -- at most one *live* conversation per identity at a time (no fragmentation while a
conversation is open/pending), but closing one frees the identity for a genuinely new conversation
row on the next inbound message, rather than reopening the same thread indefinitely. A
`provider_thread_id` column is reserved for channels with their own native thread concept
(Instagram/Messenger).

## Communication depends on CRM, never the reverse

"Communication is a capability of the CRM, not the other way around." Opening a conversation
composes CRM context rather than owning any denormalized copy of it -- `inboxService.
getConversationDetail()` resolves `conversation.contactId` first (if linked), then fans out to the
*existing* `contactsRepository`/`notesRepository`/`tasksRepository`:

```ts
interface ConversationDetailDTO {
  conversation: ConversationDTO
  contact: ContactDTO | null       // null for unassigned conversations
  notes: NoteDTO[]                 // contact-level notes, existing feature
  openTasks: TaskDTO[]             // contact-level tasks, existing feature
  conversationNotes: ConversationNoteDTO[]  // conversation-scoped, new
}
```

## Message status tracking feeds both Inbox and Timeline

Every channel reports message status through the same lifecycle: `queued -> sent -> delivered ->
read -> failed`. Each transition is appended to `message_status_events` (an audit trail, not just a
single mutable column); `messages.status` stays a denormalized "current status" advanced only
forward by the Service layer (`inboxService.ingestInboundEvent`'s status-update branch), never a
trigger. These statuses render inside the conversation view **and** become granular domain events
(`MessageDelivered`/`MessageRead`/`MessageFailed`, distinct types rather than one lumped status
event -- see `_shared/events.ts`) which will feed the Contact Timeline via the same event bus (see
`crm/timeline.md`) once that subscriber exists -- Inbox does not maintain its own separate activity
feed.

## Data shapes (implemented -- see supabase/functions/api/dtos/communication/inbox.dtos.ts)

```ts
interface ConversationDTO {
  id: string
  workspaceId: string
  channelIdentityId: string
  channelIdentityValue: string
  contactId: string | null
  contact: { id: string; firstName: string; lastName: string | null } | null
  channelConnectionId: string
  channelType: ChannelType
  providerThreadId: string | null
  status: 'open' | 'pending' | 'closed'
  tags: string[]
  assignedToUserId: string | null
  lastMessageAt: string | null
  lastMessagePreview: string | null
  unreadCount: number
}
interface MessageDTO {
  id: string
  conversationId: string
  direction: 'inbound' | 'outbound'
  messageType: 'text' | 'template' | 'media' | 'interactive' | 'system'
  body: string | null
  providerMessageId: string | null
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'received'
  attachments: MessageAttachmentDTO[]
  sentByUserId: string | null
}
interface ConversationEventDTO {
  id: string
  conversationId: string
  eventType: string // free text at the DB level (same precedent as audit_logs.action); a
                     // companion TS const union (CONVERSATION_EVENT_TYPES) gives type safety
  actorUserId: string | null
  metadata: Record<string, unknown>
}
```

## Implementation checklist

- [x] Migrations: `conversations`, `conversation_participants`, `conversation_events`,
      `conversation_notes`, `messages`, `message_status_events`, `message_attachments`,
      `message_reactions` (schema-only, no endpoints yet) -- all RLS-scoped like `contacts`
- [x] `communication/inbox.controller.ts` / `.service.ts` / `.repository.ts` / `.routes.ts`,
      registered into `router.ts`
- [x] Ownership history: every assignment change (including reassignment) writes an `assigned`
      conversation_event with `{fromUserId, toUserId}` -- this *is* the audit trail, no separate table
- [x] A concrete `IChannelProvider` (`MetaWhatsAppProvider`, see
      `supabase/functions/api/channels/providers/whatsapp/`) -- Inbox reads/writes go through
      `getProvider(channelType)`, never a hardcoded WhatsApp call
- [x] Webhook receipt (`/webhooks/:channelType`, the `'webhook'` route tier) is what populates
      inbound messages -- not a polling loop; generic across every channel type by design
- [x] Frontend: API client, hooks, `InboxPage` (conversation list, thread view, composer,
      assignment, contact linking)
- [ ] Conversation-scoped notes UI (`conversation_notes` -- backend already supports this;
      deferred, not part of this pass's explicit scope)
- [ ] Real Supabase Realtime subscriptions (currently a ~5s poll via `refetchInterval`)

## Explicitly deferred (documented, not built)

- A separate **workflow status** (waiting-for-customer/waiting-for-agent/snoozed/archived) distinct
  from the lifecycle `status` column -- additive migration later, once support workflows are
  actually being designed.
- **Draft messages** -- a `messages` row with a `draft` status is a natural, non-breaking extension
  of the existing `status` check constraint later.
- **Multi-agent watchers** -- `conversation_participants` already supports this shape, but no
  dedicated endpoints/UI exist this pass (single `assigned_to_user_id` is all the Service layer
  exposes today).
