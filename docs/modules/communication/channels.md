# Communication: Channels (business module)

## Status

Fully implemented end to end: schema, service/repository/controller layer, and the frontend
(`src/features/communication/channels/`) -- a real `/channels` page with a WhatsApp connect/
reconnect/disconnect flow, curl- and Playwright-verified. Two onboarding paths, both kept
deliberately (not one replacing the other -- see "WhatsApp Embedded Signup" below): manual
credential entry (Phone Number ID + access token pasted into a form) and Meta's **Embedded
Signup** (a hosted Meta Login popup, no IDs or tokens to copy). Manual setup stays as the
always-available fallback -- if Meta's flow changes, has an outage, or a connection needs
debugging, manual entry is simpler to reason about and already proven.

## This is NOT the same thing as `supabase/functions/api/channels/`

There are deliberately two different things both named "channels" in this codebase:

|                 | What it is                                                                                                                                | Where it lives                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `api/channels/` | The `IChannelProvider` **plugin abstraction** -- interface + `providerRegistry` + (eventually) concrete providers like `WhatsAppProvider` | `supabase/functions/api/channels/` (cross-cutting, sibling to `controllers/` etc., not domain-nested)           |
| This module     | The **business module** -- the screen where a workspace connects/manages its own WhatsApp Business number, email sender, etc.             | `supabase/functions/api/controllers/communication/channels.*` + `src/features/communication/channels/` (both implemented) |

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
whether via manual entry or Embedded Signup, workspaces end up with their own permanent access
token + phone number ID stored in `channel_connections`. This means webhook signature verification
uses one global `WHATSAPP_APP_SECRET` / verify-token pair (Edge Function secrets, not
per-connection), and there's exactly one `/webhooks/whatsapp` URL for every workspace -- Meta's
payload carries `phone_number_id`, which is how an inbound event resolves to the right workspace
(`channel_connections.external_account_id`).

## WhatsApp Embedded Signup

Meta's hosted onboarding flow -- the workspace owner clicks **Connect with Meta**, logs into Meta in
a popup, and Chatiox automatically discovers and connects their WhatsApp Business phone number.
No Phone Number ID, WABA ID, or access token ever needs to be copied or pasted.

**Two signals, two different jobs.** Meta's popup emits a `WA_EMBEDDED_SIGNUP` `postMessage` event
on completion carrying `waba_id`/`phone_number_id` (and `waba_ids` for multi-WABA businesses) --
this is the documented, intended mechanism for a Tech Provider to learn *which* asset the customer
just granted inside Meta's own hosted UI, not something to route around. `src/lib/facebookSdk.ts`
listens for it. What still never happens is trusting that event's associated metadata (phone
number, business name, etc.) -- every candidate's actual details are fetched fresh from the Graph
API server-side, using the exchanged access token, before anything is shown or stored. (An earlier
version of this tried to independently *enumerate* businesses/WABAs from scratch via endpoints that
were never confirmed to exist and could have surfaced assets the customer never intended to
expose -- replaced with listing phone numbers under exactly the WABA id(s) the popup reported.) If
more than one phone number is found, the workspace picks which one to connect in a
Chatiox-rendered step -- the architecture already supports multiple `channel_connections` of one
channel type (Sales/Support/Marketing numbers), and onboarding reflects that rather than assuming
exactly one.

Two backend steps, split because discovery and connection are separated by a user decision
(picking a phone number) that can't happen inside a single request:

1. **`POST /channel-connections/whatsapp/embedded-signup/discover { code, wabaId?, wabaIds?, phoneNumberId? }`**
   -- exchanges the code for an access token, stashes it via the existing Vault secret-storage
   helper (`channelsRepository.storeSecret`, the same one manual entry uses) *before* any
   `channel_connections` row exists, then lists phone numbers for each reported WABA id
   (`display_phone_number`, `verified_name`, `quality_rating`, `messaging_limit_tier` per candidate,
   all from one Graph API call each). Returns `{ secretId, candidates }` -- the access token itself
   never reaches the browser, only the opaque `secretId` reference.
2. **`POST /channel-connections/whatsapp/embedded-signup/complete { secretId, wabaId, phoneNumberId }`**
   -- retrieves the stashed token server-side via `secretId`, re-fetches the *selected* candidate's
   details fresh (never trusts anything echoed back from the discover step), subscribes the app to
   that WABA's webhooks (`POST /{waba-id}/subscribed_apps` -- without this, the already-configured
   app-level webhook URL never receives events for this specific WABA), then reuses the exact same
   insert path as manual entry (`channelsRepository.createWithExistingSecret`, sharing
   `insertConnectionRow` with `create()`) with `metadata: { wabaId, displayPhoneNumber,
   verifiedName, qualityRating, messagingLimitTier, connectionMethod: 'embedded_signup' }`.

If the webhook-subscription step fails, the whole operation fails rather than creating a silently
half-working (send-only) connection -- retrying the popup is cheap.

**Frontend** (`ConnectWhatsAppEmbeddedFlow.tsx`) shows a step-by-step progress checklist (Logging
into Meta / Verifying with Meta / Discovering your WhatsApp Business accounts / Select a phone
number to connect / Subscribing to webhooks / Saving connection) rather than a single spinner, so a
failure is attributable to a specific step. `src/lib/facebookSdk.ts` lazily loads Meta's JS SDK
(only when a workspace actually clicks Connect -- not on every page load) and wraps `FB.login` with
the Embedded Signup `config_id`.

**Configuration required** (Edge Function secrets/env vars, not schema): `WHATSAPP_APP_ID` (server,
alongside the existing `WHATSAPP_APP_SECRET`), `VITE_META_APP_ID` /
`VITE_META_EMBEDDED_SIGNUP_CONFIG_ID` (frontend, non-secret) -- all set and deployed. Requires a
WhatsApp-specific Embedded Signup configuration in the Meta App Dashboard, created via **Create from
template → "WhatsApp Embedded Signup Configuration"**, not the generic "Create configuration"
builder -- the generic one only offers Pages/Instagram/Ads Accounts as asset types (no WhatsApp
Business Accounts option), because it's meant for unrelated Facebook Login for Business use cases,
not this flow. Works today for the developer's own Meta test business/WABA; onboarding an unrelated
second business additionally needs Meta Business Verification + App Review for
`whatsapp_business_management` (Advanced Access) -- an external gate, not a Chatiox limitation.

**Zero schema changes.** `channel_connections` already stored exactly what Embedded Signup
produces -- this phase only changed *how* the secret/metadata get sourced (an OAuth code exchange
plus Graph API discovery instead of a pasted value), never the storage shape itself.

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
- [x] WhatsApp Embedded Signup: discover/complete endpoints, `embeddedSignup.ts`,
      `ConnectWhatsAppEmbeddedFlow.tsx`, `facebookSdk.ts` -- manual setup kept as the permanent
      fallback path, not replaced
- [ ] Onboarding a second, unrelated business via Embedded Signup -- needs Meta Business
      Verification + App Review for `whatsapp_business_management` (Advanced Access) first;
      works today for the developer's own test business
- [ ] Email/SMS/Voice connect flows -- once their own `IChannelProvider`s exist
