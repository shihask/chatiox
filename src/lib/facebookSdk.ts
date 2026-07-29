// Loads Meta's JS SDK lazily (only when a user actually clicks "Connect with Meta" -- no reason to
// load it for every visitor) and wraps the WhatsApp Embedded Signup popup. Only the authorization
// `code` from the login callback is trusted; any waba_id/phone_number_id Meta's popup might also
// surface is deliberately ignored -- Graph API (server-side, after the code exchange) is the
// source of truth for which businesses/WABAs/phone numbers exist, not the popup payload.
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
    options: { config_id: string; response_type: 'code'; override_default_response_type: true },
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

/** Opens Meta's hosted Embedded Signup popup and resolves with the short-lived authorization
 * `code` once the user completes it there. Rejects if the popup is dismissed or denied. */
export async function loginWithEmbeddedSignup(appId: string, configId: string): Promise<{ code: string }> {
  const FB = await loadFacebookSdk(appId)

  return new Promise((resolve, reject) => {
    FB.login(
      (response) => {
        if (response.status !== 'connected' || !response.authResponse?.code) {
          reject(new Error('Meta sign-in was cancelled or denied.'))
          return
        }
        resolve({ code: response.authResponse.code })
      },
      { config_id: configId, response_type: 'code', override_default_response_type: true },
    )
  })
}
