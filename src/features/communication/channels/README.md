# Communication: Channels (backend implemented, no UI yet)

Full spec: [`docs/modules/communication/channels.md`](../../../../docs/modules/communication/channels.md).

Status: sidebar entry still renders `ComingSoonPage`. `channel_connections` (Vault-backed secrets,
never exposed past the repository layer) and the full CRUD service/repository/controller layer are
implemented and curl-verified. What's missing is this feature's UI (API client, hooks, a "connect
your WhatsApp number" screen) -- sequenced after the first concrete provider exists.

**Not the same thing as** `supabase/functions/api/channels/` (the `IChannelProvider` plugin abstraction) -- this is the business module (a workspace's "connect your WhatsApp number" screen) that calls into that abstraction. See the disambiguation note in `docs/architecture.md`.
