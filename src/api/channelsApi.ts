import { apiClient } from '@/api/apiClient'
import type {
  ChannelConnectionDTO,
  CreateConnectionDTO,
  EmbeddedSignupDiscoveryDTO,
  UpdateConnectionDTO,
} from '@/features/communication/channels/types/channel.types'

export const channelsApi = {
  list: () => apiClient.get<ChannelConnectionDTO[]>('/channel-connections'),
  create: (input: CreateConnectionDTO) => apiClient.post<ChannelConnectionDTO>('/channel-connections', input),
  update: (id: string, input: UpdateConnectionDTO) =>
    apiClient.patch<ChannelConnectionDTO>(`/channel-connections/${id}`, input),

  discoverEmbeddedSignupAssets: (code: string) =>
    apiClient.post<EmbeddedSignupDiscoveryDTO>('/channel-connections/whatsapp/embedded-signup/discover', { code }),
  completeEmbeddedSignup: (secretId: string, wabaId: string, phoneNumberId: string) =>
    apiClient.post<ChannelConnectionDTO>('/channel-connections/whatsapp/embedded-signup/complete', {
      secretId,
      wabaId,
      phoneNumberId,
    }),
}
