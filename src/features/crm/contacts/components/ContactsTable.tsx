import { Link } from 'react-router-dom'
import { DataTable, type DataTableColumn } from '@/components/data-table/DataTable'
import { ContactChannelBadges } from '@/features/crm/contacts/components/ContactChannelBadges'
import { LeadStatusBadge } from '@/features/crm/contacts/components/LeadStatusBadge'
import { formatDate } from '@/lib/date'
import type { ContactDTO } from '@/features/crm/contacts/types/contact.types'

export function ContactsTable({
  contacts,
  isLoading,
  error,
  onRetry,
  page,
  pageSize,
  total,
  onPageChange,
}: {
  contacts: ContactDTO[]
  isLoading: boolean
  error: string | null
  onRetry: () => void
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}) {
  const columns: DataTableColumn<ContactDTO>[] = [
    {
      id: 'name',
      header: 'Name',
      cell: (contact) => (
        <Link to={`/contacts/${contact.id}`} className="font-medium hover:underline">
          {contact.firstName} {contact.lastName ?? ''}
        </Link>
      ),
    },
    {
      id: 'channels',
      header: 'Channels',
      cell: (contact) => <ContactChannelBadges channels={contact.channels} />,
    },
    {
      id: 'leadStatus',
      header: 'Lead Status',
      cell: (contact) => <LeadStatusBadge status={contact.leadStatus} />,
    },
    {
      id: 'leadSource',
      header: 'Lead Source',
      cell: (contact) => contact.leadSource?.name ?? '—',
    },
    {
      id: 'createdAt',
      header: 'Created',
      cell: (contact) => formatDate(contact.createdAt),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={contacts}
      getRowId={(contact) => contact.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No contacts yet"
      emptyDescription="Add your first contact to start tracking leads."
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
    />
  )
}
