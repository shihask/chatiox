export type TaskStatus = 'open' | 'completed' | 'cancelled'

export interface TaskContactSummaryDTO {
  id: string
  firstName: string
  lastName: string | null
}

export interface TaskDTO {
  id: string
  workspaceId: string
  contactId: string
  contact: TaskContactSummaryDTO | null
  title: string
  description: string | null
  dueAt: string | null
  status: TaskStatus
  assignedToUserId: string | null
  completedAt: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}
