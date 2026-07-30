import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { inboxApi } from '@/api/inboxApi'
import { ApiError } from '@/api/apiClient'

export function useUploadAttachment(conversationId: string) {
  return useMutation({
    mutationFn: (file: File) => inboxApi.uploadAttachment(conversationId, file),
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to upload attachment')
    },
  })
}
