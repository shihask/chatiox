import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { teamMembersApi } from '@/api/teamMembersApi'
import { ApiError } from '@/api/apiClient'
import { teamMembersKeys } from '@/features/administration/team-members/hooks/queryKeys'
import type { CreateInviteDTO } from '@/features/administration/team-members/types/team-member.types'

export function useCreateInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateInviteDTO) => teamMembersApi.createInvite(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: teamMembersKeys.invites })
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to create invite')
    },
  })
}
