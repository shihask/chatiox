import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateConnection } from '@/features/communication/channels/hooks/useCreateConnection'
import { useUpdateConnection } from '@/features/communication/channels/hooks/useUpdateConnection'
import { connectWhatsAppSchema, type ConnectWhatsAppFormValues } from '@/features/communication/channels/schemas/connectWhatsApp.schema'
import type { ChannelConnectionDTO } from '@/features/communication/channels/types/channel.types'

const fieldLabelClass = 'font-label text-[11px] font-medium tracking-wider text-muted-foreground uppercase'

interface ConnectWhatsAppDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Present when reconnecting an existing (disconnected/error) connection rather than creating a
   * new one -- non-secret fields are pre-filled, the access token field always starts blank since
   * the current secret is never exposed back to the client. */
  existingConnection?: ChannelConnectionDTO
}

export function ConnectWhatsAppDialog({ open, onOpenChange, existingConnection }: ConnectWhatsAppDialogProps) {
  const createConnection = useCreateConnection()
  const updateConnection = useUpdateConnection()
  const isReconnect = Boolean(existingConnection)
  const isPending = createConnection.isPending || updateConnection.isPending

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConnectWhatsAppFormValues>({
    resolver: zodResolver(connectWhatsAppSchema),
    values: {
      displayName: existingConnection?.displayName ?? 'WhatsApp',
      phoneNumber: (existingConnection?.metadata.displayPhoneNumber as string | undefined) ?? '',
      phoneNumberId: existingConnection?.externalAccountId ?? '',
      wabaId: (existingConnection?.metadata.wabaId as string | undefined) ?? '',
      accessToken: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    const metadata: Record<string, unknown> = { displayPhoneNumber: values.phoneNumber }
    if (values.wabaId?.trim()) metadata.wabaId = values.wabaId.trim()

    if (existingConnection) {
      await updateConnection.mutateAsync({
        id: existingConnection.id,
        input: {
          displayName: values.displayName,
          externalAccountId: values.phoneNumberId,
          metadata,
          secret: { accessToken: values.accessToken },
          status: 'connected',
        },
      })
    } else {
      await createConnection.mutateAsync({
        channelType: 'whatsapp',
        displayName: values.displayName,
        externalAccountId: values.phoneNumberId,
        metadata,
        secret: { accessToken: values.accessToken },
      })
    }
    reset()
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isReconnect ? 'Reconnect WhatsApp' : 'Connect WhatsApp'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="displayName" className={fieldLabelClass}>
              Display name
            </Label>
            <Input id="displayName" placeholder="e.g. Sales WhatsApp" {...register('displayName')} />
            {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phoneNumber" className={fieldLabelClass}>
              Phone number
            </Label>
            <Input id="phoneNumber" placeholder="+1 555 671 7212" {...register('phoneNumber')} />
            {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phoneNumberId" className={fieldLabelClass}>
              Phone Number ID
            </Label>
            <Input id="phoneNumberId" placeholder="From WhatsApp &gt; API Setup" {...register('phoneNumberId')} />
            {errors.phoneNumberId && <p className="text-sm text-destructive">{errors.phoneNumberId.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wabaId" className={fieldLabelClass}>
              WABA ID <span className="normal-case text-muted-foreground/70">(optional)</span>
            </Label>
            <Input id="wabaId" placeholder="WhatsApp Business Account ID" {...register('wabaId')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="accessToken" className={fieldLabelClass}>
              Access token
            </Label>
            <Input id="accessToken" type="password" placeholder="From WhatsApp > API Setup" {...register('accessToken')} />
            {errors.accessToken && <p className="text-sm text-destructive">{errors.accessToken.message}</p>}
            <p className="text-xs text-muted-foreground">
              Stored via Supabase Vault -- never readable again after saving, only used server-side to send messages.
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Saving...' : isReconnect ? 'Reconnect' : 'Connect'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
