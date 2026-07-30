export type AttachmentKind = 'image' | 'document' | 'audio' | 'video' | 'other'

/** Derived from MIME type, not stored separately -- one place providers/services decide which
 * bucket a file falls into (e.g. WhatsApp's `type` field when sending), instead of scattering
 * `contentType.startsWith('image/')` checks throughout the codebase. */
export function getAttachmentKind(contentType: string): AttachmentKind {
  if (contentType.startsWith('image/')) return 'image'
  if (contentType.startsWith('video/')) return 'video'
  if (contentType.startsWith('audio/')) return 'audio'
  if (
    contentType === 'application/pdf' ||
    contentType.startsWith('application/vnd.') ||
    contentType === 'application/msword' ||
    contentType === 'application/zip' ||
    contentType === 'text/plain'
  ) {
    return 'document'
  }
  return 'other'
}
