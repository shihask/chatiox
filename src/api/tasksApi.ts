import { apiClient } from '@/api/apiClient'
import type {
  CreateTaskDTO,
  ListTasksParams,
  TaskDTO,
  UpdateTaskDTO,
} from '@/features/crm/tasks/types/task.types'

export const tasksApi = {
  listByContact: (contactId: string) => apiClient.get<TaskDTO[]>(`/contacts/${contactId}/tasks`),
  createForContact: (contactId: string, input: CreateTaskDTO) =>
    apiClient.post<TaskDTO>(`/contacts/${contactId}/tasks`, input),

  list: (params: ListTasksParams) =>
    apiClient.getPaginated<TaskDTO>('/tasks', {
      page: params.page,
      pageSize: params.pageSize,
      status: params.status,
      assignedToUserId: params.assignedToUserId,
      contactId: params.contactId,
    }),
  update: (id: string, input: UpdateTaskDTO) => apiClient.patch<TaskDTO>(`/tasks/${id}`, input),
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`)
  },
}
