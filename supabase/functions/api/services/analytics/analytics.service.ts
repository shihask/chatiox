import type { WorkspaceRequestContext } from '../../../_shared/http/requestContext.ts'
import * as analyticsRepository from '../../repositories/analytics/analytics.repository.ts'
import { mapLeadsBySourceRowToDTO, mapLeadStatusDistributionRowToDTO } from '../../mappers/analytics/analytics.mapper.ts'
import type { LeadsBySourceRowDTO, LeadStatusDistributionRowDTO } from '../../dtos/analytics/analytics.dtos.ts'

export async function getLeadsBySource(ctx: WorkspaceRequestContext): Promise<LeadsBySourceRowDTO[]> {
  const rows = await analyticsRepository.getLeadsBySource(ctx.supabase, ctx.workspaceId)
  return rows.map(mapLeadsBySourceRowToDTO)
}

export async function getLeadStatusDistribution(
  ctx: WorkspaceRequestContext,
): Promise<LeadStatusDistributionRowDTO[]> {
  const rows = await analyticsRepository.getLeadStatusDistribution(ctx.supabase, ctx.workspaceId)
  return rows.map(mapLeadStatusDistributionRowToDTO)
}
