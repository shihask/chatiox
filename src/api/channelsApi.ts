import { apiClient } from '@/api/apiClient'
import type {
  ChannelConnectionDTO,
  CreateConnectionDTO,
  UpdateConnectionDTO,
} from '@/features/communication/channels/types/channel.types'

export const channelsApi = {
  list: () => apiClient.get<ChannelConnectionDTO[]>('/channel-connections'),
  create: (input: CreateConnectionDTO) => apiClient.post<ChannelConnectionDTO>('/channel-connections', input),
  update: (id: string, input: UpdateConnectionDTO) =>
    apiClient.patch<ChannelConnectionDTO>(`/channel-connections/${id}`, input),
}
