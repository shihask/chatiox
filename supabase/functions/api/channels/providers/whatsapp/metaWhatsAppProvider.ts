import type {
  ChannelCapabilities,
  ChannelType,
  IChannelProvider,
  InboundWebhookPayload,
  MediaUploadRequest,
  MediaUploadResult,
  NormalizedInboundEvent,
  OutboundMessage,
  ProviderTemplateDefinition,
  ResolvedChannelConnection,
  SendResult,
  TemplateDefinition,
  TemplateValidationResult,
  WebhookEnvelope,
} from '../../channel.types.ts'
import { MetaGraphApiError, MetaGraphClient } from './metaGraphClient.ts'
import type { MetaWebhookPayload } from './metaWebhookPayload.ts'
import { normalizeChannelValue } from '../../../../_shared/channelValue.ts'

async function computeHmacSha256Hex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ])
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

/** Constant-time string comparison -- avoids leaking how many leading characters matched via
 * response-time differences, standard practice for comparing signatures/tokens. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

const STATUS_VALUES = ['sent', 'delivered', 'read', 'failed'] as const

/** Roadmap progress (see the plan doc's "Phase 2" section): outbound send (Commit 1) and webhook
 * verification (Commit 2) are real; inbound parsing (Commit 3, this pass) is real for text
 * messages and status updates. Templates, media, and interactive message types still throw an
 * explicit "not implemented yet" error rather than a silent no-op -- TypeScript requires the full
 * interface satisfied to compile this class, but nothing here is called for real until its own
 * commit lands (same precedent as providerRegistry.getProvider()'s "no provider registered" throw). */
export class MetaWhatsAppProvider implements IChannelProvider {
  readonly channelType: ChannelType = 'whatsapp'

  readonly capabilities: ChannelCapabilities = {
    supportsTemplates: true,
    supportsMedia: true,
    supportsButtons: true,
    supportsLists: true,
    supportsLocation: true,
    supportsReactions: true,
    supportsContacts: true,
    supportsTyping: false, // the Cloud API doesn't expose typing indicators
    supportsReadReceipts: true,
    supportsFlows: true,
    supportsEditingMessages: false, // WhatsApp doesn't support editing a sent message
  }

  async send(message: OutboundMessage, connection: ResolvedChannelConnection): Promise<SendResult> {
    if (message.attachments && message.attachments.length > 0) {
      throw new Error(
        'MetaWhatsAppProvider.send() for media attachments is not implemented yet -- see the Media commit in the plan doc\'s WhatsApp provider roadmap',
      )
    }

    const accessToken = connection.secret.accessToken
    const phoneNumberId = connection.externalAccountId
    if (typeof accessToken !== 'string' || !accessToken || !phoneNumberId) {
      return {
        providerMessageId: null,
        status: 'failed',
        error: { code: 'missing_credentials', message: 'WhatsApp connection is missing an access token or phone number ID' },
      }
    }

    const client = new MetaGraphClient({ accessToken, phoneNumberId })
    const to = message.to.replace(/^\+/, '') // Meta expects digits only, no leading '+'

    try {
      // The service layer (inboxService.sendMessage) always resolves the exact languageCode from
      // the matching channel_templates row before calling send() -- 'en_US' here is a last-resort
      // fallback for a direct/test caller that skipped that lookup, not the expected real path.
      const response = message.template
        ? await client.sendTemplate(to, message.template.name, message.template.languageCode ?? 'en_US', message.template.variables)
        : await client.sendText(to, message.text ?? '')
      const providerMessageId = response.messages[0]?.id ?? null
      return { providerMessageId, status: providerMessageId ? 'sent' : 'failed' }
    } catch (err) {
      if (err instanceof MetaGraphApiError) {
        return { providerMessageId: null, status: 'failed', error: { code: err.code, message: err.message } }
      }
      throw err
    }
  }

  /** Commit 2: Meta's GET handshake when a webhook URL is configured/verified in the App
   * Dashboard. `WHATSAPP_VERIFY_TOKEN` is a Chatiox-chosen secret (not from Meta) -- Meta just
   * echoes back whatever token was entered into the dashboard's "Verify token" field, and this
   * confirms the request is genuinely a verification attempt for that configured value, not a
   * guess. Distinct from parseWebhookEnvelope's HMAC check (Commit 4), which verifies the actual
   * POST event payloads using WHATSAPP_APP_SECRET. */
  handleVerificationChallenge(query: URLSearchParams): string | null {
    const mode = query.get('hub.mode')
    const token = query.get('hub.verify_token')
    const challenge = query.get('hub.challenge')
    const expectedToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN')

    if (mode === 'subscribe' && challenge && expectedToken && token === expectedToken) {
      return challenge
    }
    return null
  }

