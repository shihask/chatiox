# Email Provider (not yet implemented)

When built, this becomes `email.provider.ts`, exporting an `EmailProvider` class that `implements IChannelProvider` (see `../../channel.types.ts`), registered via `registerProvider(new EmailProvider(...))`. Never its own `*Service`/`*Controller` -- a provider's entire footprint is the class + its registration.
