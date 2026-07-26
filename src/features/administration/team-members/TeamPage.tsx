import { useState } from 'react'
import { toast } from 'sonner'
import { PlusIcon, CopyIcon, Trash2Icon } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/features/auth/context/useAuth'
import { useTeamMembers } from '@/features/administration/team-members/hooks/useTeamMembers'
import { useTeamInvites } from '@/features/administration/team-members/hooks/useTeamInvites'
import { useUpdateMemberRole } from '@/features/administration/team-members/hooks/useUpdateMemberRole'
import { useRemoveMember } from '@/features/administration/team-members/hooks/useRemoveMember'
import { useCreateInvite } from '@/features/administration/team-members/hooks/useCreateInvite'
import { useRevokeInvite } from '@/features/administration/team-members/hooks/useRevokeInvite'
import { formatDate } from '@/lib/date'
import type { TeamInviteDTO, TeamMemberDTO, WorkspaceRole } from '@/features/administration/team-members/types/team-member.types'

const roleLabels: Record<WorkspaceRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  agent: 'Agent',
}

function inviteLinkFor(token: string): string {
  return `${window.location.origin}/signup?invite=${token}`
}

/** mutateAsync still rejects after the mutation's own onError toast has already run -- pass this to
 * .catch() on fire-and-forget calls so the rejection doesn't also surface as an unhandled promise
 * rejection (e.g. the last-owner guard rejecting a role change). */
function ignoreAlreadyToastedRejection(error: unknown): void {
  if (import.meta.env.DEV) console.debug('[team-members] mutation rejected (toast already shown)', error)
}

function MemberRow({ member, canManage }: { member: TeamMemberDTO; canManage: boolean }) {
  const auth = useAuth()
  const updateRole = useUpdateMemberRole()
  const removeMember = useRemoveMember()
  const isSelf = auth.status === 'authenticated' && auth.user.id === member.userId
  const currentUserIsOwner = auth.status === 'authenticated' && auth.role === 'owner'
  const canEditThisRow = canManage && (member.role !== 'owner' || currentUserIsOwner)

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-muted/40 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold text-foreground">
          {member.email}
          {isSelf && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(You)</span>}
        </p>
        <p className="font-label text-[11px] text-muted-foreground">Joined {formatDate(member.joinedAt)}</p>
      </div>
      <div className="flex items-center gap-2">
        {canEditThisRow ? (
          <Select
            value={member.role}
            onValueChange={(value) => {
              // mutateAsync still rejects after onError's toast runs -- swallow it here so a
              // rejected role change (e.g. the last-owner guard) doesn't surface as an unhandled
              // promise rejection; the toast already told the user what happened.
              if (value) updateRole.mutateAsync({ userId: member.userId, role: value }).catch(ignoreAlreadyToastedRejection)
            }}
          >
            <SelectTrigger className="w-32 font-label text-[11px] font-medium tracking-wide uppercase">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(roleLabels) as WorkspaceRole[])
                .filter((role) => role !== 'owner' || currentUserIsOwner)
                .map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleLabels[role]}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="font-label text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {roleLabels[member.role]}
          </span>
        )}
        {canEditThisRow && !isSelf && (
          <button
            type="button"
            onClick={() => { removeMember.mutateAsync(member.userId).catch(ignoreAlreadyToastedRejection); }}
            className="text-muted-foreground hover:text-destructive"
            aria-label={`Remove ${member.email}`}
          >
            <Trash2Icon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

function InviteRow({ invite }: { invite: TeamInviteDTO }) {
  const revokeInvite = useRevokeInvite()

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteLinkFor(invite.token))
      toast.success('Invite link copied')
    } catch {
      toast.error('Could not copy the link -- copy it manually from your browser')
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-muted/40 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold text-foreground">{invite.email}</p>
        <p className="font-label text-[11px] text-muted-foreground uppercase">
          {roleLabels[invite.role]} · Pending
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => void copyLink()}>
          <CopyIcon className="h-3.5 w-3.5" />
          Copy link
        </Button>
        <button
          type="button"
          onClick={() => { revokeInvite.mutateAsync(invite.id).catch(ignoreAlreadyToastedRejection); }}
          className="text-muted-foreground hover:text-destructive"
          aria-label={`Revoke invite for ${invite.email}`}
        >
          <Trash2Icon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

function InviteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'manager' | 'agent'>('agent')
  const createInvite = useCreateInvite()

  async function handleSubmit() {
    if (!email.trim()) return
    let invite
    try {
      invite = await createInvite.mutateAsync({ email: email.trim(), role })
    } catch {
      // useCreateInvite's onError already toasted the failure.
      return
    }

    try {
      await navigator.clipboard.writeText(inviteLinkFor(invite.token))
      toast.success('Invite created and link copied to clipboard')
    } catch {
      toast.success('Invite created -- copy the link from the Pending invites list')
    }
    setEmail('')
    setRole('agent')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a teammate</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="inviteEmail">Email</Label>
            <Input
              id="inviteEmail"
              type="email"
              placeholder="teammate@business.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); }}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(value) => { if (value) setRole(value); }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full"
            disabled={!email.trim() || createInvite.isPending}
            onClick={() => void handleSubmit()}
          >
            {createInvite.isPending ? 'Creating...' : 'Create invite link'}
          </Button>
          <p className="text-xs text-muted-foreground">
            We don't send emails yet -- share the copied link with your teammate directly (WhatsApp,
            Slack, etc.). They'll join this workspace with the role you picked as soon as they sign up.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function TeamPage() {
  const auth = useAuth()
  const canManage = auth.status === 'authenticated' && (auth.role === 'owner' || auth.role === 'admin')
  const { data: members, isLoading: membersLoading } = useTeamMembers()
  const { data: invites, isLoading: invitesLoading } = useTeamInvites(canManage)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Team</h1>
          <p className="font-label text-xs text-muted-foreground">Who has access to this workspace.</p>
        </div>
        {canManage && (
          <Button onClick={() => { setInviteDialogOpen(true); }} className="gap-1.5">
            <PlusIcon className="h-4 w-4" />
            Invite teammate
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-[14.5px] font-bold text-foreground">Members</h3>
        </CardHeader>
        <CardContent className="space-y-2">
          {membersLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : (
            members?.map((member) => <MemberRow key={member.userId} member={member} canManage={canManage} />)
          )}
        </CardContent>
      </Card>

      {canManage && (
        <Card>
          <CardHeader>
            <h3 className="text-[14.5px] font-bold text-foreground">Pending invites</h3>
          </CardHeader>
          <CardContent className="space-y-2">
            {invitesLoading ? (
              <Skeleton className="h-14 w-full" />
            ) : invites && invites.length > 0 ? (
              invites.map((invite) => <InviteRow key={invite.id} invite={invite} />)
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">No pending invites.</p>
            )}
          </CardContent>
        </Card>
      )}

      <InviteDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} />
    </div>
  )
}
