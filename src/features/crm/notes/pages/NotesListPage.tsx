import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable, type DataTableColumn } from '@/components/data-table/DataTable'
import { useNotes } from '@/features/crm/notes/hooks/useNotes'
import { useDeleteNote } from '@/features/crm/notes/hooks/useDeleteNote'
import { useAuth } from '@/features/auth/context/useAuth'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { usePagination } from '@/hooks/usePagination'
import { formatRelativeTime } from '@/lib/date'
import { ApiError } from '@/api/apiClient'
import type { NoteDTO } from '@/features/crm/notes/types/note.types'
import { Trash2Icon } from 'lucide-react'

export function NotesListPage() {
  const auth = useAuth()
  const { page, pageSize, setPage, resetPage } = usePagination()
  const [search, setSearch] = useState('')
  const [byMe, setByMe] = useState(false)
  const debouncedSearch = useDebouncedValue(search, 300)
  const deleteNote = useDeleteNote()

  const currentUserId = auth.status === 'authenticated' ? auth.user.id : undefined

  const { data, isLoading, isError, error, refetch } = useNotes({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    authorId: byMe ? currentUserId : undefined,
  })

  function handleSearchChange(value: string) {
    setSearch(value)
    resetPage()
  }

  const columns: DataTableColumn<NoteDTO>[] = [
    {
      id: 'body',
      header: 'Note',
      cell: (note) => (
        <p className="line-clamp-2 max-w-md whitespace-pre-wrap text-foreground/90">{note.body}</p>
      ),
    },
    {
      id: 'contact',
      header: 'Contact',
      cell: (note) =>
        note.contact ? (
          <Link to={`/contacts/${note.contact.id}`} className="font-medium hover:underline">
            {note.contact.firstName} {note.contact.lastName ?? ''}
          </Link>
        ) : (
          '—'
        ),
    },
    {
      id: 'author',
      header: 'Author',
      cell: (note) =>
        auth.status === 'authenticated' && note.createdBy === auth.user.id ? 'You' : 'Team member',
    },
    {
      id: 'createdAt',
      header: 'Added',
      cell: (note) => (
        <span className="font-label text-[11px] text-muted-foreground">
          {formatRelativeTime(note.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: (note) => (
        <button
          type="button"
          onClick={() => void deleteNote.mutateAsync(note.id)}
          className="text-muted-foreground hover:text-destructive"
          aria-label="Delete note"
        >
          <Trash2Icon className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Notes</h1>
        <p className="font-label text-xs text-muted-foreground">
          Every note your team has added across all contacts.
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search notes..."
          value={search}
          onChange={(e) => { handleSearchChange(e.target.value); }}
          className="sm:max-w-xs"
        />
        <Button
          type="button"
          variant={byMe ? 'default' : 'outline'}
          size="sm"
          className="font-label h-8 text-[11px] font-medium tracking-wide uppercase"
          onClick={() => { setByMe((prev) => !prev); resetPage(); }}
        >
          By me
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        getRowId={(note) => note.id}
        isLoading={isLoading}
        error={isError ? (error instanceof ApiError ? error.message : 'Failed to load notes') : null}
        onRetry={() => void refetch()}
        emptyTitle="No notes yet"
        emptyDescription="Notes you add from a contact's detail page will show up here."
        page={page}
        pageSize={pageSize}
        total={data?.meta.total ?? 0}
        onPageChange={setPage}
      />
    </div>
  )
}
