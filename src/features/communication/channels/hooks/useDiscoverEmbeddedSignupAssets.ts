import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { channelsApi } from '@/api/channelsApi'
import { ApiError } from '@/api/apiClient'

export function useDiscoverEmbeddedSignupAssets() {
  return useMutation({
    mutationFn: (code: string) => channelsApi.discoverEmbeddedSignupAssets(code),
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to discover WhatsApp Business assets')
    },
  })
}
