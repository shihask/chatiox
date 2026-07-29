// Server-side steps for Meta's WhatsApp Embedded Signup onboarding flow -- standalone functions,
// not on MetaGraphClient, since these run BEFORE any channel_connections row (and its per-
// connection token) exists. Each function takes whatever token/id it needs explicitly rather than
// holding instance state, since the token in play changes across the discover/complete steps (see
// channels.service.ts's discoverWhatsAppEmbeddedSignupAssets/completeWhatsAppEmbeddedSignup).
//
// The exact discovery endpoint sequence below (businesses -> owned/client WABAs -> phone numbers)
// is Chatiox's best current understanding of Meta's Graph API; per the plan, it gets confirmed
// against real responses from the user's own test business during implementation, not assumed
// blindly -- these are read-only GETs, curl-testable directly with an exchanged token.
import { MetaGraphApiError } from './metaGraphClient.ts'
import { InternalError } from '../../../../_shared/errors.ts'

const GRAPH_API_VERSION = 'v21.0'
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

export interface EmbeddedSignupCandidate {
  wabaId: string
  phoneNumberId: string
  displayPhoneNumber: string
  verifiedName: string
  qualityRating: string | null
  messagingLimitTier: string | null
}

interface MetaErrorPayload {
  error?: { message: string; type: string; code: number; error_subcode?: number; fbtrace_id?: string }
}

async function graphGet<T>(path: string, accessToken: string): Promise<T> {
  const url = new URL(`${GRAPH_BASE}${path}`)
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  const json = (await response.json()) as T & MetaErrorPayload
  if (!response.ok) throw new MetaGraphApiError(json, response.status)
  return json
}

export async function exchangeCodeForAccessToken(code: string): Promise<{ accessToken: string }> {
  const appId = Deno.env.get('WHATSAPP_APP_ID')
  const appSecret = Deno.env.get('WHATSAPP_APP_SECRET')
  if (!appId || !appSecret) throw new InternalError('WhatsApp Embedded Signup is not configured (missing app credentials)')

  const url = new URL(`${GRAPH_BASE}/oauth/access_token`)
  url.searchParams.set('client_id', appId)
  url.searchParams.set('client_secret', appSecret)
  url.searchParams.set('code', code)

  const response = await fetch(url)
  const json = (await response.json()) as { access_token?: string } & MetaErrorPayload
  if (!response.ok || !json.access_token) throw new MetaGraphApiError(json, response.status)
  return { accessToken: json.access_token }
}

async function getPhoneNumbersForWaba(wabaId: string, accessToken: string): Promise<EmbeddedSignupCandidate[]> {
  const { data } = await graphGet<{
    data: Array<{
      id: string
      display_phone_number: string
      verified_name: string
      quality_rating?: string
      messaging_limit_tier?: string
    }>
  }>(`/${wabaId}/phone_numbers`, accessToken)

  return data.map((phone) => ({
    wabaId,
    phoneNumberId: phone.id,
    displayPhoneNumber: phone.display_phone_number,
    verifiedName: phone.verified_name,
    qualityRating: phone.quality_rating ?? null,
    messagingLimitTier: phone.messaging_limit_tier ?? null,
  }))
}

/** Businesses -> WABAs (owned and shared-with) -> phone numbers, for whichever businesses the
 * just-exchanged token has access to. Graph API is the source of truth here -- nothing from the
 * Embedded Signup popup itself is trusted for this list. */
export async function discoverWhatsAppBusinessAssets(accessToken: string): Promise<EmbeddedSignupCandidate[]> {
  const { data: businesses } = await graphGet<{ data: Array<{ id: string }> }>('/me/businesses', accessToken)

  const wabaIds = new Set<string>()
  for (const business of businesses) {
    const [owned, client] = await Promise.all([
      graphGet<{ data: Array<{ id: string }> }>(`/${business.id}/owned_whatsapp_business_accounts`, accessToken).catch(
        () => ({ data: [] }),
      ),
      graphGet<{ data: Array<{ id: string }> }>(`/${business.id}/client_whatsapp_business_accounts`, accessToken).catch(
        () => ({ data: [] }),
      ),
    ])
    for (const waba of [...owned.data, ...client.data]) wabaIds.add(waba.id)
  }

  const candidateLists = await Promise.all(
    [...wabaIds].map((wabaId) => getPhoneNumbersForWaba(wabaId, accessToken)),
  )
  return candidateLists.flat()
}

/** Re-fetches the SELECTED candidate's details fresh at the moment of storage, rather than
 * trusting whatever the frontend echoes back from the discover step's response. */
export async function getPhoneNumberDetails(
  phoneNumberId: string,
  accessToken: string,
): Promise<Omit<EmbeddedSignupCandidate, 'wabaId' | 'phoneNumberId'>> {
  const details = await graphGet<{
    display_phone_number: string
    verified_name: string
    quality_rating?: string
    messaging_limit_tier?: string
  }>(`/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating,messaging_limit_tier`, accessToken)

  return {
    displayPhoneNumber: details.display_phone_number,
    verifiedName: details.verified_name,
    qualityRating: details.quality_rating ?? null,
    messagingLimitTier: details.messaging_limit_tier ?? null,
  }
}

/** Attaches the WABA to Chatiox's already-configured app-level webhook URL/fields -- without this,
 * the single global webhook subscription never receives events for this specific WABA. */
export async function subscribeWabaToWebhook(wabaId: string, accessToken: string): Promise<void> {
  const url = `${GRAPH_BASE}/${wabaId}/subscribed_apps`
  const response = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } })
  const json = (await response.json()) as MetaErrorPayload
  if (!response.ok) throw new MetaGraphApiError(json, response.status)
}
