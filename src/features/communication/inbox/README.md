# Communication: Inbox (backend implemented, no UI yet)

Full spec: [`docs/modules/communication/inbox.md`](../../../../docs/modules/communication/inbox.md).

Status: sidebar entry still renders `ComingSoonPage`. The schema, `IChannelProvider` interface, and
the full `inbox.*` service/repository/controller layer are implemented and curl-verified end to end
(conversations, messages, the Unassigned-inbox contact-linking flow, conversation notes). What's
missing is a concrete `IChannelProvider` (see `supabase/functions/api/channels/providers/`) and this
feature's UI (API client, hooks, pages) -- both deliberately sequenced after the first provider
(WhatsApp) exists, so there's something real to send/receive through and display.
