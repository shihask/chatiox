// Thin HTTP client for the Meta WhatsApp Cloud API -- owns endpoint URLs, auth headers, and
// request/response shapes. MetaWhatsAppProvider (../metaWhatsAppProvider.ts) stays a pure
// translation layer between Chatiox's domain model and this client; nothing outside this provider
// folder imports MetaGraphClient directly (see docs/architecture.md §3, "providers are plugins").
const GRAPH_API_VERSION = 'v21.0'

export interface MetaGraphClientConfig {
  accessToken: string
  phoneNumberId: string
}

export interface MetaSendMessageResponse {
  messaging_product: 'whatsapp'
  contacts: Array<{ input: string; wa_id: string }>
  messages: Array<{ id: string }>
}

interface MetaErrorPayload {
  error?: { message: string; type: string; code: number; error_subcode?: number; fbtrace_id?: string }
}

/** Carries Meta's own error code/message so callers can map it into a SendResult without
 * re-parsing the Graph API's error shape themselves. */
export class MetaGraphApiError extends Error {
  code: string
  constructor(payload: MetaErrorPayload, httpStatus: number) {
    super(payload.error?.message ?? `Meta Graph API request failed with status ${httpStatus}`)
    this.name = 'MetaGraphApiError'
    this.code = payload.error?.code !== undefined ? String(payload.error.code) : String(httpStatus)
  }
}

export class MetaGraphClient {
  constructor(private readonly config: MetaGraphClientConfig) {}

  private get messagesUrl(): string {
    return `https://graph.facebook.com/${GRAPH_API_VERSION}/${this.config.phoneNumberId}/messages`
  }

  private async post<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const json = (await response.json()) as T & MetaErrorPayload
    if (!response.ok) throw new MetaGraphApiError(json, response.status)
    return json
  }

  async sendText(to: string, body: string): Promise<MetaSendMessageResponse> {
    return this.post<MetaSendMessageResponse>(this.messagesUrl, {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    })
  }
}
