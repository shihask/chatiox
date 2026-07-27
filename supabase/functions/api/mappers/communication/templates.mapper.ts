import type { ChannelType } from '../../../_shared/channelTypes.ts'
import type { ChannelTemplateDTO, TemplateDTO } from '../../dtos/communication/templates.dtos.ts'
import type { ChannelTemplateRow, TemplateRow } from '../../repositories/communication/templates.repository.ts'

export function mapTemplateRowToDTO(row: TemplateRow): TemplateDTO {
  return {
    id: row.id,
    workspaceId: row.tenant_id,
    name: row.name,
    purpose: row.purpose,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapChannelTemplateRowToDTO(row: ChannelTemplateRow): ChannelTemplateDTO {
  return {
    id: row.id,
    workspaceId: row.tenant_id,
    templateId: row.template_id,
    channelConnectionId: row.channel_connection_id,
    channelType: row.channel_type as ChannelType,
    providerTemplateName: row.provider_template_name,
    languageCode: row.language_code,
    category: row.category,
    body: row.body,
    variables: row.variables,
    status: row.status as ChannelTemplateDTO['status'],
    providerTemplateId: row.provider_template_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
