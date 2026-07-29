import { parseBody } from '../../../_shared/validate.ts'
import { jsonCreated, jsonNoContent, jsonOk } from '../../../_shared/response.ts'
import { BadRequestError } from '../../../_shared/errors.ts'
import type { WorkspaceHandler } from '../../../_shared/http/requestContext.ts'
import * as channelsService from '../../services/communication/channels.service.ts'
import {
  completeEmbeddedSignupSchema,
  createConnectionSchema,
  discoverEmbeddedSignupAssetsSchema,
  updateConnectionSchema,
} from '../../schemas/communication/channels.schemas.ts'

function requireParam(params: Record<string, string | undefined>, name: string): string {
  const value = params[name]
  if (!value) throw new BadRequestError(`Missing route parameter: ${name}`)
  return value
}

export const list: WorkspaceHandler = async (req, { ctx }) => {
  const connections = await channelsService.listConnections(ctx)
  return jsonOk(connections)
}

export const create: WorkspaceHandler = async (req, { ctx }) => {
  const input = await parseBody(createConnectionSchema, req)
  const connection = await channelsService.createConnection(ctx, input)
  return jsonCreated(connection)
}

export const discoverEmbeddedSignupAssets: WorkspaceHandler = async (req, { ctx }) => {
  const input = await parseBody(discoverEmbeddedSignupAssetsSchema, req)
  const discovery = await channelsService.discoverWhatsAppEmbeddedSignupAssets(ctx, input)
  return jsonOk(discovery)
}

export const completeEmbeddedSignup: WorkspaceHandler = async (req, { ctx }) => {
  const input = await parseBody(completeEmbeddedSignupSchema, req)
  const connection = await channelsService.completeWhatsAppEmbeddedSignup(ctx, input)
  return jsonCreated(connection)
}

export const update: WorkspaceHandler = async (req, { ctx, params }) => {
  const id = requireParam(params, 'id')
  const input = await parseBody(updateConnectionSchema, req)
  const connection = await channelsService.updateConnection(ctx, id, input)
  return jsonOk(connection)
}

export const remove: WorkspaceHandler = async (req, { ctx, params }) => {
  const id = requireParam(params, 'id')
  await channelsService.deleteConnection(ctx, id)
  return jsonNoContent()
}
