import {
  ACCESS_TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  WORKSPACE_STORAGE_KEY,
} from '@/lib/constants'

export const tokenStorage = {
  getAccessToken: (): string | null => localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY),
  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY),
  getCurrentWorkspaceId: (): string | null => localStorage.getItem(WORKSPACE_STORAGE_KEY),

  setSession: (input: { accessToken: string; refreshToken: string }): void => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, input.accessToken)
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, input.refreshToken)
  },
  setCurrentWorkspaceId: (workspaceId: string): void => {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId)
  },
  clear: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
    localStorage.removeItem(WORKSPACE_STORAGE_KEY)
  },
}
