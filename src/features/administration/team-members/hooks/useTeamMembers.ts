import { useQuery } from '@tanstack/react-query'
import { teamMembersApi } from '@/api/teamMembersApi'
import { teamMembersKeys } from '@/features/administration/team-members/hooks/queryKeys'

export function useTeamMembers() {
  return useQuery({
    queryKey: teamMembersKeys.members,
    queryFn: () => teamMembersApi.listMembers(),
  })
}
