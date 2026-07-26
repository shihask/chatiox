import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { teamMembersApi } from '@/api/teamMembersApi'
import { ApiError } from '@/api/apiClient'
import { teamMembersKeys } from '@/features/administration/team-members/hooks/queryKeys'
import type { WorkspaceRole } from '@/features/administration/team-members/types/team-member.types'

export function useUpdateMemberRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: WorkspaceRole }) =>
      teamMembersApi.updateMemberRole(userId, { role }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: teamMembersKeys.members })
      toast.success('Role updated')
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to update role')
    },
  })
}
