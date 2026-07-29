import { createServiceRoleClient } from '../../../_shared/supabaseClient.ts'
import { jsonNoContent, jsonOk } from '../../../_shared/response.ts'
import { isChannelType } from '../../../_shared/channelTypes.ts'
import type { WebhookHandler } from '../../../_shared/http/requestContext.ts'
import { getProvider } from '../../channels/providerRegistry.ts'
import * as channelsRepository from '../../repositories/communication/channels.repository.ts'
import * as inboxService from '../../services/communication/inbox.service.ts'

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function headersToObject(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {}
  headers.forEach((value, key) => {
    result[key] = value
  })
  return result
}

/**
 * Generic inbound webhook route for every channel type -- /webhooks/:channelType. The channel
 * type comes from the URL itself, so adding a new channel (Email, SMS, Voice, ...) later never
 * touches this file or router.ts: it's just a new IChannelProvider registered via
 * providerRegistry.ts. See docs/architecture.md's webhook tier section for the full flow.
 */
export const handleWebhook: WebhookHandler = async (req, { params }) => {
  const channelTypeParam = params.channelType
  if (!channelTypeParam || !isChannelType(channelTypeParam)) {
    return new Response(null, { status: 404 })
  }
  const channelType = channelTypeParam

  let provider
  try {
    provider = getProvider(channelType)
  } catch {
    // No concrete provider registered yet for this channel -- nothing to verify against.
    return new Response(null, { status: 404 })
  }

  if (req.method === 'GET') {
    if (!provider.handleVerificationChallenge) return new Response(null, { status: 404 })
    const url = new URL(req.url)
    const challenge = provider.handleVerificationChallenge(url.searchParams)
    if (challenge === null) return new Response(null, { status: 403 })
    return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } })
  }

  const rawBody = await req.text()
  const headers = headersToObject(req.headers)
  const serviceRoleClient = createServiceRoleClient()

  // Log every inbound webhook call before verifying it -- an unverified/malicious/malformed
  // request still gets a row (tenant_id/channel_connection_id null until resolved), so nothing is
  // ever lost to a signature check or resolution failure; the row is updated as more is learned.
  // See docs/modules/communication/inbox.md.
  const { data: webhookEventRow } = await serviceRoleClient
    .from('webhook_events')
    .insert({
      channel_type: channelType,
      payload: safeJsonParse(rawBody),
      headers,
      processing_status: 'received',
    })
    .select('id')
    .single()
  const webhookEventId = webhookEventRow?.id as string | undefined

  async function markProcessing(status: 'processed' | 'failed' | 'ignored', error?: string): Promise<void> {
    if (!webhookEventId) return
    await serviceRoleClient
      .from('webhook_events')
      .update({ processing_status: status, processing_error: error ?? null })
      .eq('id', webhookEventId)
  }

  const envelope = await provider.parseWebhookEnvelope(rawBody, headers)
  if (!envelope.verified) {
    await markProcessing('failed', 'Webhook signature verification failed')
    return new Response(null, { status: 401 })
  }

  const connection = envelope.accountIdentifier
    ? await channelsRepository.findByExternalAccountId(channelType, envelope.accountIdentifier)
    : null

  if (!connection) {
    // Nothing we can do without a resolved workspace -- ack anyway, never let an unrecognized
    // account trigger a provider retry storm. Include the actual identifier value (not just a
    // generic message) so this is actionable once multiple clients/numbers are connected --
    // e.g. distinguishing "Meta's dashboard Test button's placeholder ID" from "a real number
    // that's disconnected/never-connected".
    const reason = envelope.accountIdentifier
      ? `No channel_connections row matched ${channelType} account identifier '${envelope.accountIdentifier}'`
      : `Could not extract an account identifier from the ${channelType} payload`
    await markProcessing('ignored', reason)
    return jsonNoContent()
  }

  if (webhookEventId) {
    await serviceRoleClient
      .from('webhook_events')
      .update({ channel_connection_id: connection.id, tenant_id: connection.tenantId })
      .eq('id', webhookEventId)
  }

  const events = await provider.receiveWebhook({
    tenantId: connection.tenantId,
    channelType,
    rawBody: safeJsonParse(rawBody),
    headers,
  })

  let processingError: string | null = null
  for (const event of events) {
    try {
      await inboxService.ingestInboundEvent(serviceRoleClient, connection, event)
    } catch (err) {
      processingError = err instanceof Error ? err.message : 'Unknown error'
      console.error('[webhooks] failed to ingest event', err)
    }
  }

  await markProcessing(processingError ? 'failed' : 'processed', processingError ?? undefined)
  return jsonOk({ received: events.length })
}
