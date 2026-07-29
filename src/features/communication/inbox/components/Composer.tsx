import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useSendMessage } from '@/features/communication/inbox/hooks/useSendMessage'

export function Composer({ conversationId, disabled, disabledReason }: { conversationId: string; disabled?: boolean; disabledReason?: string }) {
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
      <div className="flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => { setDraft(e.target.value); }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={2}
          className="min-h-10 flex-1 resize-none rounded-md border bg-background px-3 py-2 text-[13px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Button onClick={() => void handleSend()} disabled={!draft.trim() || sendMessage.isPending}>
          {sendMessage.isPending ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </div>
  )
}
