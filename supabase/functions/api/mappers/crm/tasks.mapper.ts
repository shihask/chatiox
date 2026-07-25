import type { TaskDTO, TaskStatus } from '../../dtos/crm/tasks.dtos.ts'

export interface TaskContactRow {
  id: string
  first_name: string
  last_name: string | null
}

export interface TaskRow {
  id: string
  tenant_id: string
  contact_id: string
  title: string
  description: string | null
  due_at: string | null
  status: string
  assigned_to_user_id: string | null
  completed_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  contacts?: TaskContactRow | null
}

/** The exact tenant_id -> workspaceId translation point (see docs/architecture.md §2). */
export function mapTaskRowToDTO(row: TaskRow): TaskDTO {
  return {
    id: row.id,
    workspaceId: row.tenant_id,
    contactId: row.contact_id,
    contact: row.contacts
      ? { id: row.contacts.id, firstName: row.contacts.first_name, lastName: row.contacts.last_name }
      : null,
    title: row.title,
    description: row.description,
    dueAt: row.due_at,
    status: row.status as TaskStatus,
    assignedToUserId: row.assigned_to_user_id,
    completedAt: row.completed_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
