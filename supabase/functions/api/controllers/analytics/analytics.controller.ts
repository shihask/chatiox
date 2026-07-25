import { jsonOk } from '../../../_shared/response.ts'
import type { WorkspaceHandler } from '../../../_shared/http/requestContext.ts'
import * as analyticsService from '../../services/analytics/analytics.service.ts'

export const leadsBySource: WorkspaceHandler = async (req, { ctx }) => {
  const rows = await analyticsService.getLeadsBySource(ctx)
  return jsonOk(rows)
}

export const leadStatusDistribution: WorkspaceHandler = async (req, { ctx }) => {
  const rows = await analyticsService.getLeadStatusDistribution(ctx)
  return jsonOk(rows)
}
