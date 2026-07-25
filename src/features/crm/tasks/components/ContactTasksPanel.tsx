import { useState } from 'react'
import { Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { useContactTasks } from '@/features/crm/tasks/hooks/useContactTasks'
import { useCreateTask } from '@/features/crm/tasks/hooks/useCreateTask'
import { useUpdateTask } from '@/features/crm/tasks/hooks/useUpdateTask'
import { useDeleteTask } from '@/features/crm/tasks/hooks/useDeleteTask'
import { formatDate } from '@/lib/date'
import { cn } from '@/lib/utils'

export function ContactTasksPanel({ contactId }: { contactId: string }) {
  const [title, setTitle] = useState('')
  const [dueAt, setDueAt] = useState('')
  const { data: tasks, isLoading } = useContactTasks(contactId)
  const createTask = useCreateTask(contactId)
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  async function handleAddTask() {
    if (!title.trim()) return
    await createTask.mutateAsync({
      title: title.trim(),
      dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
    })
    setTitle('')
    setDueAt('')
  }

  function toggleComplete(taskId: string, isNowChecked: boolean) {
    void updateTask.mutateAsync({ id: taskId, input: { status: isNowChecked ? 'completed' : 'open' } })
  }

  const openTasks = tasks?.filter((t) => t.status === 'open') ?? []
  const otherTasks = tasks?.filter((t) => t.status !== 'open') ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Add a task..."
          value={title}
          onChange={(e) => { setTitle(e.target.value); }}
          className="flex-1"
        />
        <Input
          type="date"
          value={dueAt}
          onChange={(e) => { setDueAt(e.target.value); }}
          className="sm:w-40"
        />
        <Button
          size="sm"
          onClick={() => void handleAddTask()}
          disabled={!title.trim() || createTask.isPending}
          className="shrink-0"
        >
          {createTask.isPending ? 'Adding...' : 'Add task'}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      ) : tasks && tasks.length > 0 ? (
        <div className="space-y-1.5">
          {[...openTasks, ...otherTasks].map((task) => (
            <div
              key={task.id}
              className="group flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2.5"
            >
              <Checkbox
                checked={task.status === 'completed'}
                onCheckedChange={(checked) => { toggleComplete(task.id, checked); }}
                disabled={task.status === 'cancelled'}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'truncate text-[13.5px] font-medium text-foreground',
                    task.status !== 'open' && 'text-muted-foreground line-through',
                  )}
                >
                  {task.title}
                </p>
                {task.dueAt && (
                  <p className="font-label text-[11px] text-muted-foreground">
                    Due {formatDate(task.dueAt)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => void deleteTask.mutateAsync(task.id)}
                className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                aria-label="Delete task"
              >
                <Trash2Icon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">No tasks yet.</p>
      )}
    </div>
  )
}
