import type { ChannelType, IChannelProvider } from './channel.types.ts'

const registry = new Map<ChannelType, IChannelProvider>()

export function registerProvider(provider: IChannelProvider): void {
  registry.set(provider.channelType, provider)
}

/**
 * The seam business logic calls through -- real, testable code today even though no provider is
 * registered yet. Phase 1 ships no concrete providers by design (see
 * supabase/functions/api/channels/providers/*/README.md); this throws until e.g. WhatsAppProvider
 * is implemented and registered.
 */
export function getProvider(channelType: ChannelType): IChannelProvider {
  const provider = registry.get(channelType)
  if (!provider) {
    throw new Error(
      `No channel provider registered for "${channelType}" -- Phase 1 ships no concrete providers by design.`,
    )
  }
  return provider
}
