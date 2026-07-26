import { parseBody } from '../../../_shared/validate.ts'
import { jsonCreated, jsonNoContent, jsonOk } from '../../../_shared/response.ts'
import { BadRequestError } from '../../../_shared/errors.ts'
import type { PublicHandler, WorkspaceHandler } from '../../../_shared/http/requestContext.ts'
import * as teamMembersService from '../../services/administration/team-members.service.ts'
import { createInviteSchema, updateMemberRoleSchema } from '../../schemas/administration/team-members.schemas.ts'

function requireParam(params: Record<string, string | undefined>, name: string): string {
  const value = params[name]
  if (!value) throw new BadRequestError(`Missing route parameter: ${name}`)
  return value
}

export const previewInvite: PublicHandler = async (req, { params }) => {
  const token = requireParam(params, 'token')
  const preview = await teamMembersService.previewInvite(token)
  return jsonOk(preview)
}

export const listMembers: WorkspaceHandler = async (req, { ctx }) => {
  const members = await teamMembersService.listMembers(ctx)
  return jsonOk(members)
}

export const updateMemberRole: WorkspaceHandler = async (req, { ctx, params }) => {
  const userId = requireParam(params, 'userId')
  const input = await parseBody(updateMemberRoleSchema, req)
  await teamMembersService.updateMemberRole(ctx, userId, input)
  return jsonNoContent()
}

export const removeMember: WorkspaceHandler = async (req, { ctx, params }) => {
  const userId = requireParam(params, 'userId')
  await teamMembersService.removeMember(ctx, userId)
  return jsonNoContent()
}

export const listInvites: WorkspaceHandler = async (req, { ctx }) => {
  const invites = await teamMembersService.listInvites(ctx)
  return jsonOk(invites)
}

export const createInvite: WorkspaceHandler = async (req, { ctx }) => {
  const input = await parseBody(createInviteSchema, req)
  const invite = await teamMembersService.createInvite(ctx, input)
  return jsonCreated(invite)
}

export const revokeInvite: WorkspaceHandler = async (req, { ctx, params }) => {
  const id = requireParam(params, 'id')
  await teamMembersService.revokeInvite(ctx, id)
  return jsonNoContent()
}
