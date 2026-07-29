import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useAuth } from '@/features/auth/context/useAuth'
import { useConversations } from '@/features/communication/inbox/hooks/useConversations'
import { ConversationListItem } from '@/features/communication/inbox/components/ConversationListItem'
import { ApiError } from '@/api/apiClient'
import type { ConversationDTO } from '@/features/communication/inbox/types/inbox.types'

export interface ConversationFilters {
  status?: ConversationDTO['status']
  unassigned?: boolean
  mineOnly?: boolean
}

export function ConversationList({
  filters,
  onFiltersChange,
  selectedId,
  onSelect,
}: {
  filters: ConversationFilters
  onFiltersChange: (next: ConversationFilters) => void
  selectedId: string | undefined
  onSelect: (id: string) => void
}) {
  const auth = useAuth()
  const currentUserId = auth.status === 'authenticated' ? auth.user.id : undefined

  const { data, isLoading, isError, error, refetch } = useConversations({
    page: 1,
    pageSize: 50,
    status: filters.status,
    unassigned: filters.unassigned ?? undefined,
    assignedToUserId: filters.mineOnly ? currentUserId : undefined,
  })

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 space-y-2 border-b p-3">
        <Tabs
          value={filters.status ?? 'all'}
          onValueChange={(value) => {
            onFiltersChange({ ...filters, status: value === 'all' ? undefined : (value as ConversationDTO['status']) })
          }}
        >
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              All
            </TabsTrigger>
            <TabsTrigger value="open" className="flex-1">
              Open
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex-1">
              Pending
            </TabsTrigger>
            <TabsTrigger value="closed" className="flex-1">
              Closed
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={filters.unassigned ? 'default' : 'outline'}
            className="h-6.5 flex-1 px-2 text-[11.5px]"
            onClick={() => { onFiltersChange({ ...filters, unassigned: !filters.unassigned }); }}
          >
            Unassigned
          </Button>
          <Button
            type="button"
            size="sm"
            variant={filters.mineOnly ? 'default' : 'outline'}
            className="h-6.5 flex-1 px-2 text-[11.5px]"
            onClick={() => { onFiltersChange({ ...filters, mineOnly: !filters.mineOnly }); }}
          >
            My conversations
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2 p-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : isError ? (
          <ErrorState
            message={error instanceof ApiError ? error.message : 'Failed to load conversations'}
            onRetry={() => void refetch()}
          />
        ) : data && data.data.length > 0 ? (
          data.data.map((conversation) => (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
              isSelected={conversation.id === selectedId}
              onClick={() => { onSelect(conversation.id); }}
            />
          ))
        ) : (
          <p className="p-6 text-center text-sm text-muted-foreground">No conversations yet.</p>
        )}
      </div>
    </div>
  )
}
