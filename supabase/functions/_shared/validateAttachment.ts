import { BadRequestError } from './errors.ts'
import { getAttachmentKind, type AttachmentKind } from './attachmentKind.ts'

const MAX_FILENAME_LENGTH = 255

// This pass only sends images end to end (upload -> send -> render) -- Documents/Audio/Video
// fast-follow by adding their own entry to both maps below, not by relaxing this allowlist.
const SUPPORTED_KINDS: AttachmentKind[] = ['image']
const MAX_SIZE_BYTES_BY_KIND: Partial<Record<AttachmentKind, number>> = {
  image: 5 * 1024 * 1024, // WhatsApp's image ceiling
}
const SUPPORTED_CONTENT_TYPES_BY_KIND: Partial<Record<AttachmentKind, string[]>> = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
}

/** Rejects obviously-bad uploads before they ever reach a provider -- not relying on Meta (or any
 * future provider) to be the only thing standing between a user and a bad request. Providers may
 * still apply their own stricter limits on top of this. */
export function validateAttachment(input: { contentType: string; sizeBytes: number; filename?: string }): void {
  if (input.sizeBytes <= 0) throw new BadRequestError('Attachment is empty')
  if (input.filename && input.filename.length > MAX_FILENAME_LENGTH) {
    throw new BadRequestError(`Filename is too long (max ${String(MAX_FILENAME_LENGTH)} characters)`)
  }

  const kind = getAttachmentKind(input.contentType)
  if (!SUPPORTED_KINDS.includes(kind)) {
    throw new BadRequestError(`${kind === 'other' ? 'This file type' : `${kind} attachments`} isn't supported yet -- only images are supported right now`)
  }

  const supportedTypes = SUPPORTED_CONTENT_TYPES_BY_KIND[kind]
  if (supportedTypes && !supportedTypes.includes(input.contentType)) {
    throw new BadRequestError(`Unsupported ${kind} type: ${input.contentType}`)
  }

  const maxSize = MAX_SIZE_BYTES_BY_KIND[kind]
  if (maxSize && input.sizeBytes > maxSize) {
    throw new BadRequestError(`Attachment is too large (max ${String(Math.round(maxSize / 1024 / 1024))}MB)`)
  }
}
