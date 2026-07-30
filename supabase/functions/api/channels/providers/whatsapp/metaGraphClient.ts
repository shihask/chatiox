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

export interface MetaMessageTemplateSummary {
  id: string
  name: string
  language: string
  status: string
  category: string | null
  bodyText: string | null
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

  private async get<T>(url: string): Promise<T> {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${this.config.accessToken}` } })
    const json = (await response.json()) as T & MetaErrorPayload
    if (!response.ok) throw new MetaGraphApiError(json, response.status)
    return json
  }

  /** Uploads bytes to Meta first (WhatsApp only ever sends media it already hosts, never an
   * arbitrary external URL for outbound) -- returns a mediaId to reference in a later send. */
  async uploadMedia(data: Uint8Array, contentType: string, filename?: string): Promise<{ id: string }> {
    const form = new FormData()
    form.append('messaging_product', 'whatsapp')
    form.append('file', new Blob([data], { type: contentType }), filename ?? 'upload')

    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${this.config.phoneNumberId}/media`
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.config.accessToken}` },
      body: form,
    })
    const json = (await response.json()) as { id?: string } & MetaErrorPayload
    if (!response.ok || !json.id) throw new MetaGraphApiError(json, response.status)
    return { id: json.id }
  }

  /** Meta's media URLs are short-lived AND still require the Bearer token to actually fetch the
   * bytes -- this only resolves the id into a URL, it doesn't download anything itself. */
  async getMediaUrl(mediaId: string): Promise<{ url: string; mimeType: string; fileSize: number }> {
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${mediaId}`
    const json = await this.get<{ url: string; mime_type: string; file_size: number }>(url)
    return { url: json.url, mimeType: json.mime_type, fileSize: json.file_size }
  }

  async sendMedia(
    to: string,
    kind: 'image' | 'document' | 'audio' | 'video',
    mediaId: string,
    options?: { caption?: string; filename?: string },
  ): Promise<MetaSendMessageResponse> {
    const mediaObject: Record<string, unknown> = { id: mediaId }
    if (options?.caption) mediaObject.caption = options.caption
    if (kind === 'document' && options?.filename) mediaObject.filename = options.filename

    return this.post<MetaSendMessageResponse>(this.messagesUrl, {
      messaging_product: 'whatsapp',
      to,
      type: kind,
      [kind]: mediaObject,
    })
  }

  async sendText(to: string, body: string): Promise<MetaSendMessageResponse> {
    return this.post<MetaSendMessageResponse>(this.messagesUrl, {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    })
  }

  /** `variables` is ordered/positional -- WhatsApp's standard template system has no semantic
   * variable names, only positional {{1}}, {{2}} placeholders in the approved template body. */
  async sendTemplate(to: string, name: string, languageCode: string, variables?: string[]): Promise<MetaSendMessageResponse> {
    return this.post<MetaSendMessageResponse>(this.messagesUrl, {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name,
        language: { code: languageCode },
        components:
          variables && variables.length > 0
            ? [{ type: 'body', parameters: variables.map((text) => ({ type: 'text', text })) }]
            : [],
      },
    })
  }

  /** Single page for v1 -- realistic template counts for a test WABA are small; pagination is a
   * follow-up if a real workspace ever accumulates enough templates for it to matter. */
  async listApprovedTemplates(wabaId: string): Promise<MetaMessageTemplateSummary[]> {
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${wabaId}/message_templates?fields=name,language,status,category,components`
    const { data } = await this.get<{
      data: Array<{
        id: string
        name: string
        language: string
        status: string
        category?: string
        components?: Array<{ type: string; text?: string }>
      }>
    }>(url)

    return data.map((template) => ({
      id: template.id,
      name: template.name,
      language: template.language,
      status: template.status,
      category: template.category ?? null,
      bodyText: template.components?.find((c) => c.type === 'BODY')?.text ?? null,
    }))
  }
}
