import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { recordAudit } from '../../../_shared/audit.ts'
import { emit } from '../../../_shared/events.ts'
import { requireRole } from '../../../_shared/rbac.ts'
import { BadRequestError } from '../../../_shared/errors.ts'
import type { Page } from '../../../_shared/repository.ts'
import type { WorkspaceRequestContext } from '../../../_shared/http/requestContext.ts'
import * as contactsRepository from '../../repositories/crm/contacts.repository.ts'
import {
  mapContactChannelRowToDTO,
  mapContactRowToDTO,
  mapLeadSourceRowToDTO,
  mapLeadStatusRowToDTO,
} from '../../mappers/crm/contacts.mapper.ts'
import type {
  AddContactChannelInput,
  CreateContactInput,
  ListContactsQuery,
  UpdateContactChannelInput,
  UpdateContactInput,
} from '../../schemas/crm/contacts.schemas.ts'
import type {
  ContactChannelDTO,
  ContactDTO,
  LeadSourceDTO,
  LeadStatusDTO,
} from '../../dtos/crm/contacts.dtos.ts'

async function validateAssigneeIsMember(
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from('tenant_memberships')
    .select('user_id')
    .eq('tenant_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new BadRequestError('Failed to validate assigned user')
  if (!data) throw new BadRequestError('assignedToUserId must be a member of this workspace')
}

export async function listContacts(
  ctx: WorkspaceRequestContext,
  query: ListContactsQuery,
): Promise<Page<ContactDTO>> {
  const page = await contactsRepository.list(ctx.supabase, ctx.workspaceId, query)
  return { ...page, items: page.items.map(mapContactRowToDTO) }
}

export async function getContact(ctx: WorkspaceRequestContext, id: string): Promise<ContactDTO | null> {
  const row = await contactsRepository.getById(ctx.supabase, ctx.workspaceId, id)
  return row ? mapContactRowToDTO(row) : null
}

export async function createContact(
  ctx: WorkspaceRequestContext,
  input: CreateContactInput,
): Promise<ContactDTO> {
  if (input.assignedToUserId) {
    await validateAssigneeIsMember(ctx.supabase, ctx.workspaceId, input.assignedToUserId)
  }

  const row = await contactsRepository.create(ctx.supabase, ctx.workspaceId, input)

  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'contact.created',
    targetType: 'contact',
    targetId: row.id,
    metadata: { name: `${row.first_name} ${row.last_name ?? ''}`.trim() },
  })
  emit({
    type: 'ContactCreated',
    workspaceId: ctx.workspaceId,
    contactId: row.id,
    actorUserId: ctx.userId,
    occurredAt: new Date().toISOString(),
  })

  return mapContactRowToDTO(row)
}

export async function updateContact(
  ctx: WorkspaceRequestContext,
  id: string,
  input: UpdateContactInput,
): Promise<ContactDTO> {
  if (input.assignedToUserId) {
    await validateAssigneeIsMember(ctx.supabase, ctx.workspaceId, input.assignedToUserId)
  }

  const row = await contactsRepository.update(ctx.supabase, ctx.workspaceId, id, input)

  const changedFields = Object.keys(input)
  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'contact.updated',
    targetType: 'contact',
    targetId: id,
    metadata: { changedFields },
  })
  emit({
    type: 'ContactUpdated',
    workspaceId: ctx.workspaceId,
    contactId: id,
    actorUserId: ctx.userId,
    changedFields,
    occurredAt: new Date().toISOString(),
  })

  return mapContactRowToDTO(row)
}

export async function deleteContact(ctx: WorkspaceRequestContext, id: string): Promise<void> {
  requireRole(ctx, ['owner', 'admin', 'manager'])

  await contactsRepository.remove(ctx.supabase, ctx.workspaceId, id)

  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'contact.deleted',
    targetType: 'contact',
    targetId: id,
  })
  emit({
    type: 'ContactDeleted',
    workspaceId: ctx.workspaceId,
    contactId: id,
    actorUserId: ctx.userId,
    occurredAt: new Date().toISOString(),
  })
}

export async function addContactChannel(
  ctx: WorkspaceRequestContext,
  contactId: string,
  input: AddContactChannelInput,
): Promise<ContactChannelDTO> {
  const row = await contactsRepository.addChannel(ctx.supabase, ctx.workspaceId, contactId, input)
  return mapContactChannelRowToDTO(row)
}

export async function updateContactChannel(
  ctx: WorkspaceRequestContext,
  channelId: string,
  input: UpdateContactChannelInput,
): Promise<ContactChannelDTO> {
  const row = await contactsRepository.updateChannel(ctx.supabase, ctx.workspaceId, channelId, input)
  return mapContactChannelRowToDTO(row)
}

export async function removeContactChannel(ctx: WorkspaceRequestContext, channelId: string): Promise<void> {
  requireRole(ctx, ['owner', 'admin', 'manager'])
  await contactsRepository.removeChannel(ctx.supabase, ctx.workspaceId, channelId)
}

export async function listLeadStatuses(ctx: WorkspaceRequestContext): Promise<LeadStatusDTO[]> {
  const rows = await contactsRepository.listLeadStatuses(ctx.supabase, ctx.workspaceId)
  return rows.map(mapLeadStatusRowToDTO)
}

export async function listLeadSources(ctx: WorkspaceRequestContext): Promise<LeadSourceDTO[]> {
  const rows = await contactsRepository.listLeadSources(ctx.supabase, ctx.workspaceId)
  return rows.map(mapLeadSourceRowToDTO)
}
