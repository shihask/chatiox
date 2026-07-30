// Shape of Meta's WhatsApp Cloud API webhook POST body -- only the fields Chatiox actually reads;
// every field access downstream must stay defensive (?.) since this is untrusted external input.
export interface MetaWebhookMessage {
  from: string // digits only, no '+'
  id: string // wamid, the provider_message_id
  timestamp: string // unix seconds, as a string
  type: string // 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'interactive' | ...
  text?: { body: string }
  // Video/audio/document fast-follow onto the same shape (id + mime_type, document adds filename).
  image?: { id: string; mime_type: string }
}

export interface MetaWebhookStatus {
  id: string // wamid this status refers to
  status: string // 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: string
  recipient_id: string // digits only, no '+'
  errors?: Array<{ code: number; title?: string; message?: string }>
}

export interface MetaWebhookPayload {
  object?: string
  entry?: Array<{
    id?: string
    changes?: Array<{
      field?: string
      value?: {
        messaging_product?: string
        metadata?: { display_phone_number?: string; phone_number_id?: string }
        messages?: MetaWebhookMessage[]
        statuses?: MetaWebhookStatus[]
      }
    }>
  }>
}
