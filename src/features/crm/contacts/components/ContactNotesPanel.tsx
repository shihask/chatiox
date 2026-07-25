import { useState } from 'react'
import { Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/features/auth/context/useAuth'
import { useNotes } from '@/features/crm/contacts/hooks/useNotes'
import { useCreateNote } from '@/features/crm/contacts/hooks/useCreateNote'
import { useDeleteNote } from '@/features/crm/contacts/hooks/useDeleteNote'
import { formatRelativeTime } from '@/lib/date'

export function ContactNotesPanel({ contactId }: { contactId: string }) {
  const auth = useAuth()
  const [draft, setDraft] = useState('')
  const { data: notes, isLoading } = useNotes(contactId)
  const createNote = useCreateNote(contactId)
  const deleteNote = useDeleteNote(contactId)

  async function handleAddNote() {
    if (!draft.trim()) return
    await createNote.mutateAsync(draft.trim())
    setDraft('')
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <textarea
          value={draft}
          onChange={(e) => { setDraft(e.target.value); }}
          placeholder="Add a note about this contact..."
          className="min-h-16 w-full resize-y rounded-md border bg-background px-3 py-2.5 text-[13px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => void handleAddNote()}
            disabled={!draft.trim() || createNote.isPending}
          >
            {createNote.isPending ? 'Saving...' : 'Save note'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : notes && notes.length > 0 ? (
        <div className="space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="group rounded-md border bg-muted/40 px-3.5 py-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-foreground/90">
                  {note.body}
                </p>
                <button
                  type="button"
                  onClick={() => void deleteNote.mutateAsync(note.id)}
                  className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  aria-label="Delete note"
                >
                  <Trash2Icon className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="font-label mt-2 text-[11px] text-muted-foreground">
                {auth.status === 'authenticated' && note.createdBy === auth.user.id ? 'You' : 'Team member'}
                {' · '}
                {formatRelativeTime(note.createdAt)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">No notes yet.</p>
      )}
    </div>
  )
}
