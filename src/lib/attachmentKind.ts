// Mirrors supabase/functions/_shared/attachmentKind.ts -- keep in sync.
export type AttachmentKind = 'image' | 'document' | 'audio' | 'video' | 'other'

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
