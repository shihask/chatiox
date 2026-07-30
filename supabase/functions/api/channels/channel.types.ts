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
  // `variables` is ordered/positional, not name-keyed -- WhatsApp's standard template system has
  // no semantic variable names, only positional {{1}}, {{2}} placeholders in the template body.
  template?: { name: string; languageCode?: string; variables?: string[] }
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
  // `mediaId` (not a URL) -- providers are stateless and receiveWebhook() has no access to a
  // resolved connection/access-token, so resolving this into something downloadable is a separate
  // step (IChannelProvider.resolveMediaForDownload?, called by the service layer, which does have
  // the connection).
  attachments?: Array<{ contentType: string; mediaId: string; filename?: string }>
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

/** A template as the provider's own template-management system knows it (e.g. Meta's approved
 * WhatsApp message templates) -- distinct from `TemplateDefinition`, which is what a caller
 * supplies when trying to validate/send one. `variableCount` is positional (see OutboundMessage's
 * `template.variables` comment), derived from the provider's own template body, not asserted by
 * Chatiox. */
export interface ProviderTemplateDefinition {
  providerTemplateId: string | null
  name: string
  languageCode: string
  category: string | null
  bodyText: string | null
  variableCount: number
  status: 'pending' | 'approved' | 'rejected'
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
  /** Lists this connection's approved/pending/rejected templates from the provider's own template-
   * management system (e.g. Meta Business Manager). Optional -- not every channel has an equivalent
   * concept (a plain SMS/Email provider likely wouldn't implement this). */
  listApprovedTemplates?(connection: ResolvedChannelConnection): Promise<ProviderTemplateDefinition[]>
  /** Resolves a NormalizedInboundEvent attachment's mediaId into something the service layer can
   * actually download -- e.g. Meta's media URLs are short-lived and require the same Bearer token
   * as everything else, so `headers` carries whatever the download fetch() needs. Optional --
   * channels whose inbound webhook already carries a plain fetchable URL wouldn't need this. */
  resolveMediaForDownload?(
    mediaId: string,
    connection: ResolvedChannelConnection,
  ): Promise<{ url: string; headers?: Record<string, string> }>
}
