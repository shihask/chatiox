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

  const envelope = await provider.parseWebhookEnvelope(rawBody, headers)
  if (!envelope.verified) {
    return new Response(null, { status: 401 })
  }

  const serviceRoleClient = createServiceRoleClient()
  const connection = envelope.accountIdentifier
    ? await channelsRepository.findByExternalAccountId(channelType, envelope.accountIdentifier)
    : null

  const { data: webhookEventRow } = await serviceRoleClient
    .from('webhook_events')
    .insert({
      channel_type: channelType,
      channel_connection_id: connection?.id ?? null,
      tenant_id: connection?.tenantId ?? null,
      payload: safeJsonParse(rawBody),
      headers,
      processing_status: connection ? 'received' : 'ignored',
    })
    .select('id')
    .single()

  if (!connection) {
    // Nothing we can do without a resolved workspace -- ack anyway, never let an unrecognized
    // account trigger a provider retry storm.
    return jsonNoContent()
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

  if (webhookEventRow) {
    await serviceRoleClient
      .from('webhook_events')
      .update({
        processing_status: processingError ? 'failed' : 'processed',
        processing_error: processingError,
      })
      .eq('id', webhookEventRow.id as string)
  }

  return jsonOk({ received: events.length })
}
