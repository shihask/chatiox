import { useQuery } from '@tanstack/react-query'
import { channelsApi } from '@/api/channelsApi'
import { channelConnectionsKeys } from '@/features/communication/channels/hooks/queryKeys'

export function useChannelConnections() {
  return useQuery({
    queryKey: channelConnectionsKeys.all,
    queryFn: () => channelsApi.list(),
  })
}
