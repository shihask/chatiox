import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, type DataTableColumn } from '@/components/data-table/DataTable'
import { TaskStatusBadge } from '@/features/crm/tasks/components/TaskStatusBadge'
import { useTasks } from '@/features/crm/tasks/hooks/useTasks'
import { useUpdateTask } from '@/features/crm/tasks/hooks/useUpdateTask'
import { useAuth } from '@/features/auth/context/useAuth'
import { usePagination } from '@/hooks/usePagination'
import { formatDate } from '@/lib/date'
import { ApiError } from '@/api/apiClient'
import type { TaskDTO, TaskStatus } from '@/features/crm/tasks/types/task.types'

const statusFilterOptions: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'all', label: 'All statuses' },
]

export function TasksListPage() {
  const auth = useAuth()
  const { page, pageSize, setPage, resetPage } = usePagination()
  const [status, setStatus] = useState<TaskStatus | 'all'>('open')
  const [assignedToMe, setAssignedToMe] = useState(false)
  const updateTask = useUpdateTask()

  const currentUserId = auth.status === 'authenticated' ? auth.user.id : undefined

  const { data, isLoading, isError, error, refetch } = useTasks({
    page,
    pageSize,
    status: status === 'all' ? undefined : status,
    assignedToUserId: assignedToMe ? currentUserId : undefined,
  })

  function handleStatusChange(value: string | null) {
    if (!value) return
    setStatus(value as TaskStatus | 'all')
    resetPage()
  }

  function toggleComplete(task: TaskDTO, isNowChecked: boolean) {
    void updateTask.mutateAsync({ id: task.id, input: { status: isNowChecked ? 'completed' : 'open' } })
  }

  const columns: DataTableColumn<TaskDTO>[] = [
    {
      id: 'title',
      header: 'Task',
      cell: (task) => (
        <div className="flex items-start gap-2.5">
          <Checkbox
            checked={task.status === 'completed'}
            onCheckedChange={(checked) => { toggleComplete(task, checked); }}
            disabled={task.status === 'cancelled'}
            className="mt-0.5"
          />
          <div>
            <p className="font-semibold text-foreground">{task.title}</p>
            {task.dueAt && (
              <p className="font-label text-[11px] text-muted-foreground">Due {formatDate(task.dueAt)}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'contact',
      header: 'Contact',
      cell: (task) =>
        task.contact ? (
          <Link to={`/contacts/${task.contact.id}`} className="font-medium hover:underline">
            {task.contact.firstName} {task.contact.lastName ?? ''}
          </Link>
        ) : (
          '—'
        ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (task) => <TaskStatusBadge status={task.status} />,
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Tasks</h1>
        <p className="font-label text-xs text-muted-foreground">Follow-ups and reminders across your contacts.</p>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center">
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full font-label text-[11px] font-medium tracking-wide uppercase sm:w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusFilterOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant={assignedToMe ? 'default' : 'outline'}
          size="sm"
          className="font-label h-8 text-[11px] font-medium tracking-wide uppercase"
          onClick={() => { setAssignedToMe((prev) => !prev); resetPage(); }}
        >
          Assigned to me
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        getRowId={(task) => task.id}
        isLoading={isLoading}
        error={isError ? (error instanceof ApiError ? error.message : 'Failed to load tasks') : null}
        onRetry={() => void refetch()}
        emptyTitle="No tasks yet"
        emptyDescription="Tasks you add from a contact's detail page will show up here."
        page={page}
        pageSize={pageSize}
        total={data?.meta.total ?? 0}
        onPageChange={setPage}
      />
    </div>
  )
}
