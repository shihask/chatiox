import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function DeleteContactDialog({
  open,
  onOpenChange,
  contactName,
  onConfirm,
  isDeleting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  contactName: string
  onConfirm: () => void
  isDeleting: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive {contactName}?</DialogTitle>
          {/* Soft delete, not permanent -- see docs/architecture.md §4 -- so the copy here must not
              suggest data loss. */}
          <DialogDescription>
            This archives the contact. It won&apos;t appear in your contacts list anymore, but the
            record is kept and can be recovered later if needed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); }} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Archiving...' : 'Archive contact'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
