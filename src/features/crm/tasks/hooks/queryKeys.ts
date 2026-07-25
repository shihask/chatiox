import type { ListTasksParams } from '@/features/crm/tasks/types/task.types'

export const tasksKeys = {
  all: ['tasks'] as const,
  byContact: (contactId: string) => [...tasksKeys.all, 'by-contact', contactId] as const,
  lists: () => [...tasksKeys.all, 'list'] as const,
  list: (params: ListTasksParams) => [...tasksKeys.lists(), params] as const,
}
