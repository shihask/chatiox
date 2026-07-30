import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateTemplate } from '@/features/marketing/templates/hooks/useCreateTemplate'

const fieldLabelClass = 'font-label text-[11px] font-medium tracking-wider text-muted-foreground uppercase'

export function CreateTemplateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState('')
  const [purpose, setPurpose] = useState('')
  const createTemplate = useCreateTemplate()

  function reset() {
    setName('')
    setPurpose('')
  }

  async function handleSubmit() {
    if (!name.trim()) return
    await createTemplate.mutateAsync({ name: name.trim(), purpose: purpose.trim() || undefined })
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) reset(); onOpenChange(next); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New template</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="template-name" className={fieldLabelClass}>
              Name
            </Label>
            <Input
              id="template-name"
              placeholder="e.g. Welcome Message"
              value={name}
              onChange={(e) => { setName(e.target.value); }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="template-purpose" className={fieldLabelClass}>
              Purpose <span className="normal-case text-muted-foreground/70">(optional)</span>
            </Label>
            <Input
              id="template-purpose"
              placeholder="e.g. onboarding"
              value={purpose}
              onChange={(e) => { setPurpose(e.target.value); }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Create the approved WhatsApp version of this template in Meta Business Manager, then use
            "Sync from WhatsApp" to pull it in.
          </p>
          <Button type="submit" className="w-full" disabled={!name.trim() || createTemplate.isPending}>
            {createTemplate.isPending ? 'Saving...' : 'Create template'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
