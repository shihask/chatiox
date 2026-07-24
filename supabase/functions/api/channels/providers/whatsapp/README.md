# WhatsApp Provider (not yet implemented)

When built, this file becomes `whatsapp.provider.ts`, exporting a `WhatsAppProvider` class that `implements IChannelProvider` (see `../../channel.types.ts`) and is registered once via `registerProvider(new WhatsAppProvider(...))` in `supabase/functions/api/channels/index.ts` (or wherever provider bootstrap happens, alongside `index.ts`'s startup).

Nothing outside `api/channels/` may import this class directly -- every caller resolves it through `getProvider("whatsapp")`.

Inbound webhooks land at the reserved `/webhooks/whatsapp` route (a fourth, signature-verified router tier -- see `docs/architecture.md` and `router.ts`'s reserved-tier note), not through `withAuthenticatedHttp`/`withWorkspaceHttp`.
