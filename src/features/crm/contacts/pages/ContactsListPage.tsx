import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ApiError } from '@/api/apiClient'
import { useAuth } from '@/features/auth/context/useAuth'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { usePagination } from '@/hooks/usePagination'
import { ContactFiltersBar, type ContactFilters } from '@/features/crm/contacts/components/ContactFiltersBar'
import { ContactForm } from '@/features/crm/contacts/components/ContactForm'
import { ContactsTable } from '@/features/crm/contacts/components/ContactsTable'
import { useContacts } from '@/features/crm/contacts/hooks/useContacts'
import { useCreateContact } from '@/features/crm/contacts/hooks/useCreateContact'
import type { ContactFormValues } from '@/features/crm/contacts/schemas/contact.schema'

export function ContactsListPage() {
  const auth = useAuth()
  const { page, pageSize, setPage, resetPage } = usePagination()
  const [filters, setFilters] = useState<ContactFilters>({ search: '', assignedToMe: false })
  const debouncedSearch = useDebouncedValue(filters.search, 300)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const currentUserId = auth.status === 'authenticated' ? auth.user.id : undefined

  const { data, isLoading, isError, error, refetch } = useContacts({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    leadStatusId: filters.leadStatusId,
    leadSourceId: filters.leadSourceId,
    assignedToUserId: filters.assignedToMe ? currentUserId : undefined,
  })

  const createContact = useCreateContact()

  function handleFiltersChange(next: ContactFilters) {
    setFilters(next)
    resetPage()
  }

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
    setIsCreateOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Contacts</h1>
          <p className="text-sm text-muted-foreground">Track leads and customers in one place.</p>
        </div>
        <Button onClick={() => { setIsCreateOpen(true); }}>Add contact</Button>
      </div>

      <ContactFiltersBar filters={filters} onChange={handleFiltersChange} />

      <ContactsTable
        contacts={data?.data ?? []}
        isLoading={isLoading}
        error={isError ? (error instanceof ApiError ? error.message : 'Failed to load contacts') : null}
        onRetry={() => void refetch()}
        page={page}
        pageSize={pageSize}
        total={data?.meta.total ?? 0}
        onPageChange={setPage}
      />

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
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
    </div>
  )
}
