import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ApiError } from '@/api/apiClient'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ComingSoonPage } from '@/components/feedback/ComingSoonPage'
import { ContactForm } from '@/features/crm/contacts/components/ContactForm'
import { ContactNotesPanel } from '@/features/crm/contacts/components/ContactNotesPanel'
import { ContactTasksPanel } from '@/features/crm/tasks/components/ContactTasksPanel'
import { DeleteContactDialog } from '@/features/crm/contacts/components/DeleteContactDialog'
import { LeadStatusBadge } from '@/features/crm/contacts/components/LeadStatusBadge'
import { useContact } from '@/features/crm/contacts/hooks/useContact'
import { useDeleteContact } from '@/features/crm/contacts/hooks/useDeleteContact'
import { useSaveContactWithChannels } from '@/features/crm/contacts/hooks/useSaveContactWithChannels'
import { CHANNEL_TYPE_META } from '@/lib/channelTypes'
import { avatarClassFor } from '@/lib/avatarColor'
import { formatDate } from '@/lib/date'
import type { ContactFormValues } from '@/features/crm/contacts/schemas/contact.schema'

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const { data: contact, isLoading, isError, error, refetch } = useContact(id)
  const saveContact = useSaveContactWithChannels()
  const deleteContact = useDeleteContact()

  if (isLoading) return <LoadingState label="Loading contact..." />

  if (isError || !contact) {
    return (
      <ErrorState
        message={error instanceof ApiError ? error.message : 'Contact not found'}
        onRetry={() => void refetch()}
      />
    )
  }

  async function handleSave(values: ContactFormValues) {
    if (!id || !contact) return
    await saveContact.mutateAsync({ id, values, originalChannels: contact.channels })
  }

  async function handleDelete() {
    if (!id) return
    await deleteContact.mutateAsync(id)
    void navigate('/contacts')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3.5">
          <span
            className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-full text-lg font-bold ${avatarClassFor(contact.id)}`}
          >
            {contact.firstName.slice(0, 1)}
            {contact.lastName?.slice(0, 1) ?? ''}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="truncate text-[19px] font-extrabold text-foreground">
                {contact.firstName} {contact.lastName ?? ''}
              </h1>
              <LeadStatusBadge status={contact.leadStatus} />
            </div>
            <p className="mt-1 truncate text-[13px] text-muted-foreground">
              {contact.channels.find((c) => c.isPrimary)?.value ?? contact.channels[0]?.value ?? 'No channels'}
            </p>
          </div>
        </div>
        <Button
          variant="destructive"
          className="self-start sm:self-auto"
          onClick={() => { setIsDeleteOpen(true); }}
        >
          Archive contact
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]">
        <div className="space-y-5">
          <div>
            <h4 className="mb-3 text-[12.5px] font-bold text-foreground/80">Summary</h4>
            <div className="space-y-0 rounded-lg border bg-card">
              <div className="flex justify-between border-b px-3.5 py-2.5 text-[13px]">
                <span className="text-muted-foreground">Source</span>
                <span className="font-semibold text-foreground">{contact.leadSource?.name ?? '—'}</span>
              </div>
              <div className="flex justify-between border-b px-3.5 py-2.5 text-[13px]">
                <span className="text-muted-foreground">Owner</span>
                <span className="font-semibold text-foreground">
                  {contact.assignedToUserId ? 'Assigned' : 'Unassigned'}
                </span>
              </div>
              <div className="flex justify-between px-3.5 py-2.5 text-[13px]">
                <span className="text-muted-foreground">Last activity</span>
                <span className="font-semibold text-foreground">{formatDate(contact.updatedAt)}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-[12.5px] font-bold text-foreground/80">Channels</h4>
            <div className="space-y-1.5">
              {contact.channels.map((channel) => {
                const Icon = CHANNEL_TYPE_META[channel.channelType].icon
                return (
                  <div
                    key={channel.id}
                    className="flex items-center gap-2.5 rounded-md border bg-card px-2.5 py-2 text-[13px]"
                  >
                    <Icon className="h-[15px] w-[15px] shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{channel.value}</span>
                    {channel.isPrimary && (
                      <span className="font-label shrink-0 text-[9.5px] font-semibold text-primary uppercase">
                        Primary
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="pt-1">
            <Tabs defaultValue="details">
              <TabsList className="mb-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="automation">Automation</TabsTrigger>
              </TabsList>
              <TabsContent value="details">
                <ContactForm
                  initialValues={contact}
                  onSubmit={handleSave}
                  isSubmitting={saveContact.isPending}
                  submitLabel="Save changes"
                />
              </TabsContent>
              <TabsContent value="tasks">
                <ContactTasksPanel contactId={contact.id} />
              </TabsContent>
              <TabsContent value="timeline">
                <ComingSoonPage
                  moduleName="Timeline"
                  features={[
                    'A chronological feed of everything that happens to this contact',
                    'Messages, lead status changes, and task activity in one place',
                  ]}
                />
              </TabsContent>
              <TabsContent value="notes">
                <ContactNotesPanel contactId={contact.id} />
              </TabsContent>
              <TabsContent value="automation">
                <ComingSoonPage
                  moduleName="Automation"
                  features={['Trigger-based workflows', 'Automation history for this contact']}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <DeleteContactDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        contactName={`${contact.firstName} ${contact.lastName ?? ''}`}
        onConfirm={() => void handleDelete()}
        isDeleting={deleteContact.isPending}
      />
    </div>
  )
}
