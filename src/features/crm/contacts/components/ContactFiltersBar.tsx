import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLeadSources } from '@/features/crm/contacts/hooks/useLeadSources'
import { useLeadStatuses } from '@/features/crm/contacts/hooks/useLeadStatuses'

export interface ContactFilters {
  search: string
  leadStatusId?: string
  leadSourceId?: string
  assignedToMe: boolean
}

export function ContactFiltersBar({
  filters,
  onChange,
}: {
  filters: ContactFilters
  onChange: (filters: ContactFilters) => void
}) {
  const { data: leadStatuses } = useLeadStatuses()
  const { data: leadSources } = useLeadSources()

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <Input
        placeholder="Search name, phone, email, or tag..."
        value={filters.search}
        onChange={(e) => { onChange({ ...filters, search: e.target.value }); }}
        className="w-full sm:max-w-xs"
      />
      <Select
        value={filters.leadStatusId ?? 'all'}
        onValueChange={(value) =>
          { onChange({ ...filters, leadStatusId: value && value !== 'all' ? value : undefined }); }
        }
      >
        <SelectTrigger className="w-full sm:w-[170px]">
          <SelectValue placeholder="Lead status">
            {(value: string) =>
              value === 'all' || !value
                ? 'All statuses'
                : (leadStatuses?.find((status) => status.id === value)?.name ?? 'Lead status')
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {leadStatuses?.map((status) => (
            <SelectItem key={status.id} value={status.id}>
              {status.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.leadSourceId ?? 'all'}
        onValueChange={(value) =>
          { onChange({ ...filters, leadSourceId: value && value !== 'all' ? value : undefined }); }
        }
      >
        <SelectTrigger className="w-full sm:w-[170px]">
          <SelectValue placeholder="Lead source">
            {(value: string) =>
              value === 'all' || !value
                ? 'All sources'
                : (leadSources?.find((source) => source.id === value)?.name ?? 'Lead source')
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All sources</SelectItem>
          {leadSources?.map((source) => (
            <SelectItem key={source.id} value={source.id}>
              {source.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant={filters.assignedToMe ? 'default' : 'outline'}
        size="sm"
        onClick={() => { onChange({ ...filters, assignedToMe: !filters.assignedToMe }); }}
      >
        Assigned to me
      </Button>
    </div>
  )
}
