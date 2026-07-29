# Communication: Channels (business module)

## Status

Fully implemented end to end: schema, service/repository/controller layer, and the frontend
(`src/features/communication/channels/`) -- a real `/channels` page with a WhatsApp connect/
reconnect/disconnect flow, curl- and Playwright-verified. Manual credential entry (Phone Number ID +
access token, pasted into a form) rather than OAuth -- see "Embedded Signup" below for why that's a
deliberately separate, later phase rather than built alongside this pass.

## This is NOT the same thing as `supabase/functions/api/channels/`

There are deliberately two different things both named "channels" in this codebase:

|                 | What it is                                                                                                                                | Where it lives                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `api/channels/` | The `IChannelProvider` **plugin abstraction** -- interface + `providerRegistry` + (eventually) concrete providers like `WhatsAppProvider` | `supabase/functions/api/channels/` (cross-cutting, sibling to `controllers/` etc., not domain-nested)           |
| This module     | The **business module** -- the screen where a workspace connects/manages its own WhatsApp Business number, email sender, etc.             | `supabase/functions/api/controllers/communication/channels.*` (implemented) + `src/features/communication/channels/` (not yet) |

This module _calls into_ the provider abstraction (e.g. to validate a WhatsApp Business API token
when a workspace connects it) -- it does not implement channel-sending logic itself.

## "Channel" vs "Connection"

`channel_types` (Phase 1, global/platform-curated -- "WhatsApp" as a concept, same row for every
workspace) is the **Channel**. `channel_connections` (this module, per-workspace) is the
**Connection** -- a specific connected account. A workspace can have multiple connections of the
same channel type (e.g. three `channel_connections` rows all with `channel_type='whatsapp'`: a
Sales number, a Support number, a Marketing number) -- the schema already supports this today.

## Purpose

Let a workspace see which channels are available platform-wide (`channel_types`) and which ones it
has actually connected/configured (`channel_connections`: `tenant_id`, `channel_type`,
`display_name`, `external_account_id`, connection-specific non-secret `metadata`, and a `secret_id`
pointer -- never the secret itself).

## Secrets: Supabase Vault, not a plain column

`channel_connections.secret_id` references a Supabase Vault secret (`vault.secrets`,
pgsodium-backed). The decrypted value only ever materializes inside `vault.decrypted_secrets`, a
view Supabase restricts to the `service_role` by default -- not just an RLS policy choice,
architecturally unreachable by `anon`/`authenticated` at all. Since `vault` isn't exposed via
PostgREST, three `SECURITY DEFINER` wrapper functions in `public`
(`channel_connection_set_secret`/`_update_secret`/`_get_secret`, granted only to `service_role`)
bridge the gap -- see `supabase/migrations/20260801000006_create_vault_secret_helpers.sql`. The only
place a decrypted secret ever materializes in application code is
`channels.repository.ts`'s `resolveForSending()`, called by `inboxService.sendMessage` right before
invoking a provider, never exposed via any DTO.

A simpler RLS-restricted-`jsonb`-column approach was considered and deliberately rejected: even
restricted to `owner`/`admin`, a plain column is one bug away from leaking in a DTO, whereas Vault
makes that class of bug structurally impossible. If Vault ever becomes a limiting factor, an
external KMS is the next escalation -- not a plain column.

## One Meta App for the whole platform (current model)

Every workspace's WhatsApp number connects under Chatiox's own single registered Meta App --
workspaces paste their own permanent access token + phone number ID into this module's future
connect screen. This means webhook signature verification uses one global `WHATSAPP_APP_SECRET` /
verify-token pair (Edge Function secrets, not per-connection), and there's exactly one
`/webhooks/whatsapp` URL for every workspace -- Meta's payload carries `phone_number_id`, which is
how an inbound event resolves to the right workspace (`channel_connections.external_account_id`).
**Embedded Signup** (OAuth-based, no manual token paste) is a documented future upgrade, not built now.

## Future phase: WhatsApp Embedded Signup

The manual-entry form (Phone Number ID + WABA ID + access token, pasted by the workspace owner) is
correct for now but not the end state -- Meta's **Embedded Signup** flow (a Facebook Login popup:
"Connect WhatsApp" → Meta Login → grant permission → Chatiox receives a code, exchanges it
server-side for a long-lived token, and stores WABA ID/Phone Number ID/token exactly the same way
the manual form does today) is the eventual replacement, matching how Slack/Google-style
integrations work.

**Deliberately not built alongside this pass**, for two concrete reasons:
1. It requires **Meta App Review** (for `whatsapp_business_management`/`whatsapp_business_messaging`
   on behalf of other businesses) and **Business Verification** -- an external, days-to-weeks
   approval process, not something buildable-and-provable in one sitting the way the rest of this
   backend was.
2. It isn't needed yet -- there is exactly one real workspace connecting exactly one real number
   today (the developer's own test setup). Embedded Signup earns its cost when a second real
   customer needs to bring their own WhatsApp number; building it speculatively ahead of that
   violates this project's own "don't build ahead of concrete need" discipline.

**What doesn't change when this eventually gets built**: the same `POST /channel-connections`
endpoint, the same `channel_connections` schema (Vault-backed secret, `external_account_id`,
`metadata`), and the same `ConnectWhatsAppDialog`-shaped UI slot -- Embedded Signup only changes
*how* the access token gets into that same shape (an OAuth code-exchange step instead of a pasted
value), not the shape itself. This is the same "freeze the backend, evolve the frontend/providers"
discipline the rest of Phase 2 has followed.

## Data shape (implemented -- see supabase/functions/api/dtos/communication/channels.dtos.ts)

```ts
interface ChannelConnectionDTO {
  id: string
  workspaceId: string
  channelType: ChannelType
  displayName: string
  externalAccountId: string | null
  metadata: Record<string, unknown> // non-secret config only
  status: 'connected' | 'disconnected' | 'error'
  lastError: string | null
  connectedBy: string | null
}
```

## Implementation checklist

- [x] A concrete provider (`MetaWhatsAppProvider`) exists in `api/channels/providers/whatsapp/` and
      is registered via `registerProvider()`
- [x] Migration: `channel_connections`, Vault-backed, RLS restricted to `owner`/`admin`
- [x] `communication/channels.controller.ts` / `.service.ts` / `.repository.ts` / `.routes.ts`
- [x] `GET /channel-connections` returns the workspace's connections (credentials always redacted)
- [x] Frontend: `ChannelsPage` (WhatsApp connect/reconnect/disconnect; Email/SMS/Voice shown as
      "coming soon" since no concrete provider exists for them yet)
- [ ] WhatsApp Embedded Signup (see above) -- future phase, needs Meta App Review + Business
      Verification first
- [ ] Email/SMS/Voice connect flows -- once their own `IChannelProvider`s exist
