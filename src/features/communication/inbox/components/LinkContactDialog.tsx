import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useContacts } from '@/features/crm/contacts/hooks/useContacts'
import { useLinkContact } from '@/features/communication/inbox/hooks/useLinkContact'
import { useCreateContactForConversation } from '@/features/communication/inbox/hooks/useCreateContactForConversation'

export function LinkContactDialog({
  open,
  onOpenChange,
  conversationId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId: string
}) {
  const [search, setSearch] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)

  const linkContact = useLinkContact()
  const createContact = useCreateContactForConversation()

  const { data, isLoading } = useContacts({ page: 1, pageSize: 8, search: debouncedSearch || undefined })

  function reset() {
    setSearch('')
    setFirstName('')
    setLastName('')
  }

  async function handleLink(contactId: string) {
    await linkContact.mutateAsync({ id: conversationId, contactId })
    reset()
    onOpenChange(false)
  }

  async function handleCreate() {
    if (!firstName.trim()) return
    await createContact.mutateAsync({ id: conversationId, firstName: firstName.trim(), lastName: lastName.trim() || undefined })
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) reset(); onOpenChange(next); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link contact</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="existing">
          <TabsList className="w-full">
            <TabsTrigger value="existing" className="flex-1">
              Existing contact
            </TabsTrigger>
            <TabsTrigger value="new" className="flex-1">
              Create new
            </TabsTrigger>
          </TabsList>
          <TabsContent value="existing" className="space-y-3">
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); }}
            />
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {isLoading ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Searching...</p>
              ) : data && data.data.length > 0 ? (
                data.data.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => void handleLink(contact.id)}
                    disabled={linkContact.isPending}
                    className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-[13px] hover:bg-muted disabled:opacity-50"
                  >
                    <span className="font-medium text-foreground">
                      {contact.firstName} {contact.lastName ?? ''}
                    </span>
                    <span className="text-muted-foreground">
                      {contact.channels.find((c) => c.isPrimary)?.value ?? contact.channels[0]?.value ?? ''}
                    </span>
                  </button>
                ))
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">No contacts found.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="new" className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="conv-first-name">First name</Label>
              <Input id="conv-first-name" value={firstName} onChange={(e) => { setFirstName(e.target.value); }} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="conv-last-name">Last name</Label>
              <Input id="conv-last-name" value={lastName} onChange={(e) => { setLastName(e.target.value); }} />
            </div>
            <Button
              className="w-full"
              disabled={!firstName.trim() || createContact.isPending}
              onClick={() => void handleCreate()}
            >
              {createContact.isPending ? 'Creating...' : 'Create & link'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
