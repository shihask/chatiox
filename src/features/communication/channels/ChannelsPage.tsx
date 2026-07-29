import { useState } from 'react'
import { toast } from 'sonner'
import { MessageCircle, Mail, MessageSquare, Phone } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/features/auth/context/useAuth'
import { useTeamMembers } from '@/features/administration/team-members/hooks/useTeamMembers'
import { useChannelConnections } from '@/features/communication/channels/hooks/useChannelConnections'
import { useUpdateConnection } from '@/features/communication/channels/hooks/useUpdateConnection'
import { ConnectWhatsAppDialog } from '@/features/communication/channels/components/ConnectWhatsAppDialog'
import { ConnectWhatsAppEmbeddedFlow } from '@/features/communication/channels/components/ConnectWhatsAppEmbeddedFlow'
import { formatDate } from '@/lib/date'
import { ApiError } from '@/api/apiClient'
import type { ChannelConnectionDTO } from '@/features/communication/channels/types/channel.types'

const statusBadgeVariant: Record<ChannelConnectionDTO['status'], 'default' | 'secondary' | 'destructive'> = {
  connected: 'default',
  disconnected: 'secondary',
  error: 'destructive',
}

const statusLabel: Record<ChannelConnectionDTO['status'], string> = {
  connected: 'Connected',
  disconnected: 'Disconnected',
  error: 'Error',
}

function WhatsAppCard() {
  const auth = useAuth()
  const { data: connections, isLoading } = useChannelConnections()
  const { data: teamMembers } = useTeamMembers()
  const updateConnection = useUpdateConnection()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [embeddedFlowOpen, setEmbeddedFlowOpen] = useState(false)

  const connection = connections?.find((c) => c.channelType === 'whatsapp')

  function connectedByLabel(userId: string | null): string {
    if (!userId) return '—'
    if (auth.status === 'authenticated' && auth.user.id === userId) return 'You'
    return teamMembers?.find((m) => m.userId === userId)?.email ?? 'Team member'
  }

  async function handleDisconnect() {
    if (!connection) return
    try {
      await updateConnection.mutateAsync({ id: connection.id, input: { status: 'disconnected' } })
      toast.success('WhatsApp disconnected')
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Failed to disconnect')
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2.5">
          <MessageCircle className="h-4.5 w-4.5 text-foreground/70" />
          <h3 className="text-[14.5px] font-bold text-foreground">WhatsApp</h3>
        </div>
        {connection && <Badge variant={statusBadgeVariant[connection.status]}>{statusLabel[connection.status]}</Badge>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : connection ? (
          <div className="space-y-3">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[13px]">
              <div>
                <dt className="font-label text-[11px] text-muted-foreground uppercase">Phone number</dt>
                <dd className="font-medium text-foreground">
                  {(connection.metadata.displayPhoneNumber as string | undefined) ?? connection.externalAccountId ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="font-label text-[11px] text-muted-foreground uppercase">WABA</dt>
                <dd className="font-medium text-foreground">{(connection.metadata.wabaId as string | undefined) ?? '—'}</dd>
              </div>
              <div>
                <dt className="font-label text-[11px] text-muted-foreground uppercase">Connected by</dt>
                <dd className="font-medium text-foreground">{connectedByLabel(connection.connectedBy)}</dd>
              </div>
              <div>
                <dt className="font-label text-[11px] text-muted-foreground uppercase">Connected at</dt>
                <dd className="font-medium text-foreground">{formatDate(connection.createdAt)}</dd>
              </div>
              {connection.metadata.connectionMethod === 'embedded_signup' && (
                <div>
                  <dt className="font-label text-[11px] text-muted-foreground uppercase">Connected via</dt>
                  <dd className="font-medium text-foreground">Meta</dd>
                </div>
              )}
            </dl>
            {connection.status === 'error' && connection.lastError && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{connection.lastError}</p>
            )}
            {connection.status === 'connected' ? (
              <Button variant="outline" size="sm" onClick={() => void handleDisconnect()} disabled={updateConnection.isPending}>
                Disconnect
              </Button>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" onClick={() => { setEmbeddedFlowOpen(true); }}>
                  Reconnect with Meta
                </Button>
                <button
                  type="button"
                  onClick={() => { setDialogOpen(true); }}
                  className="text-[12.5px] font-medium text-muted-foreground hover:text-foreground hover:underline"
                >
                  Manual setup
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-start gap-2.5">
            <p className="text-sm text-muted-foreground">Not connected.</p>
            <Button onClick={() => { setEmbeddedFlowOpen(true); }} className="gap-1.5">
              Connect with Meta
            </Button>
            <button
              type="button"
              onClick={() => { setDialogOpen(true); }}
              className="text-[12.5px] font-medium text-muted-foreground hover:text-foreground hover:underline"
            >
              Manual setup
            </button>
          </div>
        )}
      </CardContent>
      <ConnectWhatsAppDialog open={dialogOpen} onOpenChange={setDialogOpen} existingConnection={connection} />
      <ConnectWhatsAppEmbeddedFlow open={embeddedFlowOpen} onOpenChange={setEmbeddedFlowOpen} />
    </Card>
  )
}

function ComingSoonCard({ label, icon: Icon }: { label: string; icon: typeof Mail }) {
  return (
    <Card className="opacity-60">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2.5">
          <Icon className="h-4.5 w-4.5 text-foreground/70" />
          <h3 className="text-[14.5px] font-bold text-foreground">{label}</h3>
        </div>
        <Badge variant="secondary">Coming soon</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Not available yet.</p>
      </CardContent>
    </Card>
  )
}

export function ChannelsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Channels</h1>
        <p className="font-label text-xs text-muted-foreground">
          Connect the channels your team uses to talk to contacts.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <WhatsAppCard />
        <ComingSoonCard label="Email" icon={Mail} />
        <ComingSoonCard label="SMS" icon={MessageSquare} />
        <ComingSoonCard label="Voice" icon={Phone} />
      </div>
    </div>
  )
}
