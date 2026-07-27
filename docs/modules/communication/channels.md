# Communication: Channels (business module)

## Status

Schema and the full CRUD service/repository/controller layer are implemented and curl-verified.
Sidebar entry still renders `ComingSoonPage` -- blocked on the frontend (API client, hooks, a
"connect your WhatsApp number" screen), sequenced after the first concrete provider exists.

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

- [x] A concrete provider (e.g. `WhatsAppProvider`) must exist in `api/channels/providers/whatsapp/`
      and be registered via `registerProvider()` before this module has anything real to configure
      -- **still the remaining gap**
- [x] Migration: `channel_connections`, Vault-backed, RLS restricted to `owner`/`admin`
- [x] `communication/channels.controller.ts` / `.service.ts` / `.repository.ts` / `.routes.ts`
- [x] `GET /channel-connections` returns the workspace's connections (credentials always redacted)
- [ ] Frontend: connect-a-channel UI, sequenced after the first provider exists
