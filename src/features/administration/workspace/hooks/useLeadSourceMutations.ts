import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { workspaceApi } from '@/api/workspaceApi'
import { ApiError } from '@/api/apiClient'
import { leadSourcesKeys } from '@/features/crm/contacts/hooks/queryKeys'
import { analyticsKeys } from '@/features/analytics/hooks/queryKeys'

function useInvalidateLeadLists() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: leadSourcesKeys.all }),
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all }),
    ])
}

export function useCreateLeadSource() {
  const invalidate = useInvalidateLeadLists()
  return useMutation({
    mutationFn: (name: string) => workspaceApi.createLeadSource(name),
    onSuccess: async () => {
      await invalidate()
      toast.success('Lead source added')
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to add lead source')
    },
  })
}

export function useUpdateLeadSource() {
  const invalidate = useInvalidateLeadLists()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => workspaceApi.updateLeadSource(id, name),
    onSuccess: async () => {
      await invalidate()
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to update lead source')
    },
  })
}

export function useDeleteLeadSource() {
  const invalidate = useInvalidateLeadLists()
  return useMutation({
    mutationFn: (id: string) => workspaceApi.removeLeadSource(id),
    onSuccess: async () => {
      await invalidate()
      toast.success('Lead source removed')
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to remove lead source')
    },
  })
}
