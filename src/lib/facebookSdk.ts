// Loads Meta's JS SDK lazily (only when a user actually clicks "Connect with Meta" -- no reason to
// load it for every visitor) and wraps the WhatsApp Embedded Signup popup.
//
// Two signals come out of a completed flow, and both matter differently:
// - The `code` (login callback) is the only thing that lets the backend act (exchanged for an
//   access token) -- nothing here can be spoofed into granting access to anything.
// - The `waba_id`/`phone_number_id` (and `waba_ids` for multi-WABA businesses) reported via
//   Meta's `WA_EMBEDDED_SIGNUP` postMessage event are the documented, intended way a Tech
//   Provider learns WHICH asset the customer just granted inside Meta's own hosted UI -- this
//   isn't "trusting the popup for security", it's the mechanism Meta built for exactly this
//   handoff. What still never happens is treating these IDs' associated metadata (phone number,
//   business name, etc.) as trustworthy without an independent Graph API fetch after the code
//   exchange -- the IDs say *which* asset was granted, Graph API says *what it actually is*.
const SDK_URL = 'https://connect.facebook.net/en_US/sdk.js'
const GRAPH_API_VERSION = 'v21.0'

interface FacebookLoginResponse {
  status: 'connected' | 'not_authorized' | 'unknown'
  authResponse: { code?: string } | null
}

interface FacebookSdk {
  init(options: { appId: string; autoLogAppEvents: boolean; xfbml: boolean; version: string }): void
  login(
    callback: (response: FacebookLoginResponse) => void,
    options: {
      config_id: string
      response_type: 'code'
      override_default_response_type: true
      extras: { setup: Record<string, never> }
    },
  ): void
}

declare global {
  interface Window {
    FB?: FacebookSdk
    fbAsyncInit?: () => void
  }
}

let sdkLoadPromise: Promise<FacebookSdk> | null = null

function loadFacebookSdk(appId: string): Promise<FacebookSdk> {
  sdkLoadPromise ??= new Promise((resolve) => {
    window.fbAsyncInit = () => {
      window.FB?.init({ appId, autoLogAppEvents: true, xfbml: false, version: GRAPH_API_VERSION })
      if (window.FB) resolve(window.FB)
    }
    const script = document.createElement('script')
    script.src = SDK_URL
    script.async = true
    script.defer = true
    document.body.appendChild(script)
  })
  return sdkLoadPromise
}

interface EmbeddedSignupSessionInfo {
  wabaId?: string
  wabaIds?: string[]
  phoneNumberId?: string
}

/** Listens for Meta's WA_EMBEDDED_SIGNUP postMessage events (fired from facebook.com/business.facebook.com
 * during the popup flow) and resolves with whatever asset IDs came through on the FINISH event. */
function listenForSessionInfo(): { result: Promise<EmbeddedSignupSessionInfo>; stop: () => void } {
  let resolveResult: (info: EmbeddedSignupSessionInfo) => void
  const result = new Promise<EmbeddedSignupSessionInfo>((resolve) => {
    resolveResult = resolve
  })

  function handleMessage(event: MessageEvent) {
    if (!/^https:\/\/(www\.)?facebook\.com$/.test(event.origin) && !/^https:\/\/business\.facebook\.com$/.test(event.origin)) return
    try {
      const data = JSON.parse(event.data as string) as { type?: string; event?: string; data?: EmbeddedSignupSessionInfo }
      if (data.type === 'WA_EMBEDDED_SIGNUP' && data.event === 'FINISH' && data.data) {
        resolveResult({
          wabaId: data.data.wabaId,
          wabaIds: data.data.wabaIds,
          phoneNumberId: data.data.phoneNumberId,
        })
      }
    } catch {
      // Not a JSON message we care about (Meta's popup fires other, unrelated postMessage traffic).
    }
  }

  window.addEventListener('message', handleMessage)
  return { result, stop: () => { window.removeEventListener('message', handleMessage) } }
}

/** Opens Meta's hosted Embedded Signup popup. Resolves with the short-lived authorization `code`
 * plus whichever WABA/phone number IDs Meta's session-info event reported (best-effort -- the
 * code exchange + a fresh Graph API fetch is what actually matters for storage, not these IDs'
 * associated metadata). Rejects if the popup is dismissed or denied. */
export async function loginWithEmbeddedSignup(
  appId: string,
  configId: string,
): Promise<{ code: string } & EmbeddedSignupSessionInfo> {
  const FB = await loadFacebookSdk(appId)
  const session = listenForSessionInfo()

  try {
    const { code } = await new Promise<{ code: string }>((resolve, reject) => {
      FB.login(
        (response) => {
          if (response.status !== 'connected' || !response.authResponse?.code) {
            reject(new Error('Meta sign-in was cancelled or denied.'))
            return
          }
          resolve({ code: response.authResponse.code })
        },
        { config_id: configId, response_type: 'code', override_default_response_type: true, extras: { setup: {} } },
      )
    })

    // The session-info postMessage can arrive slightly before or after the login callback fires --
    // give it a brief window rather than assuming it already resolved.
    const sessionInfo = await Promise.race([session.result, new Promise<EmbeddedSignupSessionInfo>((resolve) => setTimeout(() => { resolve({}); }, 1500))])
    return { code, ...sessionInfo }
  } finally {
    session.stop()
  }
}
