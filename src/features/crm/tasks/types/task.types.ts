// Mirrors docs/modules/crm/tasks.md -- not implemented yet, no backend route exists.
export interface TaskDTO {
  id: string
  workspaceId: string
  contactId: string
  title: string
  description: string | null
  dueAt: string | null
  status: 'open' | 'completed' | 'cancelled'
  assignedToUserId: string | null
  createdBy: string
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateTaskDTO {
  contactId: string
  title: string
  description?: string
  dueAt?: string
  assignedToUserId?: string
}

export interface UpdateTaskDTO {
  title?: string
  description?: string | null
  dueAt?: string | null
  status?: TaskDTO['status']
  assignedToUserId?: string | null
}
