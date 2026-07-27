import type { ChannelType } from '../../_shared/channelTypes.ts'

export type { ChannelType }

export interface ChannelCapabilities {
  readonly supportsTemplates: boolean
  readonly supportsMedia: boolean
  readonly supportsButtons: boolean
  readonly supportsLists: boolean
  readonly supportsLocation: boolean
  readonly supportsReactions: boolean
  readonly supportsContacts: boolean
  readonly supportsTyping: boolean
  readonly supportsReadReceipts: boolean
  readonly supportsFlows: boolean
  readonly supportsEditingMessages: boolean
}

export interface OutboundAttachment {
  contentType: string
  source: { kind: 'mediaId'; mediaId: string } | { kind: 'url'; url: string }
  filename?: string
}

export interface OutboundMessage {
  tenantId: string
  channelType: ChannelType
  to: string // the contact_channels.value being addressed
  text?: string
  template?: { name: string; languageCode?: string; variables?: Record<string, string> }
  attachments?: OutboundAttachment[]
  clientReferenceId?: string // caller-supplied correlation id for idempotency/tracing
}

export interface SendResult {
  providerMessageId: string | null
  status: 'queued' | 'sent' | 'failed'
  error?: { code: string; message: string }
}

export interface InboundWebhookPayload {
  tenantId: string
  channelType: ChannelType
  rawBody: unknown // unverified/un-normalized, for signature check + audit
  headers: Record<string, string>
}

export interface NormalizedInboundEvent {
  channelType: ChannelType
  from: string // matched against channel_identities.value (post-normalization)
  type: 'message' | 'status_update' | 'unknown'
  text?: string
  attachments?: Array<{ contentType: string; url: string }>
  providerEventId: string // for idempotency dedup
  providerMessageId?: string // present on status_update events, to find the original message
  status?: 'sent' | 'delivered' | 'read' | 'failed' // present on status_update events
  errorCode?: string
  errorMessage?: string
  occurredAt: string
}

export interface TemplateDefinition {
  name: string
  languageCode?: string
  bodyVariables?: string[]
}

export interface TemplateValidationResult {
  valid: boolean
  errors?: string[]
}

export interface MediaUploadRequest {
  tenantId: string
  contentType: string
  data: Uint8Array
  filename?: string
}

export interface MediaUploadResult {
  mediaId: string
  url?: string
  expiresAt?: string
}

/** The non-secret + decrypted-secret shape a Service layer resolves before calling send/uploadMedia
 * -- providers are stateless plugins with no DB access of their own. `secret` is decrypted from
 * Supabase Vault at resolution time (see channels.repository.ts's resolveForSending) and never
 * persisted or logged anywhere else; it exists only for the lifetime of one request. */
export interface ResolvedChannelConnection {
  id: string
  tenantId: string
  channelType: ChannelType
  externalAccountId: string | null
  metadata: Record<string, unknown>
  secret: Record<string, unknown>
}

/** Result of a provider verifying an inbound webhook is genuine. `accountIdentifier` (e.g. a
 * WhatsApp phone_number_id) is matched against channel_connections.external_account_id to resolve
 * which workspace the event belongs to -- this happens BEFORE any tenantId is known. */
export interface WebhookEnvelope {
  verified: boolean
  accountIdentifier: string | null
}

/**
 * Channel-agnostic contract every messaging channel (WhatsApp, Email, SMS, Voice, Instagram,
 * Messenger, RCS, ...) must implement. Business logic depends ONLY on this interface via
 * providerRegistry.ts -- never on a concrete provider class directly (see docs/architecture.md §3).
 * Providers are plugins, not modules: a channel's entire footprint is a class implementing this
 * interface, registered once -- it never gets its own *Service/*Controller.
 */
export interface IChannelProvider {
  readonly channelType: ChannelType
  readonly capabilities: ChannelCapabilities
  send(message: OutboundMessage, connection: ResolvedChannelConnection): Promise<SendResult>
  /** Verifies the inbound request is genuinely from this provider (e.g. Meta's HMAC-SHA256 over
   * the raw body) and extracts the account identifier used to resolve a tenant -- async because
   * real signature verification uses Deno's Web Crypto (`crypto.subtle`), which is Promise-based. */
  parseWebhookEnvelope(rawBody: string, headers: Record<string, string>): Promise<WebhookEnvelope>
  receiveWebhook(payload: InboundWebhookPayload): Promise<NormalizedInboundEvent[]>
  validateTemplate(template: TemplateDefinition): Promise<TemplateValidationResult>
  uploadMedia(file: MediaUploadRequest, connection: ResolvedChannelConnection): Promise<MediaUploadResult>
  /** Only meaningful for providers with a GET-based verification handshake (Meta's hub.challenge).
   * Optional -- most future providers (Twilio, SES, ...) won't implement this. */
  handleVerificationChallenge?(query: URLSearchParams): string | null
}
