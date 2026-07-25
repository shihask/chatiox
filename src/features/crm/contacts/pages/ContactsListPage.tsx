import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'
import { ApiError } from '@/api/apiClient'
import { useAuth } from '@/features/auth/context/useAuth'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { usePagination } from '@/hooks/usePagination'
import { ContactFiltersBar, type ContactFilters } from '@/features/crm/contacts/components/ContactFiltersBar'
import { ContactsTable } from '@/features/crm/contacts/components/ContactsTable'
import { useCreateContactDialog } from '@/features/crm/contacts/context/useCreateContactDialog'
import { useContacts } from '@/features/crm/contacts/hooks/useContacts'

export function ContactsListPage() {
  const auth = useAuth()
  const { page, pageSize, setPage, resetPage } = usePagination()
  const [filters, setFilters] = useState<ContactFilters>({ search: '', assignedToMe: false })
  const debouncedSearch = useDebouncedValue(filters.search, 300)
  const createContactDialog = useCreateContactDialog()

  const currentUserId = auth.status === 'authenticated' ? auth.user.id : undefined

  const { data, isLoading, isError, error, refetch } = useContacts({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    leadStatusId: filters.leadStatusId,
    leadSourceId: filters.leadSourceId,
    assignedToUserId: filters.assignedToMe ? currentUserId : undefined,
  })

  function handleFiltersChange(next: ContactFilters) {
    setFilters(next)
    resetPage()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Contacts</h1>
          <p className="font-label text-xs text-muted-foreground">
            {data ? `${String(data.meta.total)} contacts in this workspace` : 'Track leads and customers in one place.'}
          </p>
        </div>
        <Button onClick={createContactDialog.open} className="gap-1.5">
          <PlusIcon className="h-4 w-4" />
          Add Contact
        </Button>
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
    </div>
  )
}
