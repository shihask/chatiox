# Telegram Provider (not yet implemented)

When built, this becomes `telegram.provider.ts`, exporting a `TelegramProvider` class that `implements IChannelProvider` (see `../../channel.types.ts`), registered via `registerProvider(new TelegramProvider(...))`. Never its own `*Service`/`*Controller`.
