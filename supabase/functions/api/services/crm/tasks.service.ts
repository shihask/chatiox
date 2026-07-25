import { recordAudit } from '../../../_shared/audit.ts'
import { emit } from '../../../_shared/events.ts'
import type { Page } from '../../../_shared/repository.ts'
import type { WorkspaceRequestContext } from '../../../_shared/http/requestContext.ts'
import * as tasksRepository from '../../repositories/crm/tasks.repository.ts'
import { mapTaskRowToDTO } from '../../mappers/crm/tasks.mapper.ts'
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from '../../schemas/crm/tasks.schemas.ts'
import type { TaskDTO } from '../../dtos/crm/tasks.dtos.ts'

export async function listTasksByContact(ctx: WorkspaceRequestContext, contactId: string): Promise<TaskDTO[]> {
  const rows = await tasksRepository.listByContact(ctx.supabase, ctx.workspaceId, contactId)
  return rows.map(mapTaskRowToDTO)
}

export async function listTasks(ctx: WorkspaceRequestContext, query: ListTasksQuery): Promise<Page<TaskDTO>> {
  const page = await tasksRepository.list(ctx.supabase, ctx.workspaceId, query)
  return { ...page, items: page.items.map(mapTaskRowToDTO) }
}

export async function createTask(
  ctx: WorkspaceRequestContext,
  contactId: string,
  input: CreateTaskInput,
): Promise<TaskDTO> {
  const row = await tasksRepository.create(ctx.supabase, ctx.workspaceId, contactId, input, ctx.userId)

  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'task.created',
    targetType: 'task',
    targetId: row.id,
    metadata: { contactId, title: row.title },
  })
  emit({
    type: 'TaskCreated',
    workspaceId: ctx.workspaceId,
    contactId,
    taskId: row.id,
    actorUserId: ctx.userId,
    occurredAt: new Date().toISOString(),
  })

  return mapTaskRowToDTO(row)
}

export async function updateTask(
  ctx: WorkspaceRequestContext,
  id: string,
  input: UpdateTaskInput,
): Promise<TaskDTO> {
  const row = await tasksRepository.update(ctx.supabase, ctx.workspaceId, id, input)

  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'task.updated',
    targetType: 'task',
    targetId: id,
    metadata: { changedFields: Object.keys(input) },
  })
  if (input.status === 'completed') {
    emit({
      type: 'TaskCompleted',
      workspaceId: ctx.workspaceId,
      contactId: row.contact_id,
      taskId: id,
      actorUserId: ctx.userId,
      occurredAt: new Date().toISOString(),
    })
  }

  return mapTaskRowToDTO(row)
}

export async function deleteTask(ctx: WorkspaceRequestContext, id: string): Promise<void> {
  await tasksRepository.remove(ctx.supabase, ctx.workspaceId, id)

  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'task.deleted',
    targetType: 'task',
    targetId: id,
  })
}
