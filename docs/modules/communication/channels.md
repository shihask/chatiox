# Communication: Channels (business module)

## Status

Not implemented in Phase 1. Real nav item (sidebar → Communication → Channels), currently rendering `ComingSoonPage`.

## This is NOT the same thing as `supabase/functions/api/channels/`

There are deliberately two different things both named "channels" in this codebase:

|                 | What it is                                                                                                                                | Where it lives                                                                                                  |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `api/channels/` | The `IChannelProvider` **plugin abstraction** -- interface + `providerRegistry` + (eventually) concrete providers like `WhatsAppProvider` | `supabase/functions/api/channels/` (cross-cutting, sibling to `controllers/` etc., not domain-nested)           |
| This module     | The **business module** -- the screen where a workspace connects/manages its own WhatsApp Business number, email sender, etc.             | `supabase/functions/api/controllers/communication/channels.*` (future) + `src/features/communication/channels/` |

This module _calls into_ the provider abstraction (e.g. to validate a WhatsApp Business API token when a workspace connects it) -- it does not implement channel-sending logic itself.

## Purpose

Let a workspace see which channels are available platform-wide (from `channel_types`, already a real table in Phase 1) and which ones it has actually connected/configured (a future `workspace_channel_connections` table: `tenant_id`, `channel_type`, connection-specific config such as a WhatsApp Business phone number ID, `is_active`).

## Data shape (documented now, no table built yet)

```ts
interface WorkspaceChannelConnectionDTO {
  id: string
  workspaceId: string
  channelType: ChannelType
  isActive: boolean
  capabilities: ChannelCapabilities // read from IChannelProvider.capabilities, not stored redundantly
  connectedAt: string | null
  // connection-specific config (e.g. WhatsApp phone number ID) shaped per channelType, not modeled generically here
}
```

## Implementation checklist (when this is built)

- [ ] A concrete provider (e.g. `WhatsAppProvider`) must exist in `api/channels/providers/whatsapp/` and be registered via `registerProvider()` before this module has anything real to configure
- [ ] Migration: `workspace_channel_connections` (or similar), RLS scoped like `contacts`, writes likely restricted to `owner`/`admin`
- [ ] `communication/channels.controller.ts` / `.service.ts` / `.repository.ts` / `.routes.ts`
- [ ] `GET /channels` could reasonably return the platform-wide `channel_types` list joined against the workspace's connections in one response
