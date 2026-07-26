import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { workspaceApi } from '@/api/workspaceApi'
import { ApiError } from '@/api/apiClient'
import { useAuth } from '@/features/auth/context/useAuth'

export function useUpdateWorkspace() {
  const auth = useAuth()

  return useMutation({
    mutationFn: (name: string) => workspaceApi.update(name),
    onSuccess: (workspace) => {
      auth.renameCurrentWorkspace(workspace.name)
      toast.success('Workspace updated')
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to update workspace')
    },
  })
}
