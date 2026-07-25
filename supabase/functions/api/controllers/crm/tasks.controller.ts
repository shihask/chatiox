import { parseBody, parseQuery } from '../../../_shared/validate.ts'
import { jsonCreated, jsonNoContent, jsonOk, jsonPaginated } from '../../../_shared/response.ts'
import { buildPaginationMeta } from '../../../_shared/pagination.ts'
import { BadRequestError } from '../../../_shared/errors.ts'
import type { WorkspaceHandler } from '../../../_shared/http/requestContext.ts'
import * as tasksService from '../../services/crm/tasks.service.ts'
import { createTaskSchema, listTasksQuerySchema, updateTaskSchema } from '../../schemas/crm/tasks.schemas.ts'

function requireParam(params: Record<string, string | undefined>, name: string): string {
  const value = params[name]
  if (!value) throw new BadRequestError(`Missing route parameter: ${name}`)
  return value
}

export const listByContact: WorkspaceHandler = async (req, { ctx, params }) => {
  const contactId = requireParam(params, 'id')
  const tasks = await tasksService.listTasksByContact(ctx, contactId)
  return jsonOk(tasks)
}

export const createForContact: WorkspaceHandler = async (req, { ctx, params }) => {
  const contactId = requireParam(params, 'id')
  const input = await parseBody(createTaskSchema, req)
  const task = await tasksService.createTask(ctx, contactId, input)
  return jsonCreated(task)
}

export const list: WorkspaceHandler = async (req, { ctx }) => {
  const query = parseQuery(listTasksQuerySchema, new URL(req.url))
  const page = await tasksService.listTasks(ctx, query)
  return jsonPaginated(page.items, buildPaginationMeta(page.page, page.pageSize, page.total))
}

export const update: WorkspaceHandler = async (req, { ctx, params }) => {
  const id = requireParam(params, 'id')
  const input = await parseBody(updateTaskSchema, req)
  const task = await tasksService.updateTask(ctx, id, input)
  return jsonOk(task)
}

export const remove: WorkspaceHandler = async (req, { ctx, params }) => {
  const id = requireParam(params, 'id')
  await tasksService.deleteTask(ctx, id)
  return jsonNoContent()
}
