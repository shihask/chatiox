import { parseBody } from '../../../_shared/validate.ts'
import { jsonCreated, jsonNoContent, jsonOk } from '../../../_shared/response.ts'
import { BadRequestError } from '../../../_shared/errors.ts'
import type { WorkspaceHandler } from '../../../_shared/http/requestContext.ts'
import * as templatesService from '../../services/communication/templates.service.ts'
import { createTemplateSchema } from '../../schemas/communication/templates.schemas.ts'

function requireParam(params: Record<string, string | undefined>, name: string): string {
  const value = params[name]
  if (!value) throw new BadRequestError(`Missing route parameter: ${name}`)
  return value
}

export const list: WorkspaceHandler = async (req, { ctx }) => {
  const templates = await templatesService.listTemplates(ctx)
  return jsonOk(templates)
}

export const create: WorkspaceHandler = async (req, { ctx }) => {
  const input = await parseBody(createTemplateSchema, req)
  const template = await templatesService.createTemplate(ctx, input)
  return jsonCreated(template)
}

export const remove: WorkspaceHandler = async (req, { ctx, params }) => {
  const id = requireParam(params, 'id')
  await templatesService.deleteTemplate(ctx, id)
  return jsonNoContent()
}

export const listChannelTemplates: WorkspaceHandler = async (req, { ctx, params }) => {
  const id = requireParam(params, 'id')
  const channelTemplates = await templatesService.listChannelTemplates(ctx, id)
  return jsonOk(channelTemplates)
}

export const listChannelTemplatesByConnection: WorkspaceHandler = async (req, { ctx, params }) => {
  const connectionId = requireParam(params, 'connectionId')
  const channelTemplates = await templatesService.listChannelTemplatesByConnection(ctx, connectionId)
  return jsonOk(channelTemplates)
}

export const syncChannelTemplates: WorkspaceHandler = async (req, { ctx, params }) => {
  const connectionId = requireParam(params, 'connectionId')
  const channelTemplates = await templatesService.syncChannelTemplates(ctx, connectionId)
  return jsonOk(channelTemplates)
}
