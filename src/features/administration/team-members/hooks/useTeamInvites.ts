import { useQuery } from '@tanstack/react-query'
import { teamMembersApi } from '@/api/teamMembersApi'
import { teamMembersKeys } from '@/features/administration/team-members/hooks/queryKeys'

export function useTeamInvites(enabled: boolean) {
  return useQuery({
    queryKey: teamMembersKeys.invites,
    queryFn: () => teamMembersApi.listInvites(),
    enabled,
  })
}
