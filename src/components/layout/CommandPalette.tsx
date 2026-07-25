import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchIcon, LayoutDashboardIcon, UsersIcon, PlusIcon } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useContacts } from '@/features/crm/contacts/hooks/useContacts'
import { useCreateContactDialog } from '@/features/crm/contacts/context/useCreateContactDialog'

interface QuickAction {
  id: string
  label: string
  sub: string
  icon: typeof LayoutDashboardIcon
  onSelect: () => void
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 200)
  const navigate = useNavigate()
  const createContactDialog = useCreateContactDialog()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onOpenChange(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => { window.removeEventListener('keydown', onKeyDown); }
  }, [onOpenChange])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const { data } = useContacts({ page: 1, pageSize: 5, search: debouncedQuery || undefined })
  const contactResults = data?.data ?? []

  function handleOpenChange(next: boolean) {
    if (!next) setQuery('')
    onOpenChange(next)
  }

  function close() {
    handleOpenChange(false)
  }

  const quickActions: QuickAction[] = [
    {
      id: 'add-contact',
      label: 'Add Contact',
      sub: 'Create a new contact',
      icon: PlusIcon,
      onSelect: () => { close(); createContactDialog.open(); },
    },
    {
      id: 'go-contacts',
      label: 'Go to Contacts',
      sub: 'View contact list',
      icon: UsersIcon,
      onSelect: () => { close(); void navigate('/contacts'); },
    },
    {
      id: 'go-dashboard',
      label: 'Go to Dashboard',
      sub: 'Workspace overview',
      icon: LayoutDashboardIcon,
      onSelect: () => { close(); void navigate('/'); },
    },
  ].filter((action) => !query || action.label.toLowerCase().includes(query.toLowerCase()))

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-24 max-h-[70vh] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <div className="flex items-center gap-2.5 border-b px-4 py-3">
          <SearchIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); }}
            placeholder="Search contacts, or run a quick action..."
            className="flex-1 border-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <span className="font-label rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground">ESC</span>
        </div>
        <div className="overflow-y-auto p-2">
          {contactResults.length > 0 && (
            <>
              <div className="font-label px-2 pt-1.5 pb-1 text-[11px] font-medium text-muted-foreground">
                Contacts
              </div>
              {contactResults.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => { close(); void navigate(`/contacts/${contact.id}`); }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                >
                  <UsersIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">
                    {contact.firstName} {contact.lastName ?? ''}
                  </span>
                  <span className="text-xs text-muted-foreground">{contact.leadStatus?.name ?? ''}</span>
                </button>
              ))}
            </>
          )}
          {quickActions.length > 0 && (
            <>
              <div className="font-label px-2 pt-2.5 pb-1 text-[11px] font-medium text-muted-foreground">
                Quick actions
              </div>
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={action.onSelect}
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                >
                  <action.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{action.label}</span>
                  <span className="text-xs text-muted-foreground">{action.sub}</span>
                </button>
              ))}
            </>
          )}
          {contactResults.length === 0 && quickActions.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">No results</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
