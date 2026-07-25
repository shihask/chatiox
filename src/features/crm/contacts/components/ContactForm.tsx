import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/features/auth/context/useAuth'
import { useLeadSources } from '@/features/crm/contacts/hooks/useLeadSources'
import { useLeadStatuses } from '@/features/crm/contacts/hooks/useLeadStatuses'
import { contactFormSchema, type ContactFormValues } from '@/features/crm/contacts/schemas/contact.schema'
import { CHANNEL_TYPE_META, CHANNEL_TYPES } from '@/lib/channelTypes'
import type { ContactDTO } from '@/features/crm/contacts/types/contact.types'

function defaultValuesFor(initialValues?: ContactDTO): ContactFormValues {
  if (!initialValues) {
    return {
      firstName: '',
      lastName: '',
      tags: [],
      channels: [{ channelType: 'whatsapp', value: '', isPrimary: true }],
    }
  }
  return {
    firstName: initialValues.firstName,
    lastName: initialValues.lastName ?? '',
    tags: initialValues.tags,
    channels: initialValues.channels.map((channel) => ({
      id: channel.id,
      channelType: channel.channelType,
      value: channel.value,
      isPrimary: channel.isPrimary,
    })),
    leadStatusId: initialValues.leadStatus?.id,
    leadSourceId: initialValues.leadSource?.id,
    assignedToUserId: initialValues.assignedToUserId ?? undefined,
  }
}

function SectionHeading({ children }: { children: string }) {
  return <h4 className="mb-3 text-[12.5px] font-bold text-foreground/80">{children}</h4>
}

export function ContactForm({
  initialValues,
  onSubmit,
  isSubmitting,
  submitLabel = 'Save contact',
}: {
  initialValues?: ContactDTO
  onSubmit: (values: ContactFormValues) => Promise<void> | void
  isSubmitting: boolean
  submitLabel?: string
}) {
  const { data: leadStatuses } = useLeadStatuses()
  const { data: leadSources } = useLeadSources()
  const auth = useAuth()

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: defaultValuesFor(initialValues),
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'channels' })
  const assignedToUserId = watch('assignedToUserId')

  const submit = handleSubmit(async (values) => {
    await onSubmit(values)
  })

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-6" noValidate>
      <div>
        <SectionHeading>Basic information</SectionHeading>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" {...register('firstName')} />
            {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" {...register('lastName')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags</Label>
            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <Input
                  id="tags"
                  placeholder="e.g. python-course"
                  defaultValue={field.value.join(', ')}
                  onBlur={(e) =>
                    { field.onChange(
                      e.target.value
                        .split(',')
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    ); }
                  }
                />
              )}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <SectionHeading>Communication channels</SectionHeading>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => { append({ channelType: 'whatsapp', value: '', isPrimary: fields.length === 0 }); }}
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Add channel
          </Button>
        </div>
        {errors.channels?.message && <p className="text-sm text-destructive">{errors.channels.message}</p>}
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex flex-col gap-3 rounded-md border bg-muted/40 p-3 sm:flex-row sm:items-start sm:gap-2"
            >
              <Select
                value={watch(`channels.${index}.channelType`)}
                onValueChange={(value) => {
                  if (value) setValue(`channels.${index}.channelType`, value)
                }}
              >
                <SelectTrigger className="w-full bg-background sm:w-[140px]">
                  <SelectValue>{(value: string) => CHANNEL_TYPE_META[value as keyof typeof CHANNEL_TYPE_META].label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CHANNEL_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {CHANNEL_TYPE_META[type].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex-1 space-y-1">
                <Input placeholder="Value" className="bg-background" {...register(`channels.${index}.value`)} />
                {errors.channels?.[index]?.value && (
                  <p className="text-sm text-destructive">{errors.channels[index].value.message}</p>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 sm:justify-start sm:pt-2">
                <div className="flex items-center gap-1">
                  <Switch
                    checked={watch(`channels.${index}.isPrimary`)}
                    onCheckedChange={(checked) => { setValue(`channels.${index}.isPrimary`, checked); }}
                  />
                  <span className="text-xs text-muted-foreground">Primary</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={fields.length === 1}
                  onClick={() => { remove(index); }}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <SectionHeading>Lead details</SectionHeading>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Lead status</Label>
            <Select
              value={watch('leadStatusId') ?? 'none'}
              onValueChange={(value) => { setValue('leadStatusId', value && value !== 'none' ? value : undefined); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status">
                  {(value: string) =>
                    value === 'none' || !value
                      ? 'No status'
                      : (leadStatuses?.find((status) => status.id === value)?.name ?? 'Select status')
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No status</SelectItem>
                {leadStatuses?.map((status) => (
                  <SelectItem key={status.id} value={status.id}>
                    {status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Lead source</Label>
            <Select
              value={watch('leadSourceId') ?? 'none'}
              onValueChange={(value) => { setValue('leadSourceId', value && value !== 'none' ? value : undefined); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source">
                  {(value: string) =>
                    value === 'none' || !value
                      ? 'No source'
                      : (leadSources?.find((source) => source.id === value)?.name ?? 'Select source')
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No source</SelectItem>
                {leadSources?.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {auth.status === 'authenticated' && (
          <div className="mt-3 flex items-center gap-2">
            <Switch
              checked={assignedToUserId === auth.user.id}
              onCheckedChange={(checked) => { setValue('assignedToUserId', checked ? auth.user.id : undefined); }}
            />
            {/* Phase 1 has no Team Members list yet (see docs/modules/administration/team-members.md), so
                "assign to a teammate" isn't meaningful UI yet -- this still exercises the real
                assignedToUserId field/validation end-to-end for the one user we do know about. */}
            <Label className="font-normal">Assign to me</Label>
          </div>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? 'Saving...' : submitLabel}
      </Button>
    </form>
  )
}