  /** Commit 4 (this pass): HMAC-SHA256 over the raw body using WHATSAPP_APP_SECRET, per Meta's
   * X-Hub-Signature-256 header. Distinct from handleVerificationChallenge's GET handshake (Commit
   * 2) -- that one-time dashboard check uses a Chatiox-chosen verify token, not this signature. */
  async parseWebhookEnvelope(rawBody: string, headers: Record<string, string>): Promise<WebhookEnvelope> {
    const appSecret = Deno.env.get('WHATSAPP_APP_SECRET')
    const signatureHeader = headers['x-hub-signature-256']

    let accountIdentifier: string | null = null
    try {
      const payload = JSON.parse(rawBody) as MetaWebhookPayload
      accountIdentifier = payload.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id ?? null
    } catch {
      accountIdentifier = null
    }

    if (!appSecret || !signatureHeader) return { verified: false, accountIdentifier }

    const expectedSignature = `sha256=${await computeHmacSha256Hex(appSecret, rawBody)}`
    const verified = timingSafeEqual(signatureHeader, expectedSignature)
    return { verified, accountIdentifier }
  }

  /** Commit 4 (this pass): normalizes Meta's webhook payload into NormalizedInboundEvent[]. Text
   * messages and status updates (sent/delivered/read/failed) are handled; any other message type
   * (image/video/audio/document/location/interactive/...) still becomes a real, visible event --
   * a placeholder body noting the type isn't supported yet -- rather than being silently dropped,
   * since "never lose an inbound message" is a hard rule for this module. Actual media
   * download/display is the Media commit. */
  receiveWebhook(payload: InboundWebhookPayload): Promise<NormalizedInboundEvent[]> {
    const body = payload.rawBody as MetaWebhookPayload
    const events: NormalizedInboundEvent[] = []

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value
        if (!value) continue

        for (const message of value.messages ?? []) {
          const text =
            message.type === 'text' && message.text
              ? message.text.body
              : `[Unsupported message type: ${message.type} -- media handling not implemented yet]`

          events.push({
            channelType: 'whatsapp',
            from: normalizeChannelValue('whatsapp', message.from),
            type: 'message',
            text,
            providerEventId: message.id,
            occurredAt: new Date(Number(message.timestamp) * 1000).toISOString(),
          })
        }

        for (const status of value.statuses ?? []) {
          if (!(STATUS_VALUES as readonly string[]).includes(status.status)) continue
          const firstError = status.errors?.[0]

          events.push({
            channelType: 'whatsapp',
            from: normalizeChannelValue('whatsapp', status.recipient_id),
            type: 'status_update',
            providerEventId: `${status.id}:${status.status}`,
            providerMessageId: status.id,
            status: status.status as (typeof STATUS_VALUES)[number],
            errorCode: firstError ? String(firstError.code) : undefined,
            errorMessage: firstError?.message ?? firstError?.title,
            occurredAt: new Date(Number(status.timestamp) * 1000).toISOString(),
          })
        }
      }
    }

    return Promise.resolve(events)
  }

  /** Structural check only (does the supplied variable count match the template's placeholder
   * count) -- not a Meta API call. Meta's own send-time rejection is still the final authority,
   * same as every other error this provider surfaces. */
  validateTemplate(template: TemplateDefinition): Promise<TemplateValidationResult> {
    const expected = template.bodyVariables?.length ?? 0
    const errors: string[] = []
    if (expected > 0 && !template.bodyVariables) {
      errors.push('Template expects variables but none were provided')
    }
    return Promise.resolve({ valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined })
  }

  uploadMedia(_file: MediaUploadRequest, _connection: ResolvedChannelConnection): Promise<MediaUploadResult> {
    throw new Error(
      'MetaWhatsAppProvider.uploadMedia is not implemented yet -- see the Media commit in the plan doc\'s WhatsApp provider roadmap',
    )
  }

  /** Lists this connection's templates straight from Meta -- the WABA id lives in
   * connection.metadata.wabaId (set at connect time, both manual entry and Embedded Signup). */
  async listApprovedTemplates(connection: ResolvedChannelConnection): Promise<ProviderTemplateDefinition[]> {
    const accessToken = connection.secret.accessToken
    const wabaId = connection.metadata.wabaId
    if (typeof accessToken !== 'string' || !accessToken || typeof wabaId !== 'string' || !wabaId) {
      throw new Error('WhatsApp connection is missing an access token or WABA ID')
    }

    const client = new MetaGraphClient({ accessToken, phoneNumberId: connection.externalAccountId ?? '' })
    const templates = await client.listApprovedTemplates(wabaId)

    return templates.map((template) => ({
      providerTemplateId: template.id,
      name: template.name,
      languageCode: template.language,
      category: template.category,
      bodyText: template.bodyText,
      variableCount: template.bodyText ? new Set(template.bodyText.match(/\{\{\d+\}\}/g) ?? []).size : 0,
      status: normalizeTemplateStatus(template.status),
    }))
  }
}

/** Meta's real values are uppercase (APPROVED/PENDING/REJECTED), plus at least one undocumented
 * in-between status (PENDING_DELETION etc.) -- anything unrecognized is treated as 'pending'
 * rather than assumed sendable. */
function normalizeTemplateStatus(status: string): 'pending' | 'approved' | 'rejected' {
  const normalized = status.toLowerCase()
  if (normalized === 'approved' || normalized === 'rejected') return normalized
  return 'pending'
}
