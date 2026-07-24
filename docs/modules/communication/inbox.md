# Communication: Inbox

## Status

Not implemented in Phase 1. Real nav item (sidebar → Communication → Inbox), currently rendering `ComingSoonPage`.

## Model

```
Conversation -> Messages -> Attachments -> Events
```

Where `Events` are conversation-lifecycle records (assignment, status change, internal note-on-conversation) -- distinct from chat `Messages`, which carry `Attachments`.

## Communication depends on CRM, never the reverse

"Communication is a capability of the CRM, not the other way around." Opening a conversation composes CRM context rather than owning any denormalized copy of it:

- The **Contact** + its `contact_channels` (all known channels for that person, not just the one they messaged on) -- via the existing `ContactsRepository`.
- The Contact's current **Lead Status** (+ **Assigned User**) -- already present on `ContactDTO` in Phase 1.
- The Contact's recent **Notes** and open **Tasks** -- via the future `notes`/`tasks` repositories (see `crm/notes.md`, `crm/tasks.md`).
- The Contact's **Timeline** feed -- via the future `activities` table (see `crm/timeline.md`).

```ts
interface ConversationDetailDTO {
  conversation: ConversationDTO
  contact: ContactDTO
  notes: NoteDTO[]
  openTasks: TaskDTO[]
  timeline: TimelineEventDTO[]
}
```

Architecturally this is `InboxService.getConversationContext(workspaceId, conversationId)` resolving `conversation.contactId` first, then fanning out to CRM's repositories -- a normal cross-domain Service-calls-Repository composition, never a denormalized copy sitting inside Communication's own tables. This is the same non-duplication principle already applied to Contacts throughout Phase 1.

## WhatsApp message tracking feeds both Inbox and Timeline

WhatsApp (and every future channel) reports message status through the same lifecycle: `queued -> sent -> delivered -> read -> failed / replied`, plus interactive button responses. These statuses render inside the conversation view **and** become Contact Timeline entries via the same event bus (see `crm/timeline.md`) -- Inbox does not maintain its own separate activity feed.

## Data shapes (documented now, no tables built yet)

```ts
interface ConversationDTO {
  id: string
  workspaceId: string
  contactId: string
  channelType: ChannelType
  status: 'open' | 'pending' | 'closed'
  assignedToUserId: string | null
  lastMessageAt: string | null
}
interface InboxMessageDTO {
  id: string
  conversationId: string
  direction: 'inbound' | 'outbound'
  body: string | null
  attachments: AttachmentDTO[]
  sentByUserId: string | null
  providerMessageId: string | null
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed'
  createdAt: string
}
interface AttachmentDTO {
  id: string
  messageId: string
  mediaUrl: string
  mimeType: string
  fileName: string | null
}
interface ConversationEventDTO {
  id: string
  conversationId: string
  type: 'assigned' | 'status_changed' | 'note_added' | 'reopened'
  actorUserId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}
```

## Implementation checklist (when this is built)

- [ ] Migrations: `conversations`, `messages`, `message_attachments`, `conversation_events`, all RLS-scoped like `contacts`
- [ ] A concrete `IChannelProvider` (e.g. `WhatsAppProvider`, see `supabase/functions/api/channels/providers/whatsapp/`) must exist first -- Inbox reads/writes go through `getProvider(channelType)`, never a hardcoded WhatsApp call
- [ ] `communication/inbox.controller.ts` / `.service.ts` / `.repository.ts` / `.routes.ts`, registered into `router.ts`
- [ ] Webhook receipt (`/webhooks/whatsapp`, the reserved fourth "webhook" tier, see `docs/architecture.md`) is what actually populates inbound messages -- not a polling loop
