import { apiClient } from '@/api/apiClient'
import type {
  LoginRequestDTO,
  MeDTO,
  SessionDTO,
  SignupRequestDTO,
} from '@/features/auth/types/auth.types'

export const authApi = {
  signup: (input: SignupRequestDTO) => apiClient.post<SessionDTO>('/auth/signup', input),
  login: (input: LoginRequestDTO) => apiClient.post<SessionDTO>('/auth/login', input),
  refresh: (refreshToken: string) => apiClient.post<SessionDTO>('/auth/refresh', { refreshToken }),
  me: () => apiClient.get<MeDTO>('/auth/me'),
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },
}
