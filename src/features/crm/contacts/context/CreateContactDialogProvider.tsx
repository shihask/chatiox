import { useState, type ReactNode } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ContactForm } from '@/features/crm/contacts/components/ContactForm'
import { CreateContactDialogContext } from '@/features/crm/contacts/context/CreateContactDialogContext'
import { useCreateContact } from '@/features/crm/contacts/hooks/useCreateContact'
import type { ContactFormValues } from '@/features/crm/contacts/schemas/contact.schema'

/** Single shared "Add contact" dialog -- opened from the Topbar button, the command palette, and
    the Contacts list page, so there's one dialog instance and one source of truth instead of three. */
export function CreateContactDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const createContact = useCreateContact()

  async function handleCreate(values: ContactFormValues) {
    await createContact.mutateAsync({
      firstName: values.firstName,
      lastName: values.lastName === '' ? undefined : values.lastName,
      tags: values.tags,
      channels: values.channels.map((channel) => ({
        channelType: channel.channelType,
        value: channel.value,
        isPrimary: channel.isPrimary,
      })),
      leadStatusId: values.leadStatusId,
      leadSourceId: values.leadSourceId,
      assignedToUserId: values.assignedToUserId,
    })
    setIsOpen(false)
  }

  return (
    <CreateContactDialogContext.Provider value={{ open: () => { setIsOpen(true); } }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add contact</DialogTitle>
          </DialogHeader>
          <ContactForm
            onSubmit={handleCreate}
            isSubmitting={createContact.isPending}
            submitLabel="Create contact"
          />
        </DialogContent>
      </Dialog>
    </CreateContactDialogContext.Provider>
  )
}
