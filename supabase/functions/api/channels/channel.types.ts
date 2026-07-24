import type { ChannelType } from '../../_shared/channelTypes.ts'

export type { ChannelType }

export interface ChannelCapabilities {
  readonly supportsTemplates: boolean
  readonly supportsMedia: boolean
  readonly supportsButtons: boolean
  readonly supportsLocation: boolean
  readonly supportsReactions: boolean
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
  from: string // matched against contact_channels.value (post-normalization)
  type: 'message' | 'status_update' | 'unknown'
  text?: string
  attachments?: Array<{ contentType: string; url: string }>
  providerEventId: string // for idempotency dedup
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

/**
 * Channel-agnostic contract every messaging channel (WhatsApp, Email, SMS, Telegram, Instagram,
 * Messenger, RCS, ...) must implement. Business logic depends ONLY on this interface via
 * providerRegistry.ts -- never on a concrete provider class directly (see docs/architecture.md §3).
 * Providers are plugins, not modules: a channel's entire footprint is a class implementing this
 * interface, registered once -- it never gets its own *Service/*Controller.
 */
export interface IChannelProvider {
  readonly channelType: ChannelType
  readonly capabilities: ChannelCapabilities
  send(message: OutboundMessage): Promise<SendResult>
  receiveWebhook(payload: InboundWebhookPayload): Promise<NormalizedInboundEvent[]>
  validateTemplate(template: TemplateDefinition): Promise<TemplateValidationResult>
  uploadMedia(file: MediaUploadRequest): Promise<MediaUploadResult>
}
