import { useState } from 'react'
import { Check, CheckCheck, Clock, TriangleAlert } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { formatDateTime } from '@/lib/date'
import { getAttachmentKind } from '@/lib/attachmentKind'
import type { MessageAttachmentDTO, MessageDTO } from '@/features/communication/inbox/types/inbox.types'

function StatusIndicator({ status, errorMessage }: { status: MessageDTO['status']; errorMessage: string | null }) {
  switch (status) {
    case 'queued':
      return <Clock className="h-3 w-3 text-primary-foreground/70" aria-label="Queued" />
    case 'sent':
      return <Check className="h-3 w-3 text-primary-foreground/70" aria-label="Sent" />
    case 'delivered':
      return <CheckCheck className="h-3 w-3 text-primary-foreground/70" aria-label="Delivered" />
    case 'read':
      return <CheckCheck className="h-3 w-3 text-sky-300" aria-label="Read" />
    case 'failed':
      return (
        <span className="flex items-center gap-1 text-destructive" title={errorMessage ?? 'Failed to send'}>
          <TriangleAlert className="h-3 w-3" aria-label="Failed" />
        </span>
      )
    default:
      return null
  }
}

function ImageAttachment({ attachment }: { attachment: MessageAttachmentDTO }) {
  const [viewerOpen, setViewerOpen] = useState(false)
  if (!attachment.url) return null

  return (
    <>
      {/* Fixed bounding box (not just a max-size cap) so a small source image -- an icon, a
       * screenshot thumbnail -- still shows at a usable preview size instead of its native pixels. */}
      <button type="button" onClick={() => { setViewerOpen(true); }} className="block h-48 w-48 max-w-full overflow-hidden rounded-md">
        <img src={attachment.url} alt={attachment.fileName ?? 'Image attachment'} className="h-full w-full object-cover" />
      </button>
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="flex max-w-3xl items-center justify-center border-none bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">{attachment.fileName ?? 'Image attachment'}</DialogTitle>
          <img src={attachment.url} alt={attachment.fileName ?? 'Image attachment'} className="max-h-[85vh] max-w-[85vw] rounded-md object-contain" />
        </DialogContent>
      </Dialog>
    </>
  )
}

export function MessageBubble({ message }: { message: MessageDTO }) {
  const isOutbound = message.direction === 'outbound'

  if (message.messageType === 'system') {
    return (
      <div className="flex justify-center py-1">
        <span className="rounded-full bg-muted px-3 py-1 text-[11.5px] text-muted-foreground">{message.body}</span>
      </div>
    )
  }

  const imageAttachment = message.attachments.find((a) => getAttachmentKind(a.contentType) === 'image')

  return (
    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-lg px-3 py-2 text-[13.5px] leading-relaxed whitespace-pre-wrap ${
          isOutbound ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
        }`}
      >
        {imageAttachment && (
          <div className="mb-1.5">
            <ImageAttachment attachment={imageAttachment} />
          </div>
        )}
        {message.body && <p>{message.body}</p>}
        {!message.body && !imageAttachment && <p>(no content)</p>}
        <div
          className={`mt-1 flex items-center justify-end gap-1 text-[10.5px] ${
            isOutbound ? 'text-primary-foreground/70' : 'text-muted-foreground'
          }`}
        >
          <span>{formatDateTime(message.occurredAt)}</span>
          {isOutbound && <StatusIndicator status={message.status} errorMessage={message.errorMessage} />}
        </div>
        {message.status === 'failed' && message.errorMessage && (
          <p className="mt-1 text-[11px] text-red-200 italic">{message.errorMessage}</p>
        )}
      </div>
    </div>
  )
}
