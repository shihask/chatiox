import { useQuery } from '@tanstack/react-query'
import { teamMembersApi } from '@/api/teamMembersApi'

export function useInvitePreview(token: string | null) {
  return useQuery({
    queryKey: ['invite-preview', token],
    queryFn: () => teamMembersApi.previewInvite(token ?? ''),
    enabled: Boolean(token),
    retry: false,
  })
}
