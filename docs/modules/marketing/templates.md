# Marketing: Templates

## Status

Fully implemented end to end: schema, service/repository/controller layer, `IChannelProvider`
template methods, and the frontend (`src/features/marketing/templates/`) -- a real `/templates`
page, plus a "Send Template" affordance in the Inbox composer. Curl- and Playwright-verified.

## Model

```
Template -> ChannelTemplate
```

Never `WhatsAppTemplate`. One channel-agnostic `Template` (e.g. "Welcome Message" -- just a
name/purpose) has N per-channel-type `ChannelTemplate` variants -- a WhatsApp-approved body differs
from an SMS plain-text body differs from an Email HTML body, but they represent "the same
template." A future Campaign references a `Template`, and at send time resolves the right
`ChannelTemplate` for whichever channel it's sending through.

## Syncing from the provider, not authoring in Chatiox

WhatsApp template *approval* fundamentally happens in Meta Business Manager, not in Chatiox --
`channel_templates` stays read/sync only. **"Sync from WhatsApp"** (Templates page, or per the
implementation, any connected WhatsApp connection) calls
`IChannelProvider.listApprovedTemplates()` (new, optional interface method -- Email/SMS providers
without an equivalent concept simply won't implement it), which for WhatsApp hits Meta's real
`GET /{waba-id}/message_templates` and returns each template's name, language, status, category,
and body text. Syncing:

1. Auto-matches (case-insensitive name) or creates the parent business `templates` row -- no need
   to manually pre-create one row per Meta template first.
2. Upserts the `channel_templates` row, keyed by the existing unique constraint
   `(tenant_id, channel_connection_id, provider_template_name, language_code)` -- re-syncing
   updates status/body/variables in place rather than duplicating rows.

**Variables are positional, not named.** WhatsApp's standard template system has no semantic
variable names, only `{{1}}`, `{{2}}` placeholders in the approved body text -- `variables` is
derived by counting distinct `{{n}}` occurrences via regex, stored as `["1", "2", ...]`. (An
earlier draft of this doc showed a named example, `["first_name", "course_name"]` -- corrected;
Meta's API has no such metadata to sync.)

## Sending a template message

`POST /conversations/:id/messages { template: { name, languageCode, variables: string[] } }` (the
same endpoint free-text replies already use). Before anything reaches Meta,
`inboxService.sendMessage`:

1. Looks up the matching `channel_templates` row by `(channelConnectionId, name, languageCode)` --
   404 if not found, 409 if not `status: 'approved'`. A template send never proceeds on trust alone.
2. Calls `provider.validateTemplate()` (structural variable-count check).
3. Renders a human-readable `body` for the `messages` row by substituting `{{n}}` with the actual
   supplied variables, so the Inbox thread shows real text instead of a blank/null body for
   template messages.

`MetaWhatsAppProvider.send()`'s template branch (`MetaGraphClient.sendTemplate()`) follows the
same graceful-failure pattern the text-send path already had: a Meta rejection becomes a stored
`status: 'failed'` message with Meta's real error text, never an uncaught exception.

## Frontend

- **`TemplatesPage`** (`/templates`): lists business templates as cards, each showing its synced
  channel-template variants (channel, language, status badge, body preview); "Sync from WhatsApp"
  (shown when a WhatsApp connection is connected); "New Template" dialog (name + purpose only --
  the approved WhatsApp variant still has to exist in Meta Business Manager first, then gets pulled
  in by syncing).
- **`SendTemplateDialog`** (Inbox): a small template icon button next to the composer opens a
  picker limited to `status: 'approved'` channel templates for the open conversation's connection,
  renders one input per positional variable, and sends via the existing message-send endpoint.
  Available regardless of the 24-hour customer care window (it's the correct tool precisely when
  outside it, but also valid inside it).

## Data shapes (implemented -- see supabase/functions/api/dtos/communication/templates.dtos.ts)

```ts
interface TemplateDTO {
  id: string
  workspaceId: string
  name: string
  purpose: string | null
  createdBy: string | null
}
interface ChannelTemplateDTO {
  id: string
  workspaceId: string
  templateId: string
  channelConnectionId: string
  channelType: ChannelType
  providerTemplateName: string // e.g. a WhatsApp-approved template name
  languageCode: string
  body: string | null
  variables: unknown[] // positional -- e.g. ["1", "2"], never semantic names
  status: 'pending' | 'approved' | 'rejected'
  providerTemplateId: string | null
}
```

## Implementation checklist

- [x] Migrations: `templates`, `channel_templates`, RLS scoped like `contacts`
- [x] `GET/POST /templates`, `DELETE /templates/:id`, `GET /templates/:id/channel-templates`
- [x] `GET /channel-connections/:id/channel-templates`, `POST /channel-connections/:id/sync-templates`
- [x] `IChannelProvider.listApprovedTemplates?()` (optional), `MetaWhatsAppProvider` real
      implementation; `MetaGraphClient.sendTemplate()` / `.listApprovedTemplates()`
- [x] `inboxService.sendMessage` resolves + validates the template before sending, renders a
      human-readable body for the stored message
- [x] Frontend: `TemplatesPage`, `CreateTemplateDialog`, `SendTemplateDialog` (Inbox composer)
- [ ] Campaign send logic (future) resolves `channel_templates` by `(templateId, channelType)` at
      send time -- never duplicates template content into a campaign row
