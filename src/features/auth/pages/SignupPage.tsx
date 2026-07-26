import { useSearchParams } from 'react-router-dom'
import { SignupForm } from '@/features/auth/components/SignupForm'
import { useInvitePreview } from '@/features/administration/team-members/hooks/useInvitePreview'
import { Skeleton } from '@/components/ui/skeleton'

export function SignupPage() {
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('invite')
  const { data: invitePreview, isLoading, isError } = useInvitePreview(inviteToken)

  if (inviteToken && isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-6 h-40 w-full" />
      </div>
    )
  }

  if (inviteToken && isError) {
    return (
      <div>
        <h1 className="text-[27px] font-extrabold tracking-tight text-foreground">Invite link invalid</h1>
        <p className="mt-2 mb-8 text-sm text-muted-foreground">
          This invite link is invalid or has expired. Ask whoever invited you to send a new one, or
          create your own workspace instead.
        </p>
        <SignupForm />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-[27px] font-extrabold tracking-tight text-foreground">
        {invitePreview ? `Join ${invitePreview.workspaceName}` : 'Create your workspace'}
      </h1>
      <p className="mt-2 mb-8 text-sm text-muted-foreground">
        {invitePreview
          ? `You've been invited to join as ${invitePreview.role}.`
          : 'Set up Chatiox for your team in under a minute.'}
      </p>
      <SignupForm inviteToken={inviteToken ?? undefined} invitePreview={invitePreview} />
    </div>
  )
}
