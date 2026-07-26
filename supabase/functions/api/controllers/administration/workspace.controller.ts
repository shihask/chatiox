import { parseBody } from '../../../_shared/validate.ts'
import { jsonCreated, jsonNoContent, jsonOk } from '../../../_shared/response.ts'
import { BadRequestError } from '../../../_shared/errors.ts'
import type { WorkspaceHandler } from '../../../_shared/http/requestContext.ts'
import * as workspaceService from '../../services/administration/workspace.service.ts'
import {
  createLeadSourceSchema,
  createLeadStatusSchema,
  updateLeadSourceSchema,
  updateLeadStatusSchema,
  updateWorkspaceSchema,
} from '../../schemas/administration/workspace.schemas.ts'

function requireParam(params: Record<string, string | undefined>, name: string): string {
  const value = params[name]
  if (!value) throw new BadRequestError(`Missing route parameter: ${name}`)
  return value
}

export const updateWorkspace: WorkspaceHandler = async (req, { ctx }) => {
  const input = await parseBody(updateWorkspaceSchema, req)
  const workspace = await workspaceService.updateWorkspace(ctx, input)
  return jsonOk(workspace)
}

export const createLeadStatus: WorkspaceHandler = async (req, { ctx }) => {
  const input = await parseBody(createLeadStatusSchema, req)
  const status = await workspaceService.createLeadStatus(ctx, input)
  return jsonCreated(status)
}

export const updateLeadStatus: WorkspaceHandler = async (req, { ctx, params }) => {
  const id = requireParam(params, 'id')
  const input = await parseBody(updateLeadStatusSchema, req)
  const status = await workspaceService.updateLeadStatus(ctx, id, input)
  return jsonOk(status)
}

export const deleteLeadStatus: WorkspaceHandler = async (req, { ctx, params }) => {
  const id = requireParam(params, 'id')
  await workspaceService.deleteLeadStatus(ctx, id)
  return jsonNoContent()
}

export const createLeadSource: WorkspaceHandler = async (req, { ctx }) => {
  const input = await parseBody(createLeadSourceSchema, req)
  const source = await workspaceService.createLeadSource(ctx, input)
  return jsonCreated(source)
}

export const updateLeadSource: WorkspaceHandler = async (req, { ctx, params }) => {
  const id = requireParam(params, 'id')
  const input = await parseBody(updateLeadSourceSchema, req)
  const source = await workspaceService.updateLeadSource(ctx, id, input)
  return jsonOk(source)
}

export const deleteLeadSource: WorkspaceHandler = async (req, { ctx, params }) => {
  const id = requireParam(params, 'id')
  await workspaceService.deleteLeadSource(ctx, id)
  return jsonNoContent()
}
