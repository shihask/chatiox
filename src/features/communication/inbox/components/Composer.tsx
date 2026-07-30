import { useState } from 'react'
import { FileTextIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSendMessage } from '@/features/communication/inbox/hooks/useSendMessage'

export function Composer({
  conversationId,
  disabled,
  disabledReason,
  warning,
  onOpenTemplateDialog,
}: {
  conversationId: string
  disabled?: boolean
  disabledReason?: string
  /** Advisory only -- shown above the composer but doesn't block sending. Meta's real API is the
   * actual enforcement authority for policy restrictions like the 24-hour customer care window;
   * a rejected send still surfaces Meta's real error on the message bubble, same as any other
   * failure -- Chatiox doesn't need to pre-emptively guess right when the real system will tell us. */
  warning?: string
  /** Opens the template picker -- the correct tool precisely when outside the 24h window, but
   * available regardless (also valid within it). */
  onOpenTemplateDialog?: () => void
}) {
  const [draft, setDraft] = useState('')
  const sendMessage = useSendMessage(conversationId)

  async function handleSend() {
    if (!draft.trim()) return
    const text = draft.trim()
    setDraft('')
    await sendMessage.mutateAsync({ text })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  if (disabled) {
    return (
      <div className="shrink-0 border-t bg-muted/40 p-3 text-center text-[12.5px] text-muted-foreground">
        {disabledReason ?? 'This channel is not connected.'}
      </div>
    )
  }

  return (
    <div className="shrink-0 border-t p-3">
      {warning && <p className="mb-2 text-[12px] text-muted-foreground">{warning}</p>}
      <div className="flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => { setDraft(e.target.value); }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={2}
          className="min-h-10 flex-1 resize-none rounded-md border bg-background px-3 py-2 text-[13px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        {onOpenTemplateDialog && (
          <Button type="button" variant="outline" size="icon" onClick={onOpenTemplateDialog} title="Send template">
            <FileTextIcon className="h-4 w-4" />
          </Button>
        )}
        <Button onClick={() => void handleSend()} disabled={!draft.trim() || sendMessage.isPending}>
          {sendMessage.isPending ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </div>
  )
}
