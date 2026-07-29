import type {
  ChannelCapabilities,
  ChannelType,
  IChannelProvider,
  InboundWebhookPayload,
  MediaUploadRequest,
  MediaUploadResult,
  NormalizedInboundEvent,
  OutboundMessage,
  ResolvedChannelConnection,
  SendResult,
  TemplateDefinition,
  TemplateValidationResult,
  WebhookEnvelope,
} from '../../channel.types.ts'
import { MetaGraphApiError, MetaGraphClient } from './metaGraphClient.ts'

/** Commit 1 of the WhatsApp provider roadmap (see the plan doc's "Phase 2" section): plain-text
 * outbound send only. Every other IChannelProvider method throws an explicit "not implemented yet"
 * error rather than a silent no-op -- TypeScript requires the full interface satisfied to compile
 * this class, but nothing here is called for real until its own commit lands (same precedent as
 * providerRegistry.getProvider()'s "no provider registered" throw). */
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
    if (message.template) {
      throw new Error(
        'MetaWhatsAppProvider.send() for template messages is not implemented yet -- see the Templates commit in the plan doc\'s WhatsApp provider roadmap',
      )
    }
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
      const response = await client.sendText(to, message.text ?? '')
      const providerMessageId = response.messages[0]?.id ?? null
      return { providerMessageId, status: providerMessageId ? 'sent' : 'failed' }
    } catch (err) {
      if (err instanceof MetaGraphApiError) {
        return { providerMessageId: null, status: 'failed', error: { code: err.code, message: err.message } }
      }
      throw err
    }
  }

  parseWebhookEnvelope(_rawBody: string, _headers: Record<string, string>): Promise<WebhookEnvelope> {
    throw new Error(
      'MetaWhatsAppProvider.parseWebhookEnvelope is not implemented yet -- see Commit 4 in the plan doc\'s WhatsApp provider roadmap',
    )
  }

  receiveWebhook(_payload: InboundWebhookPayload): Promise<NormalizedInboundEvent[]> {
    throw new Error(
      'MetaWhatsAppProvider.receiveWebhook is not implemented yet -- see Commit 4 in the plan doc\'s WhatsApp provider roadmap',
    )
  }

  validateTemplate(_template: TemplateDefinition): Promise<TemplateValidationResult> {
    throw new Error(
      'MetaWhatsAppProvider.validateTemplate is not implemented yet -- see the Templates commit in the plan doc\'s WhatsApp provider roadmap',
    )
  }

  uploadMedia(_file: MediaUploadRequest, _connection: ResolvedChannelConnection): Promise<MediaUploadResult> {
    throw new Error(
      'MetaWhatsAppProvider.uploadMedia is not implemented yet -- see the Media commit in the plan doc\'s WhatsApp provider roadmap',
    )
  }
}
