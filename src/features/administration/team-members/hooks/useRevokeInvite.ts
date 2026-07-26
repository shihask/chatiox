import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { teamMembersApi } from '@/api/teamMembersApi'
import { ApiError } from '@/api/apiClient'
import { teamMembersKeys } from '@/features/administration/team-members/hooks/queryKeys'

export function useRevokeInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => teamMembersApi.revokeInvite(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: teamMembersKeys.invites })
      toast.success('Invite revoked')
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to revoke invite')
    },
  })
}
