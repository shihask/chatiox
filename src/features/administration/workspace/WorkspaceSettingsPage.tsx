import { useState } from 'react'
import { PlusIcon, Trash2Icon } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/features/auth/context/useAuth'
import { useLeadStatuses } from '@/features/crm/contacts/hooks/useLeadStatuses'
import { useLeadSources } from '@/features/crm/contacts/hooks/useLeadSources'
import { useUpdateWorkspace } from '@/features/administration/workspace/hooks/useUpdateWorkspace'
import {
  useCreateLeadStatus,
  useDeleteLeadStatus,
  useUpdateLeadStatus,
} from '@/features/administration/workspace/hooks/useLeadStatusMutations'
import {
  useCreateLeadSource,
  useDeleteLeadSource,
  useUpdateLeadSource,
} from '@/features/administration/workspace/hooks/useLeadSourceMutations'
import type { LeadSourceDTO, LeadStatusDTO } from '@/features/crm/contacts/types/contact.types'

function WorkspaceProfileCard() {
  const auth = useAuth()
  const currentName = auth.status === 'authenticated' ? auth.workspace.name : ''
  const [name, setName] = useState(currentName)
  const updateWorkspace = useUpdateWorkspace()

  return (
    <Card>
      <CardHeader>
        <h3 className="text-[14.5px] font-bold text-foreground">Workspace profile</h3>
        <p className="text-xs text-muted-foreground">The name your team sees throughout Chatiox.</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="workspaceName">Workspace name</Label>
            <Input id="workspaceName" value={name} onChange={(e) => { setName(e.target.value); }} />
          </div>
          <Button
            disabled={!name.trim() || name === currentName || updateWorkspace.isPending}
            onClick={() => void updateWorkspace.mutateAsync(name.trim())}
          >
            {updateWorkspace.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function LeadStatusRow({ status }: { status: LeadStatusDTO }) {
  const updateStatus = useUpdateLeadStatus()
  const deleteStatus = useDeleteLeadStatus()
  const [name, setName] = useState(status.name)

  function commitName() {
    if (name.trim() && name !== status.name) {
      void updateStatus.mutateAsync({ id: status.id, input: { name: name.trim() } })
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-muted/40 px-3 py-2.5 sm:flex-row sm:items-center">
      <Input
        value={name}
        onChange={(e) => { setName(e.target.value); }}
        onBlur={commitName}
        className="flex-1 bg-background"
      />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Switch
            checked={status.isWon}
            onCheckedChange={(checked) =>
              void updateStatus.mutateAsync({ id: status.id, input: { isWon: checked, isLost: checked ? false : status.isLost } })
            }
          />
          <Label className="text-xs font-normal text-muted-foreground">Won</Label>
        </div>
        <div className="flex items-center gap-1.5">
          <Switch
            checked={status.isLost}
            onCheckedChange={(checked) =>
              void updateStatus.mutateAsync({ id: status.id, input: { isLost: checked, isWon: checked ? false : status.isWon } })
            }
          />
          <Label className="text-xs font-normal text-muted-foreground">Lost</Label>
        </div>
        <button
          type="button"
          onClick={() => void deleteStatus.mutateAsync(status.id)}
          className="text-muted-foreground hover:text-destructive"
          aria-label={`Delete ${status.name}`}
        >
          <Trash2Icon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

function LeadStatusesCard() {
  const { data: statuses, isLoading } = useLeadStatuses()
  const createStatus = useCreateLeadStatus()
  const [draft, setDraft] = useState('')

  async function handleAdd() {
    if (!draft.trim()) return
    await createStatus.mutateAsync({ name: draft.trim() })
    setDraft('')
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-[14.5px] font-bold text-foreground">Lead statuses</h3>
        <p className="text-xs text-muted-foreground">
          The pipeline stages contacts move through. Mark exactly one as Won and one as Lost.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        ) : (
          <div className="space-y-2">
            {statuses?.map((status) => <LeadStatusRow key={status.id} status={status} />)}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            placeholder="Add a lead status..."
            value={draft}
            onChange={(e) => { setDraft(e.target.value); }}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleAdd(); }}
          />
          <Button
            variant="outline"
            className="shrink-0 gap-1.5"
            disabled={!draft.trim() || createStatus.isPending}
            onClick={() => void handleAdd()}
          >
            <PlusIcon className="h-4 w-4" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function LeadSourceRow({ source }: { source: LeadSourceDTO }) {
  const updateSource = useUpdateLeadSource()
  const deleteSource = useDeleteLeadSource()
  const [name, setName] = useState(source.name)

  function commitName() {
    if (name.trim() && name !== source.name) {
      void updateSource.mutateAsync({ id: source.id, name: name.trim() })
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2.5">
      <Input
        value={name}
        onChange={(e) => { setName(e.target.value); }}
        onBlur={commitName}
        className="flex-1 bg-background"
      />
      <button
        type="button"
        onClick={() => void deleteSource.mutateAsync(source.id)}
        className="shrink-0 text-muted-foreground hover:text-destructive"
        aria-label={`Delete ${source.name}`}
      >
        <Trash2Icon className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function LeadSourcesCard() {
  const { data: sources, isLoading } = useLeadSources()
  const createSource = useCreateLeadSource()
  const [draft, setDraft] = useState('')

  async function handleAdd() {
    if (!draft.trim()) return
    await createSource.mutateAsync(draft.trim())
    setDraft('')
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-[14.5px] font-bold text-foreground">Lead sources</h3>
        <p className="text-xs text-muted-foreground">Where your leads say they came from.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        ) : (
          <div className="space-y-2">
            {sources?.map((source) => <LeadSourceRow key={source.id} source={source} />)}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            placeholder="Add a lead source..."
            value={draft}
            onChange={(e) => { setDraft(e.target.value); }}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleAdd(); }}
          />
          <Button
            variant="outline"
            className="shrink-0 gap-1.5"
            disabled={!draft.trim() || createSource.isPending}
            onClick={() => void handleAdd()}
          >
            <PlusIcon className="h-4 w-4" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function WorkspaceSettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Workspace</h1>
        <p className="font-label text-xs text-muted-foreground">
          Profile and pipeline configuration for your workspace.
        </p>
      </div>

      <WorkspaceProfileCard />
      <LeadStatusesCard />
      <LeadSourcesCard />
    </div>
  )
}
