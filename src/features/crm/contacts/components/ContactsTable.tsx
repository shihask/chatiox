import { Link } from 'react-router-dom'
import { DataTable, type DataTableColumn } from '@/components/data-table/DataTable'
import { ContactChannelBadges } from '@/features/crm/contacts/components/ContactChannelBadges'
import { LeadStatusBadge } from '@/features/crm/contacts/components/LeadStatusBadge'
import { formatDate } from '@/lib/date'
import { avatarClassFor } from '@/lib/avatarColor'
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
      header: 'Contact',
      cell: (contact) => (
        <Link to={`/contacts/${contact.id}`} className="flex items-center gap-2.5">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${avatarClassFor(contact.id)}`}
          >
            {contact.firstName.slice(0, 1)}
            {contact.lastName?.slice(0, 1) ?? ''}
          </span>
          <span className="font-semibold text-foreground hover:underline">
            {contact.firstName} {contact.lastName ?? ''}
          </span>
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
      className: 'hidden md:table-cell',
    },
    {
      id: 'createdAt',
      header: 'Created',
      cell: (contact) => formatDate(contact.createdAt),
      className: 'hidden sm:table-cell',
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
