# SMS Provider (not yet implemented)

When built, this becomes `sms.provider.ts`, exporting an `SmsProvider` class that `implements IChannelProvider` (see `../../channel.types.ts`), registered via `registerProvider(new SmsProvider(...))`. Never its own `*Service`/`*Controller`.
