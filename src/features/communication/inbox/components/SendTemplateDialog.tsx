import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useChannelTemplatesByConnection } from '@/features/marketing/templates/hooks/useChannelTemplatesByConnection'
import { useSendMessage } from '@/features/communication/inbox/hooks/useSendMessage'
import type { ChannelTemplateDTO } from '@/features/marketing/templates/types/template.types'

export function SendTemplateDialog({
  open,
  onOpenChange,
  conversationId,
  channelConnectionId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId: string
  channelConnectionId: string
}) {
  const [selected, setSelected] = useState<ChannelTemplateDTO | null>(null)
  const [variables, setVariables] = useState<string[]>([])
  const { data: channelTemplates, isLoading } = useChannelTemplatesByConnection(channelConnectionId)
  const sendMessage = useSendMessage(conversationId)

  const approved = channelTemplates?.filter((ct) => ct.status === 'approved') ?? []

  function handleSelect(ct: ChannelTemplateDTO) {
    setSelected(ct)
    setVariables(new Array<string>(ct.variables.length).fill(''))
  }

  function reset() {
    setSelected(null)
    setVariables([])
  }

  async function handleSend() {
    if (!selected) return
    await sendMessage.mutateAsync({
      template: { name: selected.providerTemplateName, languageCode: selected.languageCode, variables },
    })
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) reset(); onOpenChange(next); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send template</DialogTitle>
        </DialogHeader>

        {!selected ? (
          <div className="space-y-1.5">
            {isLoading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Loading templates...</p>
            ) : approved.length > 0 ? (
              approved.map((ct) => (
                <button
                  key={ct.id}
                  type="button"
                  onClick={() => { handleSelect(ct); }}
                  className="flex w-full flex-col gap-0.5 rounded-md border px-3 py-2.5 text-left text-[13px] hover:bg-muted"
                >
                  <span className="font-medium text-foreground">{ct.providerTemplateName}</span>
                  {ct.body && <span className="line-clamp-2 text-muted-foreground">{ct.body}</span>}
                </button>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No approved templates for this channel yet -- sync them from the Templates page.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/40 px-3 py-2.5 text-[13px]">
              <p className="font-medium text-foreground">{selected.providerTemplateName}</p>
              {selected.body && <p className="mt-1 text-muted-foreground">{selected.body}</p>}
            </div>
            {variables.length > 0 && (
              <div className="space-y-3">
                {variables.map((value, index) => (
                  <div key={index} className="space-y-1.5">
                    <Label htmlFor={`template-var-${String(index)}`}>Variable {index + 1}</Label>
                    <Input
                      id={`template-var-${String(index)}`}
                      value={value}
                      onChange={(e) => {
                        setVariables((prev) => prev.map((v, i) => (i === index ? e.target.value : v)))
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={reset}>
                Back
              </Button>
              <Button
                className="flex-1"
                disabled={sendMessage.isPending || variables.some((v) => !v.trim())}
                onClick={() => void handleSend()}
              >
                {sendMessage.isPending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
