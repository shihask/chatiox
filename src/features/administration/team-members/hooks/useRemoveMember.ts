import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { teamMembersApi } from '@/api/teamMembersApi'
import { ApiError } from '@/api/apiClient'
import { teamMembersKeys } from '@/features/administration/team-members/hooks/queryKeys'

export function useRemoveMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => teamMembersApi.removeMember(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: teamMembersKeys.members })
      toast.success('Member removed')
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to remove member')
    },
  })
}
