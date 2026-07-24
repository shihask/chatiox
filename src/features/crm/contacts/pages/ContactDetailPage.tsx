import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ApiError } from '@/api/apiClient'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ContactForm } from '@/features/crm/contacts/components/ContactForm'
import { DeleteContactDialog } from '@/features/crm/contacts/components/DeleteContactDialog'
import { useContact } from '@/features/crm/contacts/hooks/useContact'
import { useDeleteContact } from '@/features/crm/contacts/hooks/useDeleteContact'
import { useSaveContactWithChannels } from '@/features/crm/contacts/hooks/useSaveContactWithChannels'
import type { ContactFormValues } from '@/features/crm/contacts/schemas/contact.schema'

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const { data: contact, isLoading, isError, error, refetch } = useContact(id)
  const saveContact = useSaveContactWithChannels()
  const deleteContact = useDeleteContact()

  if (isLoading) return <LoadingState label="Loading contact..." />

  if (isError || !contact) {
    return (
      <ErrorState
        message={error instanceof ApiError ? error.message : 'Contact not found'}
        onRetry={() => void refetch()}
      />
    )
  }

  async function handleSave(values: ContactFormValues) {
    if (!id || !contact) return
    await saveContact.mutateAsync({ id, values, originalChannels: contact.channels })
  }

  async function handleDelete() {
    if (!id) return
    await deleteContact.mutateAsync(id)
    void navigate('/contacts')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="min-w-0 truncate text-2xl font-semibold">
          {contact.firstName} {contact.lastName ?? ''}
        </h1>
        <Button
          variant="destructive"
          className="self-start sm:self-auto"
          onClick={() => { setIsDeleteOpen(true); }}
        >
          Archive contact
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactForm
            initialValues={contact}
            onSubmit={handleSave}
            isSubmitting={saveContact.isPending}
            submitLabel="Save changes"
          />
        </CardContent>
      </Card>

      <DeleteContactDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        contactName={`${contact.firstName} ${contact.lastName ?? ''}`}
        onConfirm={() => void handleDelete()}
        isDeleting={deleteContact.isPending}
      />
    </div>
  )
}
