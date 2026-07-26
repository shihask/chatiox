import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { workspaceApi, type CreateLeadStatusInput, type UpdateLeadStatusInput } from '@/api/workspaceApi'
import { ApiError } from '@/api/apiClient'
import { leadStatusesKeys } from '@/features/crm/contacts/hooks/queryKeys'
import { analyticsKeys } from '@/features/analytics/hooks/queryKeys'

function useInvalidateLeadLists() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: leadStatusesKeys.all }),
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all }),
    ])
}

export function useCreateLeadStatus() {
  const invalidate = useInvalidateLeadLists()
  return useMutation({
    mutationFn: (input: CreateLeadStatusInput) => workspaceApi.createLeadStatus(input),
    onSuccess: async () => {
      await invalidate()
      toast.success('Lead status added')
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to add lead status')
    },
  })
}

export function useUpdateLeadStatus() {
  const invalidate = useInvalidateLeadLists()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateLeadStatusInput }) =>
      workspaceApi.updateLeadStatus(id, input),
    onSuccess: async () => {
      await invalidate()
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to update lead status')
    },
  })
}

export function useDeleteLeadStatus() {
  const invalidate = useInvalidateLeadLists()
  return useMutation({
    mutationFn: (id: string) => workspaceApi.removeLeadStatus(id),
    onSuccess: async () => {
      await invalidate()
      toast.success('Lead status removed')
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to remove lead status')
    },
  })
}
