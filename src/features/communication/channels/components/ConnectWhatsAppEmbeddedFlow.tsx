import { useState } from 'react'
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/api/apiClient'
import { loginWithEmbeddedSignup } from '@/lib/facebookSdk'
import { config } from '@/lib/config'
import { useDiscoverEmbeddedSignupAssets } from '@/features/communication/channels/hooks/useDiscoverEmbeddedSignupAssets'
import { useCompleteEmbeddedSignup } from '@/features/communication/channels/hooks/useCompleteEmbeddedSignup'
import type { EmbeddedSignupCandidateDTO } from '@/features/communication/channels/types/channel.types'

const STEP_LABELS = [
  'Logging into Meta',
  'Verifying with Meta',
  'Discovering your WhatsApp Business accounts',
  'Select a phone number to connect',
  'Subscribing to webhooks',
  'Saving connection',
] as const

type FlowState =
  | { phase: 'idle' }
  | { phase: 'logging-in' }
  | { phase: 'verifying' }
  | { phase: 'discovering' }
  | { phase: 'select-phone'; secretId: string; candidates: EmbeddedSignupCandidateDTO[] }
  | { phase: 'connecting'; secretId: string; candidates: EmbeddedSignupCandidateDTO[]; selectedPhoneNumberId: string }
  | { phase: 'done' }
  | { phase: 'error'; failedStepIndex: number; message: string }

const STEP_INDEX_FOR_PHASE: Record<string, number> = {
  'logging-in': 0,
  verifying: 1,
  discovering: 2,
  'select-phone': 3,
  connecting: 4,
}

export function ConnectWhatsAppEmbeddedFlow({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [state, setState] = useState<FlowState>({ phase: 'idle' })
  const discoverAssets = useDiscoverEmbeddedSignupAssets()
  const completeSignup = useCompleteEmbeddedSignup()

  const configured = Boolean(config.metaAppId && config.metaEmbeddedSignupConfigId)

  function reset() {
    setState({ phase: 'idle' })
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset()
    onOpenChange(next)
  }

  async function handleStart() {
    setState({ phase: 'logging-in' })
    let loginResult: { code: string; wabaId?: string; wabaIds?: string[]; phoneNumberId?: string }
    try {
      loginResult = await loginWithEmbeddedSignup(config.metaAppId ?? '', config.metaEmbeddedSignupConfigId ?? '')
    } catch (err) {
      setState({ phase: 'error', failedStepIndex: 0, message: err instanceof Error ? err.message : 'Meta sign-in was cancelled or denied.' })
      return
    }

    setState({ phase: 'verifying' })
    setState({ phase: 'discovering' })
    try {
      const discovery = await discoverAssets.mutateAsync(loginResult)
      if (discovery.candidates.length === 0) {
        setState({ phase: 'error', failedStepIndex: 2, message: 'No WhatsApp Business phone numbers were found for this Meta account.' })
        return
      }
      setState({ phase: 'select-phone', secretId: discovery.secretId, candidates: discovery.candidates })
    } catch (err) {
      setState({ phase: 'error', failedStepIndex: 2, message: err instanceof ApiError ? err.message : 'Failed to discover WhatsApp Business assets.' })
    }
  }

  async function handleSelectCandidate(secretId: string, candidates: EmbeddedSignupCandidateDTO[], candidate: EmbeddedSignupCandidateDTO) {
    setState({ phase: 'connecting', secretId, candidates, selectedPhoneNumberId: candidate.phoneNumberId })
    try {
      await completeSignup.mutateAsync({ secretId, wabaId: candidate.wabaId, phoneNumberId: candidate.phoneNumberId })
      setState({ phase: 'done' })
      handleOpenChange(false)
    } catch (err) {
      setState({
        phase: 'error',
        failedStepIndex: 4,
        message: err instanceof ApiError ? err.message : 'Failed to complete the WhatsApp connection.',
      })
    }
  }

  const currentStepIndex =
    state.phase === 'idle' || state.phase === 'done' ? -1 : (STEP_INDEX_FOR_PHASE[state.phase] ?? -1)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect WhatsApp with Meta</DialogTitle>
        </DialogHeader>

        {!configured ? (
          <p className="text-sm text-muted-foreground">
            Embedded Signup isn't configured yet for this environment (missing Meta App ID / Embedded Signup
            configuration). Use Manual setup instead.
          </p>
        ) : state.phase === 'idle' ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You'll log into Meta, and Chatiox will automatically discover and connect your WhatsApp Business number
              -- no IDs or tokens to copy.
            </p>
            <Button className="w-full" onClick={() => void handleStart()}>
              Continue with Meta
            </Button>
          </div>
        ) : state.phase === 'select-phone' ? (
          <div className="space-y-3">
            <p className="text-[13px] text-muted-foreground">Select a phone number to connect:</p>
            <div className="space-y-1.5">
              {state.candidates.map((candidate) => (
                <button
                  key={candidate.phoneNumberId}
                  type="button"
                  disabled={completeSignup.isPending}
                  onClick={() => void handleSelectCandidate(state.secretId, state.candidates, candidate)}
                  className="flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-left text-[13px] hover:bg-muted disabled:opacity-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{candidate.displayPhoneNumber}</p>
                    <p className="truncate text-muted-foreground">{candidate.verifiedName}</p>
                  </div>
                  {candidate.qualityRating && (
                    <span className="font-label shrink-0 text-[10px] text-muted-foreground uppercase">
                      {candidate.qualityRating}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <ol className="space-y-2">
              {STEP_LABELS.map((label, index) => {
                const isFailed = state.phase === 'error' && state.failedStepIndex === index
                const isDone = state.phase !== 'error' && currentStepIndex > index
                // "Subscribing to webhooks" and "Saving connection" happen inside a single backend
                // request (no way to observe sub-progress from the frontend), so both show as
                // in-progress together while phase === 'connecting' rather than one looking untouched.
                const isCurrent =
                  state.phase !== 'error' && (currentStepIndex === index || (state.phase === 'connecting' && index === 5))
                return (
                  <li key={label} className="flex items-center gap-2.5 text-[13px]">
                    {isFailed ? (
                      <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                    ) : isDone ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    ) : isCurrent ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                    )}
                    <span className={isCurrent || isFailed ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                      {label}
                    </span>
                  </li>
                )
              })}
            </ol>
            {state.phase === 'error' && (
              <div className="space-y-3">
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.message}</p>
                <Button variant="outline" className="w-full" onClick={reset}>
                  Try again
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
