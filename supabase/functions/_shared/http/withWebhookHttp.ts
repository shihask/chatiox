import { errorToResponse } from '../errors.ts'
import type { Handler, WebhookHandler } from './requestContext.ts'

/** No JWT auth -- inbound provider webhooks authenticate via their own signature scheme, verified
 * inside the handler itself (see communication/webhooks.controller.ts). Structurally identical to
 * withPublicHttp today; kept separate so webhook-specific behavior can diverge later. */
export function withWebhookHttp(handler: WebhookHandler): Handler {
  return async (req, args) => {
    try {
      return await handler(req, args)
    } catch (err) {
      return errorToResponse(err)
    }
  }
}
